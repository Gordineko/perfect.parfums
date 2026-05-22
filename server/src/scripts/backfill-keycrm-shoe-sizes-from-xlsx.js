import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import xlsx from "xlsx";

import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import { CharacteristicMeta } from "../Modules/CatalogModule/Models/CharacteristicMeta.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";

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

const SIZE_ALIASES = new Set(["розмір", "размер", "size"]);
const SHOE_ROOT_SLUGS = new Set(["dance-heels", "train-heels", "virtual-heels", "serial-heels", "high-heels"]);
const SHOE_SIZE_TO_INSOLE = new Map([
  [34, 22.5],
  [35, 23],
  [36, 23.5],
  [37, 24],
  [38, 24.5],
  [39, 25],
  [40, 25.5],
  [41, 26],
  [42, 26.5],
  [43, 27],
]);

function json(value) {
  return JSON.stringify(value ?? null);
}

function localized(ua, en = ua) {
  return {
    ua: String(ua || "").trim(),
    en: String(en ?? ua ?? "").trim(),
  };
}

function normalizePropertyName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function toFiniteNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(String(value).replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(number) ? number : fallback;
}

function formatNumericSize(value) {
  const number = toFiniteNumber(value, null);
  if (number == null) return "";
  return Number.isInteger(number) ? String(number) : String(number).replace(/\.0+$/, "");
}

function buildWorkbookLookup(offerRow = {}, productCharacteristics = {}) {
  const lookup = new Map();

  for (const [rawName, rawValues] of Object.entries(productCharacteristics || {})) {
    const normalizedName = normalizePropertyName(rawName);
    const values = Array.isArray(rawValues)
      ? rawValues.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    if (!normalizedName || !values.length) continue;
    lookup.set(normalizedName, values);
  }

  for (const item of parseOfferProperties(offerRow.properties)) {
    const normalizedName = normalizePropertyName(item.name);
    if (!normalizedName || !item.value) continue;
    lookup.set(normalizedName, [item.value]);
  }

  return lookup;
}

function extractWorkbookSize(offerRow = {}, productCharacteristics = {}) {
  const lookup = buildWorkbookLookup(offerRow, productCharacteristics);

  for (const alias of SIZE_ALIASES) {
    const values = lookup.get(normalizePropertyName(alias)) || [];
    const rawValue = String(values[0] || "").trim();
    if (!rawValue) continue;

    const numeric = toFiniteNumber(rawValue, null);
    if (numeric == null) continue;

    return {
      rawValue,
      numeric,
      sizeText: formatNumericSize(numeric),
      expectedInsole: SHOE_SIZE_TO_INSOLE.get(numeric) ?? null,
    };
  }

  return null;
}

function isShoeGroup(group, categoryById) {
  const categoryIds = Array.isArray(group?.categoryIds) ? group.categoryIds.map(String) : [];

  return categoryIds.some((categoryId) => {
    const category = categoryById.get(categoryId);
    if (!category) return false;
    if (SHOE_ROOT_SLUGS.has(String(category.slug || ""))) return true;

    const rootId = Array.isArray(category.ancestors) && category.ancestors.length
      ? String(category.ancestors[0])
      : null;
    const rootCategory = rootId ? categoryById.get(rootId) : null;
    return SHOE_ROOT_SLUGS.has(String(rootCategory?.slug || ""));
  });
}

function hasA6Axis(variationAxes = []) {
  return (Array.isArray(variationAxes) ? variationAxes : []).some((axis) => String(axis?.axisId || "") === "A6");
}

function sortSizeValues(values = []) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => {
    const leftNumber = toFiniteNumber(left, null);
    const rightNumber = toFiniteNumber(right, null);

    if (leftNumber != null && rightNumber != null) {
      return leftNumber - rightNumber;
    }

    return String(left).localeCompare(String(right), "uk");
  });
}

function makeSelectValue(rawValue) {
  const value = String(rawValue || "").trim();
  return {
    value,
    label: localized(value, value),
  };
}

