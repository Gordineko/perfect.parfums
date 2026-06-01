import "dotenv/config";
import mongoose from "mongoose";

import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { ReviewModel } from "../Modules/ReviewModule/Models/Review.model.js";

const WRITE = process.argv.includes("--write");
const LIMIT = toPositiveInteger(getArgValue("--limit") || process.env.npm_config_limit);
const PRODUCT_ID = getArgValue("--productId") || process.env.npm_config_productid || null;
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

function getArgValue(flag) {
  const exact = process.argv.find((item) => item.startsWith(`${flag}=`));
  if (exact) {
    return exact.slice(flag.length + 1).trim() || null;
  }

  const index = process.argv.indexOf(flag);
  if (index === -1) return null;

  const next = process.argv[index + 1];
  if (!next || next.startsWith("--")) return null;

  return String(next).trim() || null;
}

function toPositiveInteger(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function normalizeRatingSummary(summary = null) {
  return {
    average: Number(Number(summary?.average || 0).toFixed(2)),
    count: Number(summary?.count || 0),
  };
}

function sameSummary(left, right) {
  return (
    Number(left?.average || 0) === Number(right?.average || 0) &&
    Number(left?.count || 0) === Number(right?.count || 0)
  );
}

async function loadGroups() {
  const filter = {};

  if (PRODUCT_ID) {
    if (!mongoose.Types.ObjectId.isValid(PRODUCT_ID)) {
      throw new Error(`Invalid productId: ${PRODUCT_ID}`);
    }

    filter._id = PRODUCT_ID;
  }

  let query = ProductGroup.find(filter)
    .select({ _id: 1, slug: 1, title: 1, ratingSummary: 1 })
    .sort({ _id: 1 });

  if (LIMIT) {
    query = query.limit(LIMIT);
  }

  return query.lean();
}

async function buildSummaryMap(groupIds = []) {
  if (!groupIds.length) return new Map();

  const rows = await ReviewModel.aggregate([
    {
      $match: {
        product: { $in: groupIds },
        status: "published",
      },
    },
    {
      $group: {
        _id: "$product",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      normalizeRatingSummary({ average: row.average, count: row.count }),
    ])
  );
}

async function main() {
  await mongoose.connect(MONGO_URI);

  try {
    const groups = await loadGroups();
    const summaryMap = await buildSummaryMap(groups.map((group) => group._id));

    let scanned = 0;
    let changed = 0;
    let written = 0;
    const examples = [];

    for (const group of groups) {
      scanned += 1;

      const currentSummary = normalizeRatingSummary(group.ratingSummary);
      const nextSummary = summaryMap.get(String(group._id)) || { average: 0, count: 0 };

      if (sameSummary(currentSummary, nextSummary)) {
        continue;
      }

      changed += 1;

      if (examples.length < 20) {
        examples.push({
          groupId: String(group._id),
          slug: group.slug || null,
          title: group.title || null,
          currentSummary,
          nextSummary,
        });
      }

      if (!WRITE) {
        continue;
      }

      const result = await ProductGroup.updateOne(
        { _id: group._id },
        { $set: { ratingSummary: nextSummary } }
      );

      if (result.modifiedCount > 0) {
        written += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          write: WRITE,
          productId: PRODUCT_ID,
          limit: LIMIT,
          scanned,
          changed,
          written,
          exampleCount: examples.length,
          examples,
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});