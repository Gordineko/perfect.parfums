import {
  enrichPricingWithOfferReference,
  getOfferCrossPrice,
  getOfferUnitPrice,
} from "@shared";

export function getProductDisplayPricing(product) {
  const o0 = Array.isArray(product?.offers) ? product.offers[0] : null;
  const unit = o0 ? getOfferUnitPrice(o0) : NaN;
  const cross = o0 ? getOfferCrossPrice(o0) : null;

  let base =
    product?.pricing && typeof product.pricing === "object"
      ? { ...product.pricing }
      : null;

  if (!base && Number.isFinite(unit)) {
    base = {
      min: String(Math.round(unit)),
      currency: "UAH",
    };
  }

  if (!base && o0?.price != null && o0.price !== "") {
    const p = Number(o0.price);
    if (Number.isFinite(p)) {
      base = { min: String(Math.round(p)), currency: "UAH" };
    }
  }

  if (!base && product?.price != null && product.price !== "") {
    const p = Number(product.price);
    if (Number.isFinite(p)) {
      base = { min: String(Math.round(p)), currency: "UAH" };
    }
  }

  if (!base || base.min == null) {
    return product?.pricing ?? null;
  }

  if (Number.isFinite(unit)) {
    base.min = String(Math.round(unit));
  }
  if (cross != null) {
    base.old = String(Math.round(cross));
  }

  return enrichPricingWithOfferReference(base, product?.offers);
}
