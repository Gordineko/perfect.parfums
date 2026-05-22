import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import xlsx from "xlsx";

import { CharacteristicMeta } from "../Modules/CatalogModule/Models/CharacteristicMeta.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import {
  buildOptionKey,
  buildOptionMapFromValues,
  buildOptionValuesFromMap,
} from "../Modules/CatalogModule/utils/catalogAdmin.helpers.js";
import {
  localized,
  resolveCanonicalPresetForKey,
} from "../Modules/CatalogModule/utils/variationCharacteristics.js";

const WRITE = process.argv.includes("--write");
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(SCRIPT_DIR, "../..");
const WORKBOOK_PATH =
  process.env.KEYCRM_XLSX_PATH
    ? path.isAbsolute(process.env.KEYCRM_XLSX_PATH)
      ? process.env.KEYCRM_XLSX_PATH
      : path.resolve(SERVER_ROOT, process.env.KEYCRM_XLSX_PATH)
    : path.resolve(SERVER_ROOT, "keycrm-export.xlsx");
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const PROPERTY_ALIASES = {
  color: new Set(["колір", "цвет", "color"]),
};
const COLOR_AXIS_ID = "A1";
const COLOR_META_KEY = "color";
const COLOR_LABEL_ALIASES = new Map([
  ["чорні", "Чорний"],
  ["черные", "Чорний"],
  ["білі", "Білий"],
  ["белые", "Білий"],
  ["беж", "Бежевий"],
  ["бежевые", "Бежевий"],
  ["бежеві", "Бежевий"],
  ["розовий", "Рожевий"],
  ["розовые", "Рожевий"],
  ["шоколадні", "Шоколадний"],
  ["шоколадний", "Шоколадний"],
  ["шоколадные", "Шоколадний"],
  ["sriblo", "Срібло"],
  ["sriblo matovyy", "Срібло (матовий)"],
  ["temno bezhevyy", "Темно-бежевий"],
  ["nizhno blakytnyy", "Ніжно-блакитний"],
  ["burhundi piton", "Бургунді Пітон"],
  ["chornyy pyton", "Чорний питон"],
  ["rozhevyy pyton", "Рожевий питон"],
  ["shokoladnyy pyton", "Шоколадний питон"],
]);

function json(value) {
  return JSON.stringify(value ?? null);
}

function sameJson(left, right) {
  return json(left) === json(right);
}

function safeJsonParse(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function normalizePropertyName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOfferProperties(value) {
  const parsed = safeJsonParse(value, []);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      name: String(item?.name || "").trim(),
      value: String(item?.value || "").trim(),
    }))
    .filter((item) => item.name && item.value);
}

function parseProductCharacteristicsMap(value) {
  const parsed = safeJsonParse(value, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  return Object.fromEntries(
    Object.entries(parsed)
      .map(([key, rawValue]) => {
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];
        const normalizedValues = values
          .map((item) => String(item || "").trim())
          .filter(Boolean);
        return [String(key || "").trim(), normalizedValues];
      })
      .filter(([key, values]) => key && values.length)
  );
}

function buildPropertyLookup({ productCharacteristics = {}, offerProperties = [] }) {
  const lookup = new Map();

  for (const [rawName, rawValues] of Object.entries(productCharacteristics || {})) {
    const key = normalizePropertyName(rawName);
    const values = Array.isArray(rawValues)
      ? rawValues.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    if (!key || !values.length) continue;
    lookup.set(key, { rawName, values });
  }

  for (const item of offerProperties) {
    const key = normalizePropertyName(item.name);
    if (!key || !item.value) continue;
    lookup.set(key, { rawName: item.name, values: [item.value] });
  }

  return lookup;
}

function getLookupEntry(lookup, aliases) {
  for (const alias of aliases) {
    const key = normalizePropertyName(alias);
    if (lookup.has(key)) {
      return { key, entry: lookup.get(key) };
    }
  }

  return null;
}

function chunk(items = [], size = 500) {
  const out = [];

  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }

  return out;
}