function extractPresetValue(item) {
  return String(item?.value ?? item ?? "").trim();
}

function mergeSizePresets(existingValuesPreset = [], sizeValues = []) {
  const existing = Array.isArray(existingValuesPreset) ? existingValuesPreset : [];
  const knownValues = new Set(existing.map((item) => extractPresetValue(item)).filter(Boolean));
  const appended = [];

  for (const sizeValue of sortSizeValues(sizeValues)) {
    if (!sizeValue || knownValues.has(sizeValue)) continue;
    knownValues.add(sizeValue);
    appended.push(makeSelectValue(sizeValue));
  }

  return [...existing, ...appended];
}

function makeSizeCharacteristic(sizeText) {
  return {
    key: "size",
    type: "select",
    unit: null,
    value: makeSelectValue(sizeText),
    values: [],
  };
}

function upsertSizeCharacteristic(characteristics = [], sizeText = "") {
  const nextCharacteristic = makeSizeCharacteristic(sizeText);
  let changed = false;
  let replaced = false;

  const next = (Array.isArray(characteristics) ? characteristics : []).map((item) => {
    if (String(item?.key || "") !== "size") return item;
    replaced = true;
    if (json(item) !== json(nextCharacteristic)) {
      changed = true;
      return nextCharacteristic;
    }
    return item;
  });

  if (!replaced) {
    changed = true;
    next.push(nextCharacteristic);
  }

  return { next, changed };
}

function deriveExistingSizeText(offer = {}) {
  const sizeCharacteristic = (Array.isArray(offer.characteristics) ? offer.characteristics : []).find(
    (item) => String(item?.key || "") === "size"
  );

  if (sizeCharacteristic?.value && typeof sizeCharacteristic.value === "object") {
    const nestedValue = String(sizeCharacteristic.value.value || "").trim();
    if (nestedValue) return nestedValue;
  }

  const directValue = String(sizeCharacteristic?.value || "").trim();
  if (directValue) return directValue;

  const optionValue = String(offer?.optionMap?.A6 ?? offer?.optionMap?.size ?? "").trim();
  if (optionValue) return optionValue;

  return "";
}

function ensureA6Axis(variationAxes = [], sizeValues = []) {
  const nextSizeValues = sortSizeValues(sizeValues).map((item) => makeSelectValue(item));
  const nextAxes = Array.isArray(variationAxes) ? [...variationAxes] : [];
  const axisIndex = nextAxes.findIndex((axis) => String(axis?.axisId || "") === "A6");
  const nextAxis = {
    axisId: "A6",
    title: localized("Розмір", "Size"),
    type: "select",
    unit: null,
    valuesPreset: nextSizeValues,
  };

  if (axisIndex >= 0) {
    const existingAxis = nextAxes[axisIndex] || {};
    const mergedPresetValues = sortSizeValues([
      ...(Array.isArray(existingAxis.valuesPreset)
        ? existingAxis.valuesPreset.map((item) => String(item?.value ?? item ?? "").trim()).filter(Boolean)
        : []),
      ...nextSizeValues.map((item) => item.value),
    ]).map((item) => makeSelectValue(item));

    const mergedAxis = {
      ...existingAxis,
      axisId: "A6",
      title: existingAxis.title || nextAxis.title,
      type: "select",
      unit: null,
      valuesPreset: mergedPresetValues,
    };

    const changed = json(existingAxis) !== json(mergedAxis);
    if (changed) {
      nextAxes[axisIndex] = mergedAxis;
    }

    return { next: nextAxes, changed };
  }

  const insertAfterA2 = nextAxes.findIndex((axis) => String(axis?.axisId || "") === "A2");
  if (insertAfterA2 >= 0) {
    nextAxes.splice(insertAfterA2 + 1, 0, nextAxis);
  } else {
    nextAxes.push(nextAxis);
  }

  return { next: nextAxes, changed: true };
}

