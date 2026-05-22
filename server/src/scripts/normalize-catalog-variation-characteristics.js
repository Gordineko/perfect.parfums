import "dotenv/config";
import mongoose from "mongoose";

import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import { CharacteristicMeta } from "../Modules/CatalogModule/Models/CharacteristicMeta.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import {
  normalizeCharacteristicMetaEntry,
  normalizeOptionMapByVariationAxes,
  normalizeVariationAxesDefinitions,
  resolveCanonicalPresetForKey,
} from "../Modules/CatalogModule/utils/variationCharacteristics.js";

const WRITE = process.argv.includes("--write");
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const TARGET_KEYS = new Set(["color", "soleType", "heelType", "material", "size", "variant"]);

function json(value) {
  return JSON.stringify(value ?? null);
}

function isTargetKey(key) {
  return TARGET_KEYS.has(String(key || "").trim());
}

function uniqueByValue(items = []) {
  const result = [];
  const seen = new Set();

  for (const item of items) {
    const value = String(item?.value || "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(item);
  }

  return result;
}

function normalizeSelectValue(key, rawValue) {
  const canonical = resolveCanonicalPresetForKey(key, rawValue);
  return {
    value: canonical.value,
    label: canonical.label,
  };
}

function normalizeVariationAxisList(axes = []) {
  return normalizeVariationAxesDefinitions(Array.isArray(axes) ? axes : []);
}

function buildOptionValuesFromMap(variationAxes = [], optionMap = {}) {
  return variationAxes.map((axis) => optionMap?.[axis.axisId] ?? null);
}

function buildOptionKey(optionValues = []) {
  return optionValues.map((value) => String(value ?? "")).join("|");
}

function normalizeCharacteristicDocArray(characteristics = []) {
  let changed = false;

  const next = (Array.isArray(characteristics) ? characteristics : []).map((item) => {
    if (!item || !item.key || !isTargetKey(item.key)) return item;

    const key = String(item.key).trim();

    if (item.type === "select") {
      const normalizedValue = normalizeSelectValue(key, item.value);
      const normalizedItem = {
        ...item,
        value: normalizedValue,
        values: [],
      };

      if (json(normalizedItem) !== json(item)) changed = true;
      return normalizedItem;
    }

    if (item.type === "multiselect") {
      const rawValues = Array.isArray(item.values)
        ? item.values
        : item.value != null
          ? [item.value]
          : [];

      const normalizedValues = uniqueByValue(
        rawValues.map((rawValue) => normalizeSelectValue(key, rawValue))
      );

      const normalizedItem = {
        ...item,
        value: null,
        values: normalizedValues,
      };

      if (json(normalizedItem) !== json(item)) changed = true;
      return normalizedItem;
    }

    return item;
  });

  return { next, changed };
}

async function migrateCharacteristicMetas() {
  const cursor = CharacteristicMeta.find({ key: { $in: [...TARGET_KEYS] } }).cursor();
  const stats = { scanned: 0, changed: 0 };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const nextMeta = normalizeCharacteristicMetaEntry(doc.toObject());
    const nextValuesPreset = Array.isArray(nextMeta.valuesPreset) ? nextMeta.valuesPreset : [];
    const nextTitle = nextMeta.title ?? doc.title;

    const hasChanges = json(doc.valuesPreset) !== json(nextValuesPreset) || json(doc.title) !== json(nextTitle);
    if (!hasChanges) continue;

    doc.valuesPreset = nextValuesPreset;
    doc.title = nextTitle;
    stats.changed += 1;

    if (WRITE) {
      await doc.save({ validateBeforeSave: false });
    }
  }

  return stats;
}

async function migrateCategories() {
  const cursor = Category.find({ "variationTemplate.0": { $exists: true } }).cursor();
  const stats = { scanned: 0, changed: 0 };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;
    const nextVariationTemplate = normalizeVariationAxisList(doc.variationTemplate || []);
    if (json(doc.variationTemplate) === json(nextVariationTemplate)) continue;

    doc.variationTemplate = nextVariationTemplate;
    stats.changed += 1;

    if (WRITE) {
      await doc.save({ validateBeforeSave: false });
    }
  }

  return stats;
}

