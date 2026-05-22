import "dotenv/config";
import mongoose from "mongoose";

import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { makeOptionKey, makeOptionMapFromAxes } from "../Modules/CatalogModule/utils/options.js";

const SCRIPT_NAME = "reorder-product-variation-axes";
const CLI_ARGS = new Set(process.argv.slice(2));
const WRITE =
  CLI_ARGS.has("--write") ||
  String(process.env.npm_config_write || "").toLowerCase() === "true";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const TARGET_AXIS_ORDER = ["A1", "A7", "A5", "A3", "A4", "A2", "A6"];
const TARGET_AXIS_INDEX = new Map(TARGET_AXIS_ORDER.map((axisId, index) => [axisId, index]));

const TITLE_TO_AXIS_ID = new Map([
  ["колір", "A1"],
  ["color", "A1"],
  ["матеріал", "A7"],
  ["material", "A7"],
  ["тип підошви", "A5"],
  ["sole type", "A5"],
  ["форма підборів", "A3"],
  ["heel shape", "A3"],
  ["висота підборів", "A4"],
  ["heel height", "A4"],
  ["розмір устілки", "A2"],
  ["insole size", "A2"],
  ["розмір", "A6"],
  ["size", "A6"],
]);

function normalizeLabel(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function resolveAxisCanonicalId(axis = {}) {
  const axisId = String(axis?.axisId || "").trim();
  if (TARGET_AXIS_INDEX.has(axisId)) return axisId;

  const uaTitle = normalizeLabel(axis?.title?.ua);
  if (TITLE_TO_AXIS_ID.has(uaTitle)) return TITLE_TO_AXIS_ID.get(uaTitle);

  const enTitle = normalizeLabel(axis?.title?.en);
  if (TITLE_TO_AXIS_ID.has(enTitle)) return TITLE_TO_AXIS_ID.get(enTitle);

  return null;
}

function sortVariationAxes(variationAxes = []) {
  const source = Array.isArray(variationAxes) ? variationAxes : [];

  const decorated = source.map((axis, index) => {
    const canonicalId = resolveAxisCanonicalId(axis);
    const orderIndex =
      canonicalId && TARGET_AXIS_INDEX.has(canonicalId)
        ? TARGET_AXIS_INDEX.get(canonicalId)
        : Number.MAX_SAFE_INTEGER;

    return {
      axis,
      index,
      orderIndex,
    };
  });

  decorated.sort((left, right) => {
    if (left.orderIndex !== right.orderIndex) {
      return left.orderIndex - right.orderIndex;
    }

    return left.index - right.index;
  });

  return decorated.map((entry) => entry.axis);
}

function arraysEqual(left = [], right = []) {
  return JSON.stringify(left || []) === JSON.stringify(right || []);
}

function safeOptionMapForOffer(offer, oldAxes = []) {
  if (offer?.optionMap && typeof offer.optionMap === "object") {
    return offer.optionMap;
  }

  return makeOptionMapFromAxes({
    axes: oldAxes,
    optionValues: Array.isArray(offer?.optionValues) ? offer.optionValues : [],
  });
}

function buildOptionValuesFromMap(variationAxes = [], optionMap = {}) {
  return variationAxes.map((axis) => {
    const axisId = axis?.axisId;
    if (!axisId) return null;
    const value = optionMap?.[axisId];
    return value === undefined ? null : value;
  });
}

async function reorderProductGroupAxes() {
  const cursor = ProductGroup.find({ "variationAxes.0": { $exists: true } })
    .select({ _id: 1, slug: 1, variationAxes: 1 })
    .cursor();

  const changedGroups = new Map();
  const stats = {
    scanned: 0,
    changed: 0,
    unchanged: 0,
    sampleChangedSlugs: [],
  };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const oldAxes = Array.isArray(doc.variationAxes) ? doc.variationAxes : [];
    const newAxes = sortVariationAxes(oldAxes);

    if (arraysEqual(oldAxes, newAxes)) {
      stats.unchanged += 1;
      continue;
    }

    changedGroups.set(String(doc._id), {
      oldAxes,
      newAxes,
      slug: doc.slug,
    });

    if (stats.sampleChangedSlugs.length < 20) {
      stats.sampleChangedSlugs.push(doc.slug);
    }

    stats.changed += 1;

    if (WRITE) {
      doc.variationAxes = newAxes;
      await doc.save({ validateBeforeSave: false });
    }
  }

  return { changedGroups, stats };
}

async function reorderOfferOptionValues(changedGroups = new Map()) {
  if (!changedGroups.size) {
    return {
      scanned: 0,
      changed: 0,
      optionValuesChanged: 0,
      optionKeyChanged: 0,
      groupsTouched: 0,
    };
  }

  const groupIds = [...changedGroups.keys()].map((id) => new mongoose.Types.ObjectId(id));
  const cursor = Offer.find({ groupId: { $in: groupIds } })
    .select({ _id: 1, groupId: 1, optionMap: 1, optionValues: 1, optionKey: 1 })
    .cursor();

  const stats = {
    scanned: 0,
    changed: 0,
    optionValuesChanged: 0,
    optionKeyChanged: 0,
    groupsTouched: changedGroups.size,
  };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const groupState = changedGroups.get(String(doc.groupId));
    if (!groupState) continue;

    const optionMap = safeOptionMapForOffer(doc, groupState.oldAxes);
    const nextOptionValues = buildOptionValuesFromMap(groupState.newAxes, optionMap);
    const nextOptionKey = makeOptionKey(nextOptionValues);

    const optionValuesChanged = !arraysEqual(doc.optionValues || [], nextOptionValues);
    const optionKeyChanged = String(doc.optionKey || "") !== nextOptionKey;

    if (!optionValuesChanged && !optionKeyChanged) {
      continue;
    }

    stats.changed += 1;
    if (optionValuesChanged) stats.optionValuesChanged += 1;
    if (optionKeyChanged) stats.optionKeyChanged += 1;

    if (WRITE) {
      doc.optionValues = nextOptionValues;
      doc.optionKey = nextOptionKey;
      await doc.save({ validateBeforeSave: false });
    }
  }

  return stats;
}

async function run() {
  if (!MONGO_URI) {
    throw new Error("Set MONGO_URI or MONGODB_URI");
  }

  console.log(`[${SCRIPT_NAME}] starting`, {
    mode: WRITE ? "write" : "dry-run",
    mongoUri: MONGO_URI,
    targetAxisOrder: TARGET_AXIS_ORDER,
  });

  await mongoose.connect(MONGO_URI);

  try {
    const groupsResult = await reorderProductGroupAxes();
    const offersStats = await reorderOfferOptionValues(groupsResult.changedGroups);

    const summary = {
      mode: WRITE ? "write" : "dry-run",
      productGroups: groupsResult.stats,
      offers: offersStats,
    };

    console.log(`\n=== ${SCRIPT_NAME} summary ===`);
    console.log(JSON.stringify(summary, null, 2));

    if (!WRITE) {
      console.log(`[${SCRIPT_NAME}] dry-run only. Re-run with --write to apply changes.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(async (error) => {
  console.error(`[${SCRIPT_NAME}] failed`, error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});