function buildOptionValues(variationAxes = [], optionMap = {}) {
  const result = [];

  for (const axis of Array.isArray(variationAxes) ? variationAxes : []) {
    const value = optionMap?.[axis.axisId];
    if (value === undefined || value === null || value === "") continue;
    result.push(value);
  }

  return result;
}

function buildOptionKey(variationAxes = [], optionMap = {}) {
  if (!variationAxes.length) return "default";
  return variationAxes.map((axis) => `${axis.axisId}:${String(optionMap?.[axis.axisId])}`).join("|");
}

async function run() {
  if (!fs.existsSync(WORKBOOK_PATH)) {
    throw new Error(`Workbook not found: ${WORKBOOK_PATH}`);
  }

  console.log(`[backfill:keycrm-shoe-sizes] mode=${WRITE ? "write" : "dry-run"}`);
  console.log(`[backfill:keycrm-shoe-sizes] workbook=${WORKBOOK_PATH}`);
  console.log(`[backfill:keycrm-shoe-sizes] mongo=${MONGO_URI}`);

  const workbook = xlsx.readFile(WORKBOOK_PATH);
  const offersSheet = xlsx.utils.sheet_to_json(workbook.Sheets.Offers, { defval: null });
  const productCharacteristicsRows = xlsx.utils.sheet_to_json(workbook.Sheets.ProductCharacteristics, { defval: null });
  const productCharacteristicsByProductId = new Map(
    productCharacteristicsRows.map((row) => [
      String(row.product_id),
      parseProductCharacteristicsMap(row.characteristics_json),
    ])
  );

  const workbookSizeBySku = new Map();
  for (const row of offersSheet) {
    const sku = String(row.sku || "").trim();
    if (!sku) continue;

    const productCharacteristics = productCharacteristicsByProductId.get(String(row.product_id)) || {};
    const sizeEntry = extractWorkbookSize(row, productCharacteristics);
    if (!sizeEntry?.sizeText) continue;

    workbookSizeBySku.set(sku, sizeEntry);
  }

  await mongoose.connect(MONGO_URI);

  try {
    const matchedOffers = await Offer.find({ sku: { $in: [...workbookSizeBySku.keys()] } })
      .select({ _id: 1, sku: 1, groupId: 1, optionMap: 1, optionValues: 1, optionKey: 1, characteristics: 1 })
      .lean();

    const matchedGroupIds = [...new Set(matchedOffers.map((offer) => String(offer.groupId)).filter(Boolean))];
    const groups = await ProductGroup.find({ _id: { $in: matchedGroupIds } })
      .select({ _id: 1, slug: 1, title: 1, categoryIds: 1, variationAxes: 1 })
      .lean();
    const categories = await Category.find({})
      .select({ _id: 1, slug: 1, ancestors: 1 })
      .lean();

    const groupById = new Map(groups.map((group) => [String(group._id), group]));
    const categoryById = new Map(categories.map((category) => [String(category._id), category]));

    const affectedGroupIds = matchedGroupIds.filter((groupId) => {
      const group = groupById.get(groupId);
      if (!group) return false;

      if (isShoeGroup(group, categoryById)) return true;

      return matchedOffers.some((offer) => String(offer.groupId) === groupId && offer?.optionMap?.A2 != null);
    });

    const allOffersInAffectedGroups = await Offer.find({ groupId: { $in: affectedGroupIds } })
      .select({ _id: 1, sku: 1, groupId: 1, optionMap: 1, optionValues: 1, optionKey: 1, characteristics: 1 })
      .lean();

    const offersByGroupId = new Map();
    for (const offer of allOffersInAffectedGroups) {
      const key = String(offer.groupId);
      if (!offersByGroupId.has(key)) {
        offersByGroupId.set(key, []);
      }
      offersByGroupId.get(key).push(offer);
    }

    const stats = {
      workbookOffersWithNumericSize: workbookSizeBySku.size,
      matchedOffers: matchedOffers.length,
      affectedGroups: affectedGroupIds.length,
      scannedGroupOffers: allOffersInAffectedGroups.length,
      offersUpdated: 0,
      offersSizeCharacteristicUpdated: 0,
      offersVariationPayloadUpdated: 0,
      groupsUpdated: 0,
      characteristicMetaUpdated: 0,
      groupsSkippedForAxisRewrite: 0,
      offersUnresolved: 0,
    };

    const groupOps = [];
    const offerOps = [];
    const skippedGroups = [];

    for (const groupId of affectedGroupIds) {
      const group = groupById.get(groupId);
      const offers = offersByGroupId.get(groupId) || [];
      if (!group || !offers.length) continue;

      const resolvedSizeByOfferId = new Map(
        offers.map((offer) => {
          const workbookEntry = workbookSizeBySku.get(String(offer.sku));
          const existingSize = deriveExistingSizeText(offer);
          return [String(offer._id), workbookEntry?.sizeText || existingSize || ""];
        })
      );

      const distinctSizeValues = sortSizeValues([...resolvedSizeByOfferId.values()].filter(Boolean));
      const everyOfferResolved = offers.every((offer) => resolvedSizeByOfferId.get(String(offer._id)));
      const groupAlreadyHasA6 = hasA6Axis(group.variationAxes || []);

      let nextVariationAxes = Array.isArray(group.variationAxes) ? group.variationAxes : [];
      let shouldRewriteVariationPayload = false;

      if (everyOfferResolved && (groupAlreadyHasA6 || distinctSizeValues.length > 1)) {
        const ensuredAxis = ensureA6Axis(group.variationAxes || [], distinctSizeValues);
        nextVariationAxes = ensuredAxis.next;
        shouldRewriteVariationPayload = hasA6Axis(nextVariationAxes);

        if (ensuredAxis.changed) {
          groupOps.push({
            updateOne: {
              filter: { _id: group._id },
              update: { $set: { variationAxes: nextVariationAxes } },
            },
          });
          stats.groupsUpdated += 1;
        }
      } else if (groupAlreadyHasA6 && distinctSizeValues.length) {
        const ensuredAxis = ensureA6Axis(group.variationAxes || [], distinctSizeValues);
        nextVariationAxes = ensuredAxis.next;
        shouldRewriteVariationPayload = everyOfferResolved;

        if (ensuredAxis.changed) {
          groupOps.push({
            updateOne: {
              filter: { _id: group._id },
              update: { $set: { variationAxes: nextVariationAxes } },
            },
          });
          stats.groupsUpdated += 1;
        }
      } else if (distinctSizeValues.length) {
        stats.groupsSkippedForAxisRewrite += 1;
        skippedGroups.push({
          groupSlug: group.slug,
          reason: everyOfferResolved ? "single-size-group" : "not-all-offers-resolved",
          distinctSizeValues,
        });
      }

      const candidateOfferStates = offers.map((offer) => {
        const sizeText = resolvedSizeByOfferId.get(String(offer._id)) || "";
        const sizeCharacteristicUpdate = sizeText
          ? upsertSizeCharacteristic(offer.characteristics || [], sizeText)
          : { next: offer.characteristics || [], changed: false };

        let nextOptionMap = offer.optionMap && typeof offer.optionMap === "object"
          ? { ...offer.optionMap }
          : {};
        let optionMapChanged = false;
        let nextOptionValues = Array.isArray(offer.optionValues) ? offer.optionValues : [];
        let nextOptionKey = String(offer.optionKey || "default");

        if (shouldRewriteVariationPayload && sizeText) {
          if (String(nextOptionMap.A6 ?? "") !== sizeText) {
            nextOptionMap.A6 = sizeText;
            optionMapChanged = true;
          }

          nextOptionValues = buildOptionValues(nextVariationAxes, nextOptionMap);
          nextOptionKey = buildOptionKey(nextVariationAxes, nextOptionMap);
        }

        return {
          offer,
          sizeText,
          nextCharacteristics: sizeCharacteristicUpdate.next,
          characteristicsChanged: sizeCharacteristicUpdate.changed,
          nextOptionMap,
          optionMapChanged,
          nextOptionValues,
          optionValuesChanged: json(offer.optionValues || []) !== json(nextOptionValues),
          nextOptionKey,
          optionKeyChanged: String(offer.optionKey || "default") !== nextOptionKey,
        };
      });

      if (shouldRewriteVariationPayload) {
        const byOptionKey = new Map();
        for (const state of candidateOfferStates) {
          if (!state.sizeText) continue;
          if (!byOptionKey.has(state.nextOptionKey)) {
            byOptionKey.set(state.nextOptionKey, []);
          }
          byOptionKey.get(state.nextOptionKey).push(state.offer.sku);
        }

        const duplicateKeys = [...byOptionKey.entries()].filter(([, skus]) => skus.length > 1);
        if (duplicateKeys.length) {
          shouldRewriteVariationPayload = false;
          stats.groupsSkippedForAxisRewrite += 1;
          skippedGroups.push({
            groupSlug: group.slug,
            reason: "duplicate-option-keys",
            duplicateKey: duplicateKeys[0][0],
            skus: duplicateKeys[0][1],
          });

          if (groupOps.length && String(groupOps[groupOps.length - 1]?.updateOne?.filter?._id || "") === String(group._id)) {
            groupOps.pop();
            stats.groupsUpdated -= 1;
          }
        }
      }

      for (const state of candidateOfferStates) {
        if (!state.sizeText) {
          stats.offersUnresolved += 1;
          continue;
        }

        const set = {};
        let changed = false;

        if (state.characteristicsChanged) {
          set.characteristics = state.nextCharacteristics;
          stats.offersSizeCharacteristicUpdated += 1;
          changed = true;
        }

        if (shouldRewriteVariationPayload && (state.optionMapChanged || state.optionValuesChanged || state.optionKeyChanged)) {
          set.optionMap = state.nextOptionMap;
          set.optionValues = state.nextOptionValues;
          set.optionKey = state.nextOptionKey;
          stats.offersVariationPayloadUpdated += 1;
          changed = true;
        }

        if (!changed) continue;

        offerOps.push({
          updateOne: {
            filter: { _id: state.offer._id },
            update: { $set: set },
          },
        });
        stats.offersUpdated += 1;
      }
    }

    if (WRITE && groupOps.length) {
      await ProductGroup.bulkWrite(groupOps, { ordered: false });
    }

    if (WRITE && offerOps.length) {
      await Offer.bulkWrite(offerOps, { ordered: false });
    }

    const sizeMeta = await CharacteristicMeta.findOne({ key: "size" });
    const workbookSizeValues = sortSizeValues(
      [...workbookSizeBySku.values()].map((entry) => String(entry?.sizeText || "").trim()).filter(Boolean)
    );
    const nextSizeMetaValuesPreset = mergeSizePresets(sizeMeta?.valuesPreset || [], workbookSizeValues);
    const sizeMetaNeedsUpdate = json(sizeMeta?.valuesPreset || []) !== json(nextSizeMetaValuesPreset);

    if (sizeMetaNeedsUpdate) {
      stats.characteristicMetaUpdated = 1;

      if (WRITE) {
        if (sizeMeta) {
          sizeMeta.valuesPreset = nextSizeMetaValuesPreset;
          await sizeMeta.save({ validateBeforeSave: false });
        } else {
          await CharacteristicMeta.create({
            key: "size",
            title: localized("Розмір", "Size"),
            type: "select",
            unit: null,
            valuesPreset: nextSizeMetaValuesPreset,
            scope: "offer",
            filterable: true,
            searchable: false,
            sort: 20,
            status: "active",
          });
        }
      }
    }

    console.log("\n=== backfill:keycrm-shoe-sizes summary ===");
    console.log(JSON.stringify({
      mode: WRITE ? "write" : "dry-run",
      stats,
      sampleSkippedGroups: skippedGroups.slice(0, 10),
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});