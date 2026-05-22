export function offerToNumber(v) {
  if (v == null || v === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/** Unit price to charge (already discounted), from backend offer fields. */
export function getOfferUnitPrice(offer) {
  if (!offer || typeof offer !== "object") return NaN;
  const eff = offerToNumber(offer.effectivePrice);
  if (Number.isFinite(eff)) return eff;
  return offerToNumber(offer.price);
}

/**
 * List price for strikethrough when backend sends both prices and list is higher.
 * No discount math — only compares `price` and `effectivePrice`.
 */
export function getOfferCrossPrice(offer) {
  if (!offer || typeof offer !== "object") return null;
  const eff = offerToNumber(offer.effectivePrice);
  const list = offerToNumber(offer.price);
  if (!Number.isFinite(eff) || !Number.isFinite(list)) return null;
  if (list > eff) return list;
  return null;
}
