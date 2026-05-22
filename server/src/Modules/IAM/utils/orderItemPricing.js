import { syncOfferDiscountFields } from "../../CatalogModule/Models/Offer.model.js";

function toFiniteNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function roundMoney(value) {
  return Math.round((toFiniteNumber(value, 0) + Number.EPSILON) * 100) / 100;
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

export function buildOrderItemPricingSnapshot(offer = {}, { qty = 1, pricePerUnit } = {}) {
  const normalizedQty = Math.max(1, toFiniteNumber(qty, 1));
  const offerPricing = syncOfferDiscountFields(
    {
      price: offer?.price,
      discount: offer?.discount,
      discountUAH: offer?.discountUAH,
      discountType: offer?.discountType,
    },
    offer?.discountType
  );

  const originalPricePerUnit = Math.max(0, roundMoney(offerPricing.price));
  const offerEffectivePrice = Math.max(0, roundMoney(offerPricing.effectivePrice));
  const hasPriceOverride = hasValue(pricePerUnit);
  const appliedPricePerUnit = hasPriceOverride
    ? Math.max(0, roundMoney(pricePerUnit))
    : offerEffectivePrice;

  const discountAmountPerUnit = Math.max(
    0,
    roundMoney(originalPricePerUnit - appliedPricePerUnit)
  );
  const usesOfferDiscount = !hasPriceOverride || appliedPricePerUnit === offerEffectivePrice;

  const discountType =
    discountAmountPerUnit <= 0
      ? "none"
      : usesOfferDiscount
        ? offerPricing.discountType
        : "amount";

  return {
    originalPricePerUnit,
    discountType,
    discount: discountType === "percent" ? roundMoney(offerPricing.discount) : 0,
    discountUAH:
      discountType === "amount"
        ? usesOfferDiscount
          ? roundMoney(offerPricing.discountUAH)
          : discountAmountPerUnit
        : 0,
    discountAmountPerUnit,
    discountSubtotal: roundMoney(discountAmountPerUnit * normalizedQty),
    pricePerUnit: appliedPricePerUnit,
    subtotal: roundMoney(appliedPricePerUnit * normalizedQty),
  };
}