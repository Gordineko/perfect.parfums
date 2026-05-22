import "dotenv/config";
import mongoose from "mongoose";
import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { mergeVariationTemplateAxes } from "../Modules/CatalogModule/utils/variationTemplate.js";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const CLI_ARGS = new Set(process.argv.slice(2));
const DRY_RUN = CLI_ARGS.has("--write")
  ? false
  : String(process.env.DRY_RUN || "true").toLowerCase() !== "false";
const BATCH_SIZE = Math.max(1, Number(process.env.BATCH_SIZE || 200));

function isSameTemplate(left = [], right = []) {
  return JSON.stringify(left || []) === JSON.stringify(right || []);
}

async function main() {
  if (!MONGO_URI) {
    throw new Error("Set MONGO_URI or MONGODB_URI");
  }

  console.log("[migrate-category-variation-template] starting", {
    mode: DRY_RUN ? "dry-run" : "write",
    batchSize: BATCH_SIZE,
    mongoUri: MONGO_URI,
  });

  await mongoose.connect(MONGO_URI);

  const stats = {
    scannedGroups: 0,
    groupsWithAxes: 0,
    groupRootLinksResolved: 0,
    rootCategoriesTouched: 0,
    rootCategoriesMatched: 0,
    modified: 0,
  };

  const categoryCache = new Map();
  const rootStateById = new Map();

  async function getCategoryCached(categoryId) {
    const key = String(categoryId);
    if (!categoryCache.has(key)) {
      categoryCache.set(key, await Category.findById(categoryId).lean());
    }
    return categoryCache.get(key);
  }

  async function resolveRootCategoryId(category) {
    if (!category) return null;
    if (!category.parentId) return category._id;

    if (Array.isArray(category.ancestors) && category.ancestors.length) {
      return category.ancestors[0];
    }

    let current = category;
    const visited = new Set();

    while (current?.parentId) {
      const parentKey = String(current.parentId);
      if (visited.has(parentKey)) {
        throw new Error(
          `Category parent cycle detected while resolving root for ${category._id}`
        );
      }

      visited.add(parentKey);
      const parent = await getCategoryCached(current.parentId);
      if (!parent) {
        return current._id;
      }

      current = parent;
    }

    return current?._id || category._id;
  }

  async function getRootState(rootCategoryId) {
    const key = String(rootCategoryId);
    if (!rootStateById.has(key)) {
      const rootCategory = await Category.findById(rootCategoryId)
        .select({ _id: 1, variationTemplate: 1 })
        .lean();

      if (!rootCategory) {
        throw new Error(`Root category not found: ${rootCategoryId}`);
      }

      rootStateById.set(key, {
        rootCategoryId: rootCategory._id,
        originalVariationTemplate: rootCategory.variationTemplate || [],
        nextVariationTemplate: rootCategory.variationTemplate || [],
      });
    }

    return rootStateById.get(key);
  }

  const cursor = ProductGroup.find({
    categoryIds: { $exists: true, $ne: [] },
    variationAxes: { $exists: true, $ne: [] },
  })
    .select({ _id: 1, slug: 1, categoryIds: 1, variationAxes: 1 })
    .lean()
    .cursor();

  for await (const group of cursor) {
    stats.scannedGroups += 1;

    if (!Array.isArray(group.variationAxes) || !group.variationAxes.length) {
      continue;
    }

    stats.groupsWithAxes += 1;

    const rootIds = new Set();
    for (const categoryId of group.categoryIds || []) {
      const category = await getCategoryCached(categoryId);
      if (!category) continue;
      const rootCategoryId = await resolveRootCategoryId(category);
      if (rootCategoryId) {
        rootIds.add(String(rootCategoryId));
      }
    }

    stats.groupRootLinksResolved += rootIds.size;

    for (const rootId of rootIds) {
      const rootState = await getRootState(rootId);
      const mergedTemplate = mergeVariationTemplateAxes(
        rootState.nextVariationTemplate,
        group.variationAxes || []
      );

      if (!isSameTemplate(rootState.nextVariationTemplate, mergedTemplate)) {
        rootState.nextVariationTemplate = mergedTemplate;
        stats.rootCategoriesTouched += 1;
      }
    }
  }

  const ops = [];
  for (const rootState of rootStateById.values()) {
    if (isSameTemplate(rootState.originalVariationTemplate, rootState.nextVariationTemplate)) {
      continue;
    }

    stats.rootCategoriesMatched += 1;
    ops.push({
      updateOne: {
        filter: { _id: rootState.rootCategoryId },
        update: {
          $set: {
            variationTemplate: rootState.nextVariationTemplate,
          },
        },
      },
    });
  }

  if (!DRY_RUN) {
    for (let index = 0; index < ops.length; index += BATCH_SIZE) {
      const chunk = ops.slice(index, index + BATCH_SIZE);
      if (!chunk.length) continue;

      const result = await Category.bulkWrite(chunk, { ordered: false });
      stats.modified += result.modifiedCount || 0;
    }
  }

  console.log("[migrate-category-variation-template] done", {
    dryRun: DRY_RUN,
    scannedGroups: stats.scannedGroups,
    groupsWithAxes: stats.groupsWithAxes,
    groupRootLinksResolved: stats.groupRootLinksResolved,
    rootCategoriesResolved: rootStateById.size,
    rootCategoriesTouched: stats.rootCategoriesTouched,
    rootCategoriesMatched: stats.rootCategoriesMatched,
    modified: DRY_RUN ? 0 : stats.modified,
  });

  if (DRY_RUN) {
    console.log(
      "[migrate-category-variation-template] dry-run only. Re-run with --write or DRY_RUN=false to apply changes."
    );
  }

  await mongoose.disconnect();
}
main().catch(async (error) => {
  console.error("[migrate-category-variation-template] failed", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});