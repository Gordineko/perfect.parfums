"use client";

import "swiper/css";
import "yet-another-react-lightbox/styles.css";

import WishlistButton from "@features/wish-buttons";
import { useI18n } from "@shared";
import { BREAKPOINTS } from "@shared/config/BREAKPOINTS";
import { pickLocalizedString } from "@shared/lib/pickLocalized";
import { computeGallerySlides } from "@widgets/product-gallery/lib/computeGallerySlides";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import ProductGalleryPromoStrip from "./ProductGalleryPromoStrip";

const ProductGallery = ({
  product,
  slides: slidesProp,
  images,
  locale = "ua",
  mergeProductImages = true,
  activeOffer = null,
}) => {
  const { t } = useI18n();
  const slides = useMemo(
    () =>
      computeGallerySlides({
        slidesProp,
        product,
        images,
        mergeProductImages,
        locale,
      }),
    [slidesProp, product, images, mergeProductImages, locale],
  );

  const safeSlides = slides.length ? slides : [{ src: "/img/fallback.jpg", alt: "" }];
  const offerKey =
    activeOffer && typeof activeOffer === "object"
      ? String(activeOffer._id ?? activeOffer.id ?? activeOffer.sku ?? "")
      : "";
  const slidesKey = `${offerKey}|${safeSlides.map((s) => s.src).join("|")}`;

  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [slidesKey]);

  const pageIndices = useMemo(
    () => Array.from({ length: safeSlides.length }, (_, i) => i),
    [safeSlides.length],
  );

  const requestSwiperUpdate = useCallback(() => {
    const swiper = swiperInstance;
    if (!swiper) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        swiper.update?.();
        swiper.updateAutoHeight?.(350);
      });
    });
  }, [swiperInstance]);

  const handleThumbClick = (index) => {
    setActiveIndex(index);
    swiperInstance?.slideTo?.(index);
  };

  const titleForImage =
    pickLocalizedString(product?.title, locale) ||
    t("commerce.genericProduct");

  return (
    <div className="pdp-gallery">
      <ProductGalleryPromoStrip activeOffer={activeOffer} locale={locale} />

      <Swiper
        key={slidesKey}
        slidesPerView={1}
        spaceBetween={12}
        className="pdp-gallery__slider"
        observer
        observeParents
        resizeObserver
        onSwiper={setSwiperInstance}
        onSlideChange={(swiper) => {
          const i = swiper?.realIndex ?? swiper?.activeIndex ?? 0;
          setActiveIndex(i);
        }}
        onImagesReady={requestSwiperUpdate}
      >
        {safeSlides.map((slide, idx) => (
          <SwiperSlide key={`${slide.src}-${idx}`}>
            <div className="pdp-gallery__stage">
              <button
                type="button"
                className="pdp-gallery__media"
                aria-label={t("pdp.gallery.openPhoto")}
                onClick={() => {
                  setActiveIndex(idx);
                  setIsLightboxOpen(true);
                }}
              >
                <Image
                  className="pdp-gallery__image"
                  fill
                  sizes={`(max-width: ${BREAKPOINTS.mobileMax}px) 100vw, (max-width: ${BREAKPOINTS.tabletMax}px) 52vw, 760px`}
                  src={slide.src}
                  alt={slide.alt || titleForImage}
                  priority={idx === 0}
                  onLoadingComplete={requestSwiperUpdate}
                />
              </button>

              <div className="pdp-gallery__wishlist">
                <WishlistButton product={product} />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {safeSlides.length > 1 ? (
        <div
          className="pdp-reviews__pagination pdp-gallery__pagination"
          role="tablist"
          aria-label={t("pdp.gallery.navAria")}
        >
          {pageIndices.map((page) => (
            <button
              key={`gallery-page-${page}`}
              type="button"
              role="tab"
              aria-selected={page === activeIndex}
              className={`pdp-reviews__bullet ${page === activeIndex ? "is-active" : ""}`}
              onClick={() => {
                if (!swiperInstance) return;
                swiperInstance.slideTo(page);
              }}
            />
          ))}
        </div>
      ) : null}

      <div
        className="pdp-gallery__thumbs"
        aria-label={t("pdp.gallery.thumbsAria")}
      >
        {safeSlides.slice(0, 4).map((slide, idx) => (
          <button
            key={`thumb-${slide.src}-${idx}`}
            type="button"
            className={`pdp-gallery__thumb ${idx === activeIndex ? "is-active" : ""}`}
            aria-label={t("pdp.gallery.thumbShow", { n: idx + 1 })}
            aria-current={idx === activeIndex ? "true" : undefined}
            onClick={() => handleThumbClick(idx)}
          >
            <span className="pdp-gallery__thumb-media">
              <Image
                fill
                sizes="96px"
                src={slide.src}
                alt=""
              />
            </span>
          </button>
        ))}
      </div>

      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        index={activeIndex}
        slides={safeSlides.map((s) => ({ src: s.src }))}
        plugins={[Zoom]}
        zoom={{
          scrollToZoom: true,
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 1.8,
          wheelZoomDistanceFactor: 120,
        }}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.92)" },
        }}
      />
    </div>
  );
};

export default ProductGallery;
