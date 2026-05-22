"use client";

import ProductGallery from "@widgets/product-gallery";
import ProductInfo from "@widgets/product-info";
import { collectGallerySlides } from "@widgets/product-info/lib/pdpVariations";
import { useCallback, useMemo, useState } from "react";

export default function ProductPdpBlock({
  product,
  locale,
  categoryLabel,
  galleryAriaLabel,
  infoAriaLabel,
}) {
  const [galleryOverride, setGalleryOverride] = useState(null);
  const [activeOfferForGallery, setActiveOfferForGallery] =
    useState(null);

  const baseline = useMemo(
    () => collectGallerySlides(null, product, locale),
    [product, locale],
  );

  const slides =
    galleryOverride !== null && galleryOverride.length
      ? galleryOverride
      : baseline;

  const onGallerySlidesChange = useCallback((next) => {
    setGalleryOverride(
      Array.isArray(next) && next.length ? next : null,
    );
  }, []);

  const onActiveOfferChange = useCallback((offer) => {
    setActiveOfferForGallery(offer ?? null);
  }, []);

  return (
    <>
      <aside
        className="pdp__gallery"
        aria-label={galleryAriaLabel}
      >
        <ProductGallery
          product={product}
          slides={slides}
          locale={locale}
          activeOffer={activeOfferForGallery}
        />
      </aside>
      <div
        className="pdp__info"
        aria-label={infoAriaLabel}
      >
        <ProductInfo
          product={product}
          locale={locale}
          categoryLabel={categoryLabel}
          onGallerySlidesChange={onGallerySlidesChange}
          onActiveOfferChange={onActiveOfferChange}
        />
      </div>
    </>
  );
}
