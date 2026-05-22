import mongoose from "mongoose";
import {
  buildDerivedOfferCharacteristics,
  normalizeCharacteristicEntry,
  normalizeLocalizedText as normalizeVariationLocalizedText,
  normalizeOptionMapByVariationAxes,
  normalizeVariationAxisDefinition,
  normalizeVariationAxesDefinitions,
} from "./variationCharacteristics.js";
import { mergeVariationTemplateAxes } from "./variationTemplate.js";

export function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

export function toObjectId(id, field = "id") {
  if (!isValidObjectId(id)) {
    throw badRequest(`Некорректный ObjectId в поле ${field}`, {
      field,
      value: id,
    });
  }

  return new mongoose.Types.ObjectId(String(id));
}

export function normalizeLocalizedText(v = {}) {
  return normalizeVariationLocalizedText(v);
}

export function normalizeCharacteristic(item = {}) {
  return normalizeCharacteristicEntry(item);
}

export function normalizeVariationAxis(axis = {}) {
  return normalizeVariationAxisDefinition(axis);
}

export function normalizeCategoryIds(categoryIds = []) {
  if (!Array.isArray(categoryIds)) return [];

  return categoryIds
    .filter((x) => x !== undefined && x !== null && x !== "")
    .map((x, i) => toObjectId(x, `categoryIds[${i}]`));
}

export function normalizeStocks(stocks = []) {
  if (!Array.isArray(stocks)) return [];

  return stocks
    .filter(Boolean)
    .map((item, i) => ({
      warehouseId: toObjectId(item?.warehouseId, `stocks[${i}].warehouseId`),
      onHand: Number(item?.onHand || 0),
      reserved: Number(item?.reserved || 0),
    }));
}

export function buildOptionValuesFromMap(variationAxes = [], optionMap = {}) {
  return variationAxes.map((axis) => optionMap?.[axis.axisId] ?? null);
}

export function buildOptionKey(optionValues = []) {
  return optionValues.map((x) => String(x ?? "")).join("|");
}

export function buildOptionMapFromValues(variationAxes = [], optionValues = []) {
  const map = {};
  variationAxes.forEach((axis, idx) => {
    map[axis.axisId] = optionValues?.[idx] ?? null;
  });
  return map;
}

export function normalizeOfferForSave(rawOffer = {}, variationAxes = []) {
  const normalizedAxes = normalizeVariationAxesDefinitions(variationAxes);
  const optionMap =
    rawOffer?.optionMap && typeof rawOffer.optionMap === "object"
      ? normalizeOptionMapByVariationAxes(normalizedAxes, rawOffer.optionMap)
      : normalizeOptionMapByVariationAxes(
          normalizedAxes,
          buildOptionMapFromValues(normalizedAxes, rawOffer?.optionValues || [])
        );

  const optionValues = buildOptionValuesFromMap(normalizedAxes, optionMap);
  const optionKey = buildOptionKey(optionValues);
  const normalizedCharacteristics = Array.isArray(rawOffer?.characteristics)
    ? rawOffer.characteristics.map(normalizeCharacteristic)
    : [];

  return {
    _id: rawOffer?._id || null,
    sku: String(rawOffer?.sku || "").trim(),
    price: rawOffer?.price == null ? null : Number(rawOffer.price),
    opt_price: rawOffer?.opt_price == null ? null : Number(rawOffer.opt_price),
    available: Boolean(rawOffer?.available),
    img: String(rawOffer?.img || ""),
    optionMap,
    optionValues,
    optionKey,
    characteristics: buildDerivedOfferCharacteristics(
      normalizedAxes,
      optionMap,
      normalizedCharacteristics
    ),
    stocks: normalizeStocks(rawOffer?.stocks || []),
  };
}

export async function resolveEffectiveVariationAxes({
  categoryIds = [],
  variationAxes = [],
  categoryRepo = null,
} = {}) {
  let effectiveAxes = normalizeVariationAxesDefinitions(variationAxes);

  if (!categoryRepo || !Array.isArray(categoryIds) || !categoryIds.length) {
    return effectiveAxes;
  }

  const seenRootIds = new Set();

  for (const categoryId of categoryIds) {
    const category = await categoryRepo.getById(categoryId);
    if (!category) continue;

    const rootCategoryId = category.parentId && Array.isArray(category.ancestors) && category.ancestors.length
      ? category.ancestors[0]
      : category._id;
    const rootKey = String(rootCategoryId || "");
    if (!rootKey || seenRootIds.has(rootKey)) continue;

    seenRootIds.add(rootKey);

    const rootCategory =
      String(rootCategoryId) === String(category._id)
        ? category
        : await categoryRepo.getById(rootCategoryId);

    if (!rootCategory) continue;

    effectiveAxes = mergeVariationTemplateAxes(
      effectiveAxes,
      normalizeVariationAxesDefinitions(rootCategory.variationTemplate || [])
    );
  }

  return normalizeVariationAxesDefinitions(effectiveAxes);
}

export async function resolveTemplateVariationAxisIds({
  categoryIds = [],
  categoryRepo = null,
} = {}) {
  if (!categoryRepo || !Array.isArray(categoryIds) || !categoryIds.length) {
    return [];
  }

  const axisIds = new Set();
  const seenRootIds = new Set();

  for (const categoryId of categoryIds) {
    const category = await categoryRepo.getById(categoryId);
    if (!category) continue;

    const rootCategoryId = category.parentId && Array.isArray(category.ancestors) && category.ancestors.length
      ? category.ancestors[0]
      : category._id;
    const rootKey = String(rootCategoryId || "");
    if (!rootKey || seenRootIds.has(rootKey)) continue;

    seenRootIds.add(rootKey);

    const rootCategory =
      String(rootCategoryId) === String(category._id)
        ? category
        : await categoryRepo.getById(rootCategoryId);

    if (!rootCategory) continue;

    for (const axis of normalizeVariationAxesDefinitions(rootCategory.variationTemplate || [])) {
      if (axis?.axisId) {
        axisIds.add(String(axis.axisId));
      }
    }
  }

  return [...axisIds];
}

export function parseNumStrict(v, param) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw badRequest(`Параметр ${param} должен быть числом`, { param });
  }
  return n;
}

export function parseBoolNullable(v, param) {
  if (v === undefined || v === null || v === "") return null;
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  throw badRequest(`Параметр ${param} должен быть boolean`, { param });
}

export function safeJsonParse(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch {
    throw badRequest("Некорректный JSON в query", { value });
  }
}

export function buildGroupCharacteristicsFilter(char) {
  const charObj = safeJsonParse(char, null);
  if (!charObj || typeof charObj !== "object") return {};

  const and = [];

  for (const [key, value] of Object.entries(charObj)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      const arr = value.filter((x) => x !== undefined && x !== null);
      if (!arr.length) continue;

      and.push({
        $or: [
          { characteristics: { $elemMatch: { key, value: { $in: arr } } } },
          { characteristics: { $elemMatch: { key, "value.value": { $in: arr } } } },
          { characteristics: { $elemMatch: { key, values: { $in: arr } } } },
          { characteristics: { $elemMatch: { key, "values.value": { $in: arr } } } },
        ],
      });
    } else {
      and.push({
        $or: [
          { characteristics: { $elemMatch: { key, value } } },
          { characteristics: { $elemMatch: { key, "value.value": value } } },
          { characteristics: { $elemMatch: { key, values: value } } },
          { characteristics: { $elemMatch: { key, "values.value": value } } },
        ],
      });
    }
  }

  return and.length ? { $and: and } : {};
}