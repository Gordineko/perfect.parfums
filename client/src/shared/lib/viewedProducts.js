import { deriveProductPrimaryImageUrl } from "./deriveProductPrimaryImageUrl";
import { normalizeCatalogCardForProductItem } from "./normalizeCatalogCard";

const STORAGE_KEY = "viewed_products";
const MAX_ITEMS = 24;

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function viewedRecordId(record) {
  if (!record || typeof record !== "object") {
    return null;
  }
  const raw =
    record._id ??
    record.id ??
    record.groupId ??
    record.slug ??
    null;
  if (raw == null) {
    return null;
  }
  const s = String(raw).trim();
  return s.length ? s : null;
}

/**
 * Maps PDP / raw storage into the same card shape as the catalog API
 * so ProductItem (title, price, image, slug, offers, hasDiscount) stays consistent.
 */
function coerceViewedProductRecordForProductItem(record) {
  if (!record || typeof record !== "object") {
    return null;
  }
  const groupKey = record._id ?? record.groupId ?? record.id;
  if (groupKey == null || String(groupKey).trim() === "") {
    return null;
  }
  const imageURL = deriveProductPrimaryImageUrl(record);

  const coerceCategoryRow = (row) => {
    if (!row) return null;
    if (typeof row === "string") {
      const s = row.trim();
      return s ? { title: s } : null;
    }
    if (typeof row === "object") {
      if (row.title != null) return row;
      return { title: row };
    }
    return null;
  };

  const categoriesFromRecord =
    Array.isArray(record.categories) && record.categories.length
      ? record.categories
      : [
          record.category,
          record.subcategory ?? record.subCategory,
        ].filter(Boolean);

  const synth = {
    groupId: record.groupId ?? record._id,
    _id: record._id ?? record.groupId,
    id: record.id,
    slug: record.slug,
    title: record.title,
    subtitle: record.subtitle,
    imageURL,
    pricing: record.pricing,
    offers: record.offers,
    categories: categoriesFromRecord
      .map(coerceCategoryRow)
      .filter(Boolean),
    categoryIds: record.categoryIds,
  };

  return normalizeCatalogCardForProductItem(synth);
}

export function getViewedProducts() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const list = safeParse(raw, []);
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((row) => coerceViewedProductRecordForProductItem(row))
    .filter(Boolean);
}

export function pushViewedProduct(product) {
  if (typeof window === "undefined") return;
  if (!product) return;

  const shaped = coerceViewedProductRecordForProductItem(product);
  if (!shaped) return;

  const id = viewedRecordId(shaped);
  if (id == null) return;

  const prevRaw = safeParse(
    window.localStorage.getItem(STORAGE_KEY),
    [],
  );
  const prev = Array.isArray(prevRaw) ? prevRaw : [];

  const prevShaped = prev
    .filter((p) => viewedRecordId(p) !== id)
    .map((p) => coerceViewedProductRecordForProductItem(p))
    .filter(Boolean);

  const next = [shaped, ...prevShaped].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
