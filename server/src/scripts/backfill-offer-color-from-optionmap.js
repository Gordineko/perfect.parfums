import "dotenv/config";
import mongoose from "mongoose";

import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { buildDerivedOfferCharacteristics } from "../Modules/CatalogModule/utils/variationCharacteristics.js";

const WRITE = process.argv.includes("--write");
const CATEGORY_SLUG =
  getArgValue("--categorySlug") ||
  process.env.npm_config_categoryslug ||
  null;
const CATEGORY_ID =
  getArgValue("--categoryId") ||
  process.env.npm_config_categoryid ||
  null;
const LIMIT = toPositiveInteger(
  getArgValue("--limit") || process.env.npm_config_limit,
);
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const DEFAULT_COLOR_AXIS = {
  axisId: "A1",
  type: "select",
  title: { ua: "Колір", en: "Color" },
  unit: null,
  valuesPreset: [],
};

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

function json(value) {
  return JSON.stringify(value ?? null);
}

function sameJson(left, right) {
  return json(left) === json(right);
}

function getOfferRawColor(offer = {}) {
  const rawValue = offer?.optionMap?.A1;
  if (rawValue == null) return null;

  if (typeof rawValue === "object") {
    return rawValue?.label?.ua || rawValue?.value || rawValue?.label?.en || null;
  }

  const text = String(rawValue).trim();
  return text || null;
}

function getOfferColorCharacteristic(characteristics = []) {
  return (characteristics || []).find((item) => item?.key === "color") || null;
}

function buildExpectedColorCharacteristic(variationAxes = [], rawColor = null) {
  if (!rawColor) return null;

  const effectiveAxes = Array.isArray(variationAxes) ? variationAxes.filter(Boolean) : [];
  const hasColorAxis = effectiveAxes.some((axis) => String(axis?.axisId || "") === "A1");
  const axes = hasColorAxis ? effectiveAxes : [...effectiveAxes, DEFAULT_COLOR_AXIS];

  const derived = buildDerivedOfferCharacteristics(axes, { A1: rawColor }, []);
  return derived.find((item) => item?.key === "color") || null;
}

function buildNextCharacteristics(characteristics = [], nextColorCharacteristic = null) {
  const manual = (characteristics || []).filter((item) => item?.key !== "color");
  return nextColorCharacteristic ? [...manual, nextColorCharacteristic] : manual;
}

async function resolveScopedGroupIds() {
  if (!CATEGORY_SLUG && !CATEGORY_ID) {
    const groups = await ProductGroup.find({}).select({ _id: 1, variationAxes: 1, slug: 1 }).lean();
    return groups;
  }

  let rootCategory = null;

  if (CATEGORY_ID) {
    rootCategory = await Category.findById(CATEGORY_ID).lean();
  } else {
    rootCategory = await Category.findOne({
      $or: [
        { slug: CATEGORY_SLUG },
        { fullSlug: CATEGORY_SLUG },
      ],
    })
      .sort({ parentId: 1 })
      .lean();
  }

  if (!rootCategory) {
    throw new Error(`Category not found for scope: ${CATEGORY_ID || CATEGORY_SLUG}`);
  }

  const branchCategories = await Category.find({
    $or: [{ _id: rootCategory._id }, { ancestors: rootCategory._id }],
  })
    .select({ _id: 1 })
    .lean();

  const categoryIds = branchCategories.map((item) => item._id);
  return ProductGroup.find({ categoryIds: { $in: categoryIds } })
    .select({ _id: 1, variationAxes: 1, slug: 1 })
    .lean();
}

async function main() {
  await mongoose.connect(MONGO_URI);

  try {
    const groups = await resolveScopedGroupIds();
    const groupMap = new Map(groups.map((group) => [String(group._id), group]));
    const groupIds = groups.map((group) => group._id);

    const offerQuery = {
      groupId: { $in: groupIds },
      "optionMap.A1": { $nin: [null, ""] },
    };

    const cursor = Offer.find(offerQuery)
      .select({ _id: 1, sku: 1, groupId: 1, optionMap: 1, characteristics: 1 })
      .lean()
      .cursor();

    let scanned = 0;
    let changed = 0;
    let written = 0;
    const examples = [];

    for await (const offer of cursor) {
      scanned += 1;
      if (LIMIT && scanned > LIMIT) break;

      const rawColor = getOfferRawColor(offer);
      const group = groupMap.get(String(offer.groupId));
      const expectedColorCharacteristic = buildExpectedColorCharacteristic(group?.variationAxes || [], rawColor);
      const currentColorCharacteristic = getOfferColorCharacteristic(offer?.characteristics || []);

      if (sameJson(currentColorCharacteristic, expectedColorCharacteristic)) {
        continue;
      }

      changed += 1;
      if (examples.length < 20) {
        examples.push({
          sku: offer?.sku || null,
          groupSlug: group?.slug || null,
          optionColor: rawColor,
          currentColor: currentColorCharacteristic,
          nextColor: expectedColorCharacteristic,
        });
      }

      if (!WRITE) {
        continue;
      }

      const nextCharacteristics = buildNextCharacteristics(
        offer?.characteristics || [],
        expectedColorCharacteristic,
      );

      const result = await Offer.updateOne(
        { _id: offer._id },
        { $set: { characteristics: nextCharacteristics } },
      );

      if (result.modifiedCount > 0) {
        written += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          write: WRITE,
          categorySlug: CATEGORY_SLUG,
          categoryId: CATEGORY_ID,
          limit: LIMIT,
          scanned,
          changed,
          written,
          exampleCount: examples.length,
          examples,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});