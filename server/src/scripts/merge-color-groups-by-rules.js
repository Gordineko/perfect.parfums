import "dotenv/config";
import mongoose from "mongoose";

import { CharacteristicMeta } from "../Modules/CatalogModule/Models/CharacteristicMeta.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { makeOptionKey, makeOptionMapFromAxes } from "../Modules/CatalogModule/utils/options.js";

const SCRIPT_NAME = "merge-color-groups-by-rules";
const CLI_ARGS = new Set(process.argv.slice(2));
const WRITE =
  CLI_ARGS.has("--write") ||
  String(process.env.npm_config_write || "").toLowerCase() === "true";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/woh?authSource=admin";

const COLOR_KEY = "color";
const COLOR_AXIS_ID = "A1";

const COLOR_GROUP_RULES = [
  {
    canonical: {
      value: "Блакитний",
      label: { ua: "Блакитний", en: "Blue" },
    },
    aliases: [
      "ніжно-блакитний",
      "ніжно блакитний",
      "світло-блакитний",
      "світло блакитний",
      "блакитний",
      "голубий",
      "голубой",
      "blue",
      "holubyy",
      "holuboi",
      "blakytnyy",
    ],
  },
  {
    canonical: {
      value: "Рожевий",
      label: { ua: "Рожевий", en: "Pink" },
    },
    aliases: ["світло-рожевий", "світло рожевий", "рожевий", "pink", "rozhevyy"],
  },
  {
    canonical: {
      value: "Бежевий",
      label: { ua: "Бежевий", en: "Beige" },
    },
    aliases: ["бежевий", "бежево-рожеві", "бежево рожеві", "beige", "bezhevo-rozhevi"],
  },
  {
    canonical: {
      value: "Бургунді",
      label: { ua: "Бургунді", en: "Burgundy" },
    },
    aliases: ["бургунді", "бордо", "бордовий", "bordovyy", "bordo", "burhundi"],
  },
  {
    canonical: {
      value: "Лимонний",
      label: { ua: "Лимонний", en: "Lemon" },
    },
    aliases: ["лимонний", "лимонно-жовтий", "лимонно жовтий", "lymonnyy", "lymonno-zhovtyy"],
  },
  {
    canonical: {
      value: "Чорний пітон",
      label: { ua: "Чорний пітон", en: "Black python" },
    },
    aliases: [
      "чорний пітон",
      "чорний пітом",
      "черный питон",
      "змія",
      "змея",
      "snake",
      "zmiya",
      "chornyy-pyton",
    ],
  },
  {
    canonical: {
      value: "Золотий",
      label: { ua: "Золотий", en: "Gold" },
    },
    aliases: ["золотий", "золото", "gold", "zoloto", "zolotyy"],
  },
];

const COLOR_LOOKUP = new Map();
for (const rule of COLOR_GROUP_RULES) {
  const candidates = [
    rule.canonical.value,
    rule.canonical.label.ua,
    rule.canonical.label.en,
    ...rule.aliases,
  ];
  for (const candidate of candidates) {
    COLOR_LOOKUP.set(normalizeToken(candidate), rule.canonical);
  }
}

