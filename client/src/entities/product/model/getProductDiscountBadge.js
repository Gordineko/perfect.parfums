import { getOfferDiscountBadgeDisplay } from "./offerPromo";

export function getProductDiscountBadge(offers) {
  const firstOffer = Array.isArray(offers) ? offers[0] : null;
  return getOfferDiscountBadgeDisplay(firstOffer);
}