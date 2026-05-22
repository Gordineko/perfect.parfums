import "dotenv/config";
import mongoose from "mongoose";

import { CharacteristicMeta } from "../Modules/CatalogModule/Models/CharacteristicMeta.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import {
  normalizeCharacteristicMetaEntry,
  resolveCanonicalPresetForKey,
} from "../Modules/CatalogModule/utils/variationCharacteristics.js";

const SCRIPT_NAME = "merge-color-families";
const CLI_ARGS = new Set(process.argv.slice(2));
const WRITE =
  CLI_ARGS.has("--write") ||
  String(process.env.npm_config_write || "").toLowerCase() === "true";
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const COLOR_KEY = "color";

function json(value) {
  return JSON.stringify(value ?? null);
}

function uniquePresetsByValue(items = []) {
  const out = [];
  const seen = new Set();

  for (const item of items) {
    const value = String(item?.value || "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(item);
  }

  return out;
}

function normalizeColorPreset(rawValue) {
  const canonical = resolveCanonicalPresetForKey(COLOR_KEY, rawValue);
  return {
    value: canonical?.value ?? String(rawValue ?? "").trim(),
    label: canonical?.label ?? { ua: String(rawValue ?? "").trim(), en: String(rawValue ?? "").trim() },
  };
}

function normalizeColorValuesPreset(valuesPreset = []) {
  return uniquePresetsByValue(
    (Array.isArray(valuesPreset) ? valuesPreset : []).map(normalizeColorPreset)
  );
}

function normalizeColorCharacteristicArray(characteristics = []) {
  let changed = false;

  const next = (Array.isArray(characteristics) ? characteristics : []).map((item) => {
    if (!item || String(item.key || "").trim() !== COLOR_KEY) {
      return item;
    }

    if (item.type === "select") {
      const normalizedValue = normalizeColorPreset(item.value);
      const normalizedItem = {
        ...item,
        value: normalizedValue,
        values: [],
      };

      if (json(normalizedItem) !== json(item)) {
        changed = true;
      }

      return normalizedItem;
    }

    if (item.type === "multiselect") {
      const rawValues = Array.isArray(item.values)
        ? item.values
        : item.value != null
          ? [item.value]
          : [];
      const normalizedValues = uniquePresetsByValue(rawValues.map(normalizeColorPreset));
      const normalizedItem = {
        ...item,
        value: null,
        values: normalizedValues,
      };

      if (json(normalizedItem) !== json(item)) {
        changed = true;
      }

      return normalizedItem;
    }

    return item;
  });

  return { next, changed };
}

async function migrateCharacteristicMeta() {
  const cursor = CharacteristicMeta.find({ key: COLOR_KEY }).cursor();
  const stats = { scanned: 0, changed: 0 };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const normalizedMeta = normalizeCharacteristicMetaEntry(doc.toObject());
    const nextValuesPreset = normalizeColorValuesPreset(normalizedMeta.valuesPreset || []);
    const nextTitle = normalizedMeta.title ?? doc.title;
    const hasChanges =
      json(doc.valuesPreset || []) !== json(nextValuesPreset) ||
      json(doc.title || {}) !== json(nextTitle);

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

async function migrateProductGroups() {
  const cursor = ProductGroup.find({}).cursor();
  const stats = { scanned: 0, changed: 0, characteristicsChanged: 0 };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const normalizedCharacteristics = normalizeColorCharacteristicArray(doc.characteristics || []);
    const characteristicsChanged = normalizedCharacteristics.changed;

    if (!characteristicsChanged) {
      continue;
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
  const cursor = Offer.find({}).cursor();
  const stats = {
    scanned: 0,
    changed: 0,
    characteristicsChanged: 0,
  };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const normalizedCharacteristics = normalizeColorCharacteristicArray(doc.characteristics || []);
    const characteristicsChanged = normalizedCharacteristics.changed;

    if (!characteristicsChanged) {
      continue;
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
  if (!MONGO_URI) {
    throw new Error("Set MONGO_URI or MONGODB_URI");
  }

  console.log(`[${SCRIPT_NAME}] starting`, {
    mode: WRITE ? "write" : "dry-run",
    mongoUri: MONGO_URI,
  });

  await mongoose.connect(MONGO_URI);

  try {
    const metaStats = await migrateCharacteristicMeta();
    const groupStats = await migrateProductGroups();
    const offerStats = await migrateOffers();

    console.log(`\n=== ${SCRIPT_NAME} summary ===`);
    console.log(
      JSON.stringify(
        {
          mode: WRITE ? "write" : "dry-run",
          characteristicMeta: metaStats,
          productGroups: groupStats,
          offers: offerStats,
        },
        null,
        2
      )
    );

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