function normalizeToken(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()'"`’]/g, " ")
    .replace(/[\/_.,;:+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function json(value) {
  return JSON.stringify(value ?? null);
}

function isColorAxis(axis = {}) {
  return String(axis?.axisId || "").trim() === COLOR_AXIS_ID;
}

function resolveCanonicalColor(rawValue) {
  const candidates =
    rawValue && typeof rawValue === "object"
      ? [rawValue.value, rawValue.label?.ua, rawValue.label?.en]
      : [rawValue];

  for (const candidate of candidates) {
    const canonical = COLOR_LOOKUP.get(normalizeToken(candidate));
    if (canonical) return canonical;
  }

  return null;
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

function normalizeColorPreset(rawValue) {
  const canonical = resolveCanonicalColor(rawValue);
  if (!canonical) {
    if (rawValue && typeof rawValue === "object") {
      return {
        value: String(rawValue.value ?? "").trim(),
        label: {
          ua: String(rawValue.label?.ua ?? rawValue.value ?? "").trim(),
          en: String(rawValue.label?.en ?? rawValue.label?.ua ?? rawValue.value ?? "").trim(),
        },
      };
    }

    const text = String(rawValue ?? "").trim();
    return {
      value: text,
      label: { ua: text, en: text },
    };
  }

  return {
    value: canonical.value,
    label: canonical.label,
  };
}

function normalizeColorValue(rawValue) {
  const canonical = resolveCanonicalColor(rawValue);
  if (!canonical) {
    return rawValue && typeof rawValue === "object"
      ? String(rawValue.value ?? rawValue.label?.ua ?? rawValue.label?.en ?? "").trim()
      : String(rawValue ?? "").trim();
  }

  return canonical.value;
}

function normalizeCharacteristicColorArray(characteristics = []) {
  let changed = false;

  const next = (Array.isArray(characteristics) ? characteristics : []).map((item) => {
    if (!item || String(item.key || "").trim() !== COLOR_KEY) {
      return item;
    }

    if (item.type === "multiselect") {
      const rawValues = Array.isArray(item.values)
        ? item.values
        : item.value != null
          ? [item.value]
          : [];
      const normalizedValues = uniqueByValue(
        rawValues.map((rawValue) => normalizeColorPreset(rawValue))
      );
      const normalizedItem = {
        ...item,
        value: null,
        values: normalizedValues,
      };

      if (json(normalizedItem) !== json(item)) changed = true;
      return normalizedItem;
    }

    const normalizedValue = normalizeColorPreset(item.value);
    const normalizedItem = {
      ...item,
      value: normalizedValue,
      values: [],
    };

    if (json(normalizedItem) !== json(item)) changed = true;
    return normalizedItem;
  });

  return { next, changed };
}

function normalizeVariationAxes(variationAxes = []) {
  let changed = false;

  const next = (Array.isArray(variationAxes) ? variationAxes : []).map((axis) => {
    if (!isColorAxis(axis)) return axis;

    const normalizedValuesPreset = uniqueByValue(
      (Array.isArray(axis.valuesPreset) ? axis.valuesPreset : []).map((item) =>
        normalizeColorPreset(item)
      )
    );

    const normalizedAxis = {
      ...axis,
      valuesPreset: normalizedValuesPreset,
    };

    if (json(normalizedAxis) !== json(axis)) changed = true;
    return normalizedAxis;
  });

  return { next, changed };
}

function safeOptionMapForOffer(offer, oldAxes = []) {
  if (offer?.optionMap && typeof offer.optionMap === "object") {
    return { ...offer.optionMap };
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

async function migrateCharacteristicMeta() {
  const cursor = CharacteristicMeta.find({ key: COLOR_KEY }).cursor();
  const stats = { scanned: 0, changed: 0 };

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    stats.scanned += 1;

    const nextValuesPreset = uniqueByValue(
      (Array.isArray(doc.valuesPreset) ? doc.valuesPreset : []).map((item) =>
        normalizeColorPreset(item)
      )
    );

    if (json(doc.valuesPreset || []) === json(nextValuesPreset)) {
      continue;
    }

    doc.valuesPreset = nextValuesPreset;
    stats.changed += 1;

    if (WRITE) {
      await doc.save({ validateBeforeSave: false });
    }
  }

  return stats;
}

async function migrateGroupsAndOffers() {
  const cursor = ProductGroup.find({}).select({ _id: 1, slug: 1, variationAxes: 1, characteristics: 1 }).cursor();
  const stats = {
    scannedGroups: 0,
    changedGroups: 0,
    changedGroupVariationAxes: 0,
    changedGroupCharacteristics: 0,
    scannedOffers: 0,
    changedOffers: 0,
    changedOfferOptionMap: 0,
    changedOfferOptionValues: 0,
    changedOfferOptionKey: 0,
    changedOfferCharacteristics: 0,
    skippedGroupsByCollision: 0,
    sampleChangedSlugs: [],
    sampleCollisionSlugs: [],
  };

  for (let group = await cursor.next(); group != null; group = await cursor.next()) {
    stats.scannedGroups += 1;

    const normalizedAxes = normalizeVariationAxes(group.variationAxes || []);
    const normalizedGroupCharacteristics = normalizeCharacteristicColorArray(group.characteristics || []);

    const axesChanged = normalizedAxes.changed;
    const groupCharacteristicsChanged = normalizedGroupCharacteristics.changed;

    const offers = await Offer.find({ groupId: group._id })
      .select({ _id: 1, optionMap: 1, optionValues: 1, optionKey: 1, characteristics: 1 })
      .lean();

    stats.scannedOffers += offers.length;

    const preparedOffers = [];
    const newKeyToOldKeys = new Map();
    let hasIntroducedCollision = false;

    for (const offer of offers) {
      const oldOptionMap = safeOptionMapForOffer(offer, group.variationAxes || []);
      const nextOptionMap = { ...oldOptionMap };

      if (Object.prototype.hasOwnProperty.call(nextOptionMap, COLOR_AXIS_ID)) {
        nextOptionMap[COLOR_AXIS_ID] = normalizeColorValue(nextOptionMap[COLOR_AXIS_ID]);
      }

      const nextOptionValues = buildOptionValuesFromMap(
        normalizedAxes.next,
        nextOptionMap
      );
      const nextOptionKey = makeOptionKey(nextOptionValues);

      const oldOptionKey = String(offer.optionKey || "");
      if (!newKeyToOldKeys.has(nextOptionKey)) {
        newKeyToOldKeys.set(nextOptionKey, new Set());
      }
      const contributingOldKeys = newKeyToOldKeys.get(nextOptionKey);
      contributingOldKeys.add(oldOptionKey);
      if (contributingOldKeys.size > 1) {
        hasIntroducedCollision = true;
      }

      const normalizedOfferCharacteristics = normalizeCharacteristicColorArray(offer.characteristics || []);

      const optionMapChanged = json(offer.optionMap || {}) !== json(nextOptionMap);
      const optionValuesChanged = json(offer.optionValues || []) !== json(nextOptionValues);
      const optionKeyChanged = String(offer.optionKey || "") !== nextOptionKey;
      const offerCharacteristicsChanged = normalizedOfferCharacteristics.changed;

      preparedOffers.push({
        _id: offer._id,
        nextOptionMap,
        nextOptionValues,
        nextOptionKey,
        nextCharacteristics: normalizedOfferCharacteristics.next,
        optionMapChanged,
        optionValuesChanged,
        optionKeyChanged,
        offerCharacteristicsChanged,
      });
    }

    const hasOfferKeyRewrites = preparedOffers.some(
      (offer) => offer.optionMapChanged || offer.optionValuesChanged || offer.optionKeyChanged
    );

    if (hasIntroducedCollision && hasOfferKeyRewrites) {
      stats.skippedGroupsByCollision += 1;
      if (stats.sampleCollisionSlugs.length < 20) {
        stats.sampleCollisionSlugs.push(group.slug);
      }
      continue;
    }

    if (!axesChanged && !groupCharacteristicsChanged && !preparedOffers.some(
      (offer) =>
        offer.optionMapChanged ||
        offer.optionValuesChanged ||
        offer.optionKeyChanged ||
        offer.offerCharacteristicsChanged
    )) {
      continue;
    }

    stats.changedGroups += 1;
    if (axesChanged) stats.changedGroupVariationAxes += 1;
    if (groupCharacteristicsChanged) stats.changedGroupCharacteristics += 1;
    if (stats.sampleChangedSlugs.length < 20) {
      stats.sampleChangedSlugs.push(group.slug);
    }

    for (const prepared of preparedOffers) {
      if (
        !prepared.optionMapChanged &&
        !prepared.optionValuesChanged &&
        !prepared.optionKeyChanged &&
        !prepared.offerCharacteristicsChanged
      ) {
        continue;
      }

      stats.changedOffers += 1;
      if (prepared.optionMapChanged) stats.changedOfferOptionMap += 1;
      if (prepared.optionValuesChanged) stats.changedOfferOptionValues += 1;
      if (prepared.optionKeyChanged) stats.changedOfferOptionKey += 1;
      if (prepared.offerCharacteristicsChanged) stats.changedOfferCharacteristics += 1;

      if (WRITE) {
        await Offer.updateOne(
          { _id: prepared._id },
          {
            $set: {
              optionMap: prepared.nextOptionMap,
              optionValues: prepared.nextOptionValues,
              optionKey: prepared.nextOptionKey,
              characteristics: prepared.nextCharacteristics,
            },
          }
        );
      }
    }

    if (WRITE) {
      await ProductGroup.updateOne(
        { _id: group._id },
        {
          $set: {
            variationAxes: normalizedAxes.next,
            characteristics: normalizedGroupCharacteristics.next,
          },
        }
      );
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
    groups: COLOR_GROUP_RULES.map((rule) => rule.canonical.value),
  });

  await mongoose.connect(MONGO_URI);

  try {
    const metaStats = await migrateCharacteristicMeta();
    const groupOfferStats = await migrateGroupsAndOffers();

    console.log(`\n=== ${SCRIPT_NAME} summary ===`);
    console.log(
      JSON.stringify(
        {
          mode: WRITE ? "write" : "dry-run",
          characteristicMeta: metaStats,
          catalog: groupOfferStats,
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