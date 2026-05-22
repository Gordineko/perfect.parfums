"use client";

import {
  getOfferDiscountBadgeDisplay,
  getOfferMarketingTagLabels,
} from "@entities/product/model/offerPromo";
import { useMemo } from "react";

export default function ProductGalleryPromoStrip({ activeOffer, locale }) {
  const discountBadge = useMemo(
    () => getOfferDiscountBadgeDisplay(activeOffer),
    [activeOffer],
  );

  const tagLabels = useMemo(
    () => getOfferMarketingTagLabels(activeOffer, locale),
    [activeOffer, locale],
  );

  if (!discountBadge && tagLabels.length === 0) return null;

  return (
    <div
      className="pdp-gallery__promo-strip"
      role="group"
      aria-label="Promotions and tags"
    >
      {discountBadge ? (
        <span
          className="pdp-gallery__badge pdp-gallery__badge--discount"
          aria-label={discountBadge.ariaLabel}
        >
          {discountBadge.text}
        </span>
      ) : null}
      {tagLabels.map((label, i) => (
        <span
          key={`pdp-tag-${i}-${label}`}
          className="pdp-gallery__badge pdp-gallery__badge--tag"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