function normalizeColorAliasKey(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()'"`’]/g, " ")
    .replace(/[\\/_.,;:+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseColorLabel(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeWorkbookColorLabel(rawColor) {
  const aliasKey = normalizeColorAliasKey(rawColor);
  const aliased = COLOR_LABEL_ALIASES.get(aliasKey);
  if (aliased) {
    return aliased;
  }

  const canonical = resolveCanonicalPresetForKey(COLOR_META_KEY, rawColor);
  const canonicalLabel = String(canonical?.label?.ua || "").trim();
  if (canonicalLabel) {
    return canonicalLabel;
  }

  return titleCaseColorLabel(rawColor);
}

function normalizeRawColorValue(value) {
  return normalizeWorkbookColorLabel(value);
}

function extractOfferColor(offer = {}) {
  const optionMapColor = String(offer?.optionMap?.[COLOR_AXIS_ID] || "").trim();
  if (optionMapColor) {
    return optionMapColor;
  }

  for (const item of Array.isArray(offer?.characteristics) ? offer.characteristics : []) {
    if (String(item?.key || "").trim().toLowerCase() !== COLOR_META_KEY) continue;
    const rawValue = item?.value ?? item?.values?.[0] ?? "";
    const normalized = String(rawValue || "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function buildRawColorPreset(rawColor, existingPreset = null) {
  const normalizedValue = normalizeRawColorValue(rawColor);
  const existingLabel =
    existingPreset && typeof existingPreset === "object" && existingPreset.label && typeof existingPreset.label === "object"
      ? existingPreset.label
      : null;

  return {
    value: normalizedValue,
    label: {
      ua: String(existingLabel?.ua || normalizedValue).trim(),
      en: String(existingLabel?.en || existingLabel?.ua || normalizedValue).trim(),
    },
  };
}

function mergeRawColorPresets(existingPresets = [], rawColors = []) {
  const presetByValue = new Map();

  for (const preset of Array.isArray(existingPresets) ? existingPresets : []) {
    const value = normalizeRawColorValue(preset?.value ?? preset);
    if (!value || presetByValue.has(value)) continue;
    presetByValue.set(value, buildRawColorPreset(value, preset));
  }

  for (const rawColor of rawColors) {
    const value = normalizeRawColorValue(rawColor);
    if (!value || presetByValue.has(value)) continue;
    presetByValue.set(value, buildRawColorPreset(value));
  }

  return [...presetByValue.values()];
}

function restoreColorCharacteristics(characteristics = [], rawColor) {
  const normalizedColor = normalizeRawColorValue(rawColor);
  if (!normalizedColor) return Array.isArray(characteristics) ? characteristics : [];

  let hasColorCharacteristic = false;

  const nextCharacteristics = (Array.isArray(characteristics) ? characteristics : []).map((item) => {
    const key = String(item?.key || "").trim().toLowerCase();
    if (key !== COLOR_META_KEY) {
      return item;
    }

    hasColorCharacteristic = true;

    if (item?.type === "multiselect") {
      return {
        ...item,
        value: null,
        values: [normalizedColor],
      };
    }

    return {
      ...item,
      type: item?.type || "select",
      value: normalizedColor,
      values: [],
    };
  });

  if (hasColorCharacteristic) {
    return nextCharacteristics;
  }

  return [
    ...nextCharacteristics,
    {
      key: COLOR_META_KEY,
      type: "select",
      unit: null,
      value: normalizedColor,
      values: [],
    },
  ];
}

function buildRestoredOffer(offer = {}, variationAxes = [], rawColor) {
  const normalizedColor = normalizeRawColorValue(rawColor);
  const nextOptionMap =
    offer?.optionMap && typeof offer.optionMap === "object"
      ? { ...offer.optionMap }
      : buildOptionMapFromValues(variationAxes, offer?.optionValues || []);

  nextOptionMap[COLOR_AXIS_ID] = normalizedColor;

  return {
    optionMap: nextOptionMap,
    optionValues: buildOptionValuesFromMap(variationAxes, nextOptionMap),
    optionKey: buildOptionKey(buildOptionValuesFromMap(variationAxes, nextOptionMap)),
    characteristics: restoreColorCharacteristics(offer?.characteristics || [], normalizedColor),
  };
}

function buildWorkbookColorIndex() {
  const workbook = xlsx.readFile(WORKBOOK_PATH);
  const products = xlsx.utils.sheet_to_json(workbook.Sheets.Products, { defval: null });
  const offers = xlsx.utils.sheet_to_json(workbook.Sheets.Offers, { defval: null });
  const productCharacteristicsRows = xlsx.utils.sheet_to_json(
    workbook.Sheets.ProductCharacteristics,
    { defval: null }
  );

  const productsById = new Map(products.map((row) => [String(row.id), row]));
  const productCharacteristicsByProductId = new Map(
    productCharacteristicsRows.map((row) => [
      String(row.product_id),
      parseProductCharacteristicsMap(row.characteristics_json),
    ])
  );

  const workbookColorBySku = new Map();
  const conflictingSkus = new Set();
  const stats = {
    workbookOffers: offers.length,
    workbookOffersWithSku: 0,
    workbookOffersWithColor: 0,
    conflictingWorkbookSkus: 0,
  };

  for (const offerRow of offers) {
    const sku = String(offerRow?.sku || "").trim();
    if (!sku) continue;

    stats.workbookOffersWithSku += 1;

    const productId = String(offerRow?.product_id || "").trim();
    const product = productsById.get(productId) || null;
    const offerProperties = parseOfferProperties(offerRow?.properties);
    const productCharacteristics = productCharacteristicsByProductId.get(productId) || {};
    const lookup = buildPropertyLookup({
      productCharacteristics,
      offerProperties,
    });

    const colorMatch = getLookupEntry(lookup, PROPERTY_ALIASES.color);
    const rawColor = String(colorMatch?.entry?.values?.[0] || "").trim();
    if (!rawColor) continue;

    stats.workbookOffersWithColor += 1;

    const existing = workbookColorBySku.get(sku);
    if (existing && existing.rawColor !== rawColor) {
      conflictingSkus.add(sku);
      continue;
    }

    workbookColorBySku.set(sku, {
      sku,
      rawColor,
      productId,
      productName: String(product?.name || "").trim(),
    });
  }

  stats.conflictingWorkbookSkus = conflictingSkus.size;

  return {
    workbookColorBySku,
    conflictingSkus,
    stats,
  };
}

function buildNextVariationAxes(group, rawColors) {
  const currentAxes = Array.isArray(group?.variationAxes) ? group.variationAxes : [];
  const normalizedRawColors = [...new Set(rawColors.map(normalizeRawColorValue).filter(Boolean))];
  if (!normalizedRawColors.length) {
    return currentAxes;
  }

  const nextAxesInput = currentAxes.map((axis) => ({ ...axis }));
  const colorAxisIndex = nextAxesInput.findIndex((axis) => String(axis?.axisId || "") === COLOR_AXIS_ID);

  if (colorAxisIndex >= 0) {
    nextAxesInput[colorAxisIndex] = {
      ...nextAxesInput[colorAxisIndex],
      valuesPreset: mergeRawColorPresets([], normalizedRawColors),
    };
  } else {
    nextAxesInput.push({
      axisId: COLOR_AXIS_ID,
      title: localized("Колір", "Color"),
      type: "select",
      unit: null,
      valuesPreset: mergeRawColorPresets([], normalizedRawColors),
    });
  }

  return nextAxesInput;
}

async function syncColorCharacteristicMeta(rawColors = []) {
  const normalizedRawColors = [...new Set(rawColors.map(normalizeRawColorValue).filter(Boolean))];
  if (!normalizedRawColors.length) {
    return { changed: false, created: false };
  }

  const nextValuesPreset = mergeRawColorPresets([], normalizedRawColors);
  const existingMeta = await CharacteristicMeta.findOne({ key: COLOR_META_KEY });

  if (!existingMeta) {
    await CharacteristicMeta.create({
      key: COLOR_META_KEY,
      title: localized("Колір", "Color"),
      type: "select",
      unit: null,
      valuesPreset: nextValuesPreset,
      scope: "offer",
      filterable: true,
      searchable: false,
      sort: 0,
      status: "active",
    });

    return { changed: true, created: true };
  }

  if (sameJson(existingMeta.valuesPreset || [], nextValuesPreset)) {
    return { changed: false, created: false };
  }

  existingMeta.valuesPreset = nextValuesPreset;
  await existingMeta.save({ validateBeforeSave: false });
  return { changed: true, created: false };
}

function extractAxisPresetValues(variationAxes = [], axisId) {
  const axis = (Array.isArray(variationAxes) ? variationAxes : []).find(
    (item) => String(item?.axisId || "") === String(axisId || "")
  );

  if (!axis || !Array.isArray(axis.valuesPreset)) {
    return [];
  }

  return axis.valuesPreset
    .map((item) => String(item?.value ?? item ?? "").trim())
    .filter(Boolean);
}

function uniqueSorted(values = []) {
  return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))].sort();
}

async function main() {
  if (!fs.existsSync(WORKBOOK_PATH)) {
    throw new Error(`Workbook not found: ${WORKBOOK_PATH}`);
  }

  if (!MONGO_URI) {
    throw new Error("Set MONGO_URI or MONGODB_URI");
  }

  const { workbookColorBySku, conflictingSkus, stats: workbookStats } = buildWorkbookColorIndex();
  const sourceSkus = [...workbookColorBySku.keys()].filter((sku) => !conflictingSkus.has(sku));

  console.log("[restore-keycrm-color-variations] starting", {
    mode: WRITE ? "write" : "dry-run",
    workbookPath: WORKBOOK_PATH,
    workbookStats,
    usableSkus: sourceSkus.length,
  });

  await mongoose.connect(MONGO_URI);

  try {
    const offerDocs = [];

    for (const skuChunk of chunk(sourceSkus, 1000)) {
      const rows = await Offer.find({ sku: { $in: skuChunk } })
        .select({ _id: 1, sku: 1, groupId: 1, optionMap: 1, optionValues: 1, optionKey: 1, characteristics: 1 })
        .lean();
      offerDocs.push(...rows);
    }

    const offerBySku = new Map(offerDocs.map((offer) => [String(offer.sku), offer]));
    const groupIds = [...new Set(offerDocs.map((offer) => String(offer.groupId)))].map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const groupDocs = groupIds.length
      ? await ProductGroup.find({ _id: { $in: groupIds } })
          .select({ _id: 1, slug: 1, title: 1, variationAxes: 1 })
          .lean()
      : [];

    const allGroupOffers = groupIds.length
      ? await Offer.find({ groupId: { $in: groupIds } })
          .select({ _id: 1, sku: 1, groupId: 1, optionMap: 1, optionValues: 1, optionKey: 1, characteristics: 1 })
          .lean()
      : [];

    const groupById = new Map(groupDocs.map((group) => [String(group._id), group]));
    const offersByGroupId = new Map();
    allGroupOffers.forEach((offer) => {
      const groupId = String(offer.groupId || "");
      if (!groupId) return;
      if (!offersByGroupId.has(groupId)) {
        offersByGroupId.set(groupId, []);
      }
      offersByGroupId.get(groupId).push(offer);
    });

    const offerOps = [];
    const finalColorByOfferId = new Map();
    const queuedOfferIds = new Set();

    const summary = {
      workbookOffers: workbookStats.workbookOffers,
      workbookOffersWithColor: workbookStats.workbookOffersWithColor,
      conflictingWorkbookSkus: workbookStats.conflictingWorkbookSkus,
      usableSkus: sourceSkus.length,
      matchedOffers: 0,
      missingOffers: 0,
      changedOffers: 0,
      changedGroups: 0,
      groupsWithColorPresetUpdates: 0,
      colorCharacteristicMetaUpdated: 0,
      skippedMissingGroups: 0,
      sampleChangedOffers: [],
      sampleChangedGroups: [],
      sampleMissingSkus: [],
    };

    const queueOfferRewrite = (offer, sourceColor, rawColorForSample = null) => {
      const group = groupById.get(String(offer.groupId));
      if (!group) {
        return false;
      }

      const normalizedColor = normalizeRawColorValue(sourceColor);
      if (!normalizedColor) {
        return false;
      }

      finalColorByOfferId.set(String(offer._id), normalizedColor);

      const nextOffer = buildRestoredOffer(
        offer,
        Array.isArray(group.variationAxes) ? group.variationAxes : [],
        normalizedColor
      );

      const currentColorValue = extractOfferColor(offer);
      const nextColorValue = String(nextOffer.optionMap?.[COLOR_AXIS_ID] || "").trim();
      const colorChanged = currentColorValue !== nextColorValue;
      const characteristicsChanged = !sameJson(offer.characteristics || [], nextOffer.characteristics || []);
      const optionKeyChanged = String(offer.optionKey || "") !== String(nextOffer.optionKey || "");
      const offerChanged = colorChanged || characteristicsChanged || optionKeyChanged;

      if (!offerChanged || queuedOfferIds.has(String(offer._id))) {
        return offerChanged;
      }

      queuedOfferIds.add(String(offer._id));
      summary.changedOffers += 1;
      if (summary.sampleChangedOffers.length < 10) {
        summary.sampleChangedOffers.push({
          sku: offer.sku,
          groupSlug: group.slug,
          rawColor: rawColorForSample ?? sourceColor,
          from: currentColorValue || null,
          to: nextColorValue || null,
          currentOptionKey: offer.optionKey,
          nextOptionKey: nextOffer.optionKey,
        });
      }

      offerOps.push({
        updateOne: {
          filter: { _id: offer._id },
          update: {
            $set: {
              optionMap: nextOffer.optionMap,
              optionValues: nextOffer.optionValues,
              optionKey: nextOffer.optionKey,
              characteristics: nextOffer.characteristics,
            },
          },
        },
      });

      return true;
    };

    for (const sku of sourceSkus) {
      const workbookEntry = workbookColorBySku.get(sku);
      const offer = offerBySku.get(sku);

      if (!offer) {
        summary.missingOffers += 1;
        if (summary.sampleMissingSkus.length < 10) {
          summary.sampleMissingSkus.push(sku);
        }
        continue;
      }

      summary.matchedOffers += 1;

      if (!groupById.has(String(offer.groupId))) {
        summary.skippedMissingGroups += 1;
        continue;
      }

      queueOfferRewrite(offer, workbookEntry.rawColor, workbookEntry.rawColor);
    }

    for (const offer of allGroupOffers) {
      if (finalColorByOfferId.has(String(offer._id))) {
        continue;
      }

      const existingColor = extractOfferColor(offer);
      if (!existingColor) {
        continue;
      }

      queueOfferRewrite(offer, existingColor, existingColor);
    }

    const groupOps = [];
    const groupColors = new Map();

    for (const [groupId, groupOffers] of offersByGroupId.entries()) {
      for (const offer of groupOffers) {
        const finalColor =
          finalColorByOfferId.get(String(offer._id)) ||
          normalizeRawColorValue(extractOfferColor(offer));

        if (!finalColor) {
          continue;
        }

        if (!groupColors.has(groupId)) {
          groupColors.set(groupId, new Set());
        }

        groupColors.get(groupId).add(finalColor);
      }
    }

    for (const [groupId, rawColorsSet] of groupColors.entries()) {
      const group = groupById.get(groupId);
      if (!group) continue;

      const nextVariationAxes = buildNextVariationAxes(group, [...rawColorsSet]);
      const currentColorValues = uniqueSorted(extractAxisPresetValues(group.variationAxes || [], "A1"));
      const nextColorValues = uniqueSorted(extractAxisPresetValues(nextVariationAxes || [], "A1"));
      if (sameJson(currentColorValues, nextColorValues)) {
        continue;
      }

      summary.changedGroups += 1;
      summary.groupsWithColorPresetUpdates += 1;
      if (summary.sampleChangedGroups.length < 10) {
        const addedColorValues = nextColorValues.filter((value) => !currentColorValues.includes(value));
        summary.sampleChangedGroups.push({
          groupSlug: group.slug,
          addedColorValues,
          nextColorValues,
        });
      }

      groupOps.push({
        updateOne: {
          filter: { _id: group._id },
          update: {
            $set: {
              variationAxes: nextVariationAxes,
            },
          },
        },
      });
    }

    if (WRITE && offerOps.length) {
      await Offer.bulkWrite(offerOps, { ordered: false });
    }

    if (WRITE && groupOps.length) {
      await ProductGroup.bulkWrite(groupOps, { ordered: false });
    }

    if (WRITE) {
      const colorMetaSync = await syncColorCharacteristicMeta(
        [...finalColorByOfferId.values()]
      );
      if (colorMetaSync.changed) {
        summary.colorCharacteristicMetaUpdated = 1;
      }
    }

    console.log(
      "[restore-keycrm-color-variations] summary",
      JSON.stringify(
        {
          mode: WRITE ? "write" : "dry-run",
          workbookPath: WORKBOOK_PATH,
          summary,
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error("[restore-keycrm-color-variations] failed", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});