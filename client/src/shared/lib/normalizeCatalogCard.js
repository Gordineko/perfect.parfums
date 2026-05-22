import { categoryIdsHasSale } from "./categoryIdsHasSale";

const FALLBACK_IMAGE = "/img/fallback.jpg";

export function enrichPricingWithOfferReference(pricing, offers) {
  if (!pricing || typeof pricing !== "object") {
    return pricing;
  }
  const next = { ...pricing };
  const hasOld =
    next.old != null && String(next.old).trim() !== "";
  if (hasOld) {
    return next;
  }
  const first = Array.isArray(offers) ? offers[0] : null;
  if (!first) {
    return next;
  }
  const eff = Number(first.effectivePrice);
  const list = Number(first.price);
  if (
    Number.isFinite(eff) &&
    Number.isFinite(list) &&
    list > eff
  ) {
    next.old = String(Math.round(list));
  }
  return next;
}

function mapLocalizedTitle(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "object") {
    return value;
  }
  const s = String(value ?? "").trim();
  if (!s) {
    return null;
  }
  return { ua: s, en: s };
}

function mapCategoryLike(row) {
  if (!row || typeof row !== "object") {
    return undefined;
  }
  const title = mapLocalizedTitle(row.title);
  if (!title) {
    return undefined;
  }
  return { title };
}

function mapCategoryPairFromCard(card) {
  const list = card?.categories;
  if (!Array.isArray(list) || list.length === 0) {
    return {};
  }
  return {
    category: mapCategoryLike(list[0]),
    subcategory: mapCategoryLike(list[1]),
  };
}

export function normalizeCatalogCardForProductItem(card) {
  if (!card || typeof card !== "object") {
    return null;
  }

  const idRaw =
    card.groupId ?? card._id ?? card.id ?? card.slug;
  if (idRaw == null || String(idRaw).trim() === "") {
    return null;
  }

  const _id = String(idRaw);
  const currency =
    typeof card.pricing?.currency === "string" &&
    card.pricing.currency.trim()
      ? card.pricing.currency.trim()
      : "UAH";

  const minRaw = card.pricing?.min;
  const firstOffer = Array.isArray(card.offers) ? card.offers[0] : null;

  let minStr = "0";
  if (firstOffer != null) {
    const eff = Number(firstOffer.effectivePrice);
    const listP = Number(firstOffer.price);
    const pick = Number.isFinite(eff)
      ? eff
      : Number.isFinite(listP)
        ? listP
        : NaN;
    if (Number.isFinite(pick)) {
      minStr = String(Math.round(pick));
    } else if (minRaw != null && minRaw !== "") {
      const n = Number(minRaw);
      if (Number.isFinite(n)) {
        minStr = String(Math.round(n));
      }
    }
  } else if (minRaw != null && minRaw !== "") {
    const n = Number(minRaw);
    if (Number.isFinite(n)) {
      minStr = String(Math.round(n));
    }
  }

  let pricing = { min: minStr, currency };
  const rawOld = card.pricing?.old;
  if (rawOld != null && String(rawOld).trim() !== "") {
    const oldN = Number(rawOld);
    if (Number.isFinite(oldN)) {
      pricing.old = String(Math.round(oldN));
    }
  }
  pricing = enrichPricingWithOfferReference(pricing, card.offers);

  const rawUrl =
    typeof card.imageURL === "string"
      ? card.imageURL.trim()
      : "";
  const imageURL = rawUrl || FALLBACK_IMAGE;

  const hasDiscount = categoryIdsHasSale({
    categories: card.categories,
    categoryIds: card.categoryIds,
  });

  const { category, subcategory } = mapCategoryPairFromCard(card);

  return {
    _id,
    groupId: card.groupId,
    slug: card.slug,
    title: card.title,
    subtitle: card.subtitle,
    imageURL,
    pricing,
    category,
    subcategory,
    categories: card.categories,
    categoryIds: card.categoryIds,
    offers: card.offers,
    hasDiscount,
  };
}