async function migrateProductGroups() {
  const cursor = ProductGroup.find({}).cursor();
  const stats = { scanned: 0, changed: 0, axesChanged: 0, characteristicsChanged: 0 };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const nextVariationAxes = normalizeVariationAxisList(doc.variationAxes || []);
    const normalizedCharacteristics = normalizeCharacteristicDocArray(doc.characteristics || []);

    const axesChanged = json(doc.variationAxes) !== json(nextVariationAxes);
    const characteristicsChanged = normalizedCharacteristics.changed;

    if (!axesChanged && !characteristicsChanged) continue;

    if (axesChanged) {
      doc.variationAxes = nextVariationAxes;
      stats.axesChanged += 1;
    }

    if (characteristicsChanged) {
      doc.characteristics = normalizedCharacteristics.next;
      stats.characteristicsChanged += 1;
    }

    stats.changed += 1;

    if (WRITE) {
      await doc.save({ validateBeforeSave: false });
    }
  }

  return stats;
}

async function migrateOffers() {
  const groups = await ProductGroup.find({}).select({ _id: 1, variationAxes: 1 }).lean();
  const axesByGroupId = new Map(
    groups.map((group) => [
      String(group._id),
      normalizeVariationAxisList(group.variationAxes || []),
    ])
  );

  const cursor = Offer.find({}).cursor();
  const stats = {
    scanned: 0,
    changed: 0,
    characteristicsChanged: 0,
    optionMapChanged: 0,
    optionKeyChanged: 0,
  };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const variationAxes = axesByGroupId.get(String(doc.groupId)) || [];
    const nextOptionMap = normalizeOptionMapByVariationAxes(
      variationAxes,
      doc.optionMap && typeof doc.optionMap === "object"
        ? doc.optionMap
        : {}
    );
    const nextOptionValues = buildOptionValuesFromMap(variationAxes, nextOptionMap);
    const nextOptionKey = buildOptionKey(nextOptionValues);
    const normalizedCharacteristics = normalizeCharacteristicDocArray(doc.characteristics || []);

    const optionMapChanged = json(doc.optionMap || {}) !== json(nextOptionMap);
    const optionValuesChanged = json(doc.optionValues || []) !== json(nextOptionValues);
    const optionKeyChanged = String(doc.optionKey || "") !== nextOptionKey;
    const characteristicsChanged = normalizedCharacteristics.changed;

    if (!optionMapChanged && !optionValuesChanged && !optionKeyChanged && !characteristicsChanged) {
      continue;
    }

    if (optionMapChanged) {
      doc.optionMap = nextOptionMap;
      stats.optionMapChanged += 1;
    }

    if (optionValuesChanged) {
      doc.optionValues = nextOptionValues;
    }

    if (optionKeyChanged) {
      doc.optionKey = nextOptionKey;
      stats.optionKeyChanged += 1;
    }

    if (characteristicsChanged) {
      doc.characteristics = normalizedCharacteristics.next;
      stats.characteristicsChanged += 1;
    }

    stats.changed += 1;

    if (WRITE) {
      await doc.save({ validateBeforeSave: false });
    }
  }

  return stats;
}

async function run() {
  console.log(`[normalize:variation-characteristics] mode=${WRITE ? "write" : "dry-run"}`);
  console.log(`[normalize:variation-characteristics] mongo=${MONGO_URI}`);

  await mongoose.connect(MONGO_URI);

  try {
    const metaStats = await migrateCharacteristicMetas();
    const categoryStats = await migrateCategories();
    const groupStats = await migrateProductGroups();
    const offerStats = await migrateOffers();

    console.log("\n=== normalize:variation-characteristics summary ===");
    console.log(JSON.stringify({
      mode: WRITE ? "write" : "dry-run",
      characteristicMeta: metaStats,
      categories: categoryStats,
      productGroups: groupStats,
      offers: offerStats,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});