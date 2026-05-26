"use client";

import { localePath } from "@shared/lib/localePath";
import "swiper/css";
import "swiper/css/pagination";

import ProductItem from "@entities/product";
import ProductWishlistButton from "@features/toggle-wishlist";
import { BREAKPOINTS, CarouselNavArrow, useI18n } from "@shared";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useId, useEffect, useMemo, useState } from "react";
import { Pagination } from "swiper/modules";
import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import styles from "./ArchiveSelection.module.scss";


function getArchiveDiscountBadge(offers) {
  const offer = Array.isArray(offers) ? offers[0] : null;
  if (!offer || typeof offer !== "object") {
    return null;
  }

  const percent = Number(offer.discount);
  if (!Number.isFinite(percent) || percent <= 0) {
    return null;
  }

  const rounded = Math.round(percent);

  return {
    text: `-${rounded}%`,
    ariaLabel: `${rounded}% discount`,
  };
}

export default function ArchiveSelection({
  data,
  products = [],
  fetchState = "success",
  errorMessage = "",
  httpStatus,
}) {
  const sectionId = useId();
  const params = useParams();
  const locale = params?.locale ?? "ua";
  const { t } = useI18n();

  const items = useMemo(() => (products?.items ?? []).filter(Boolean), [products]);

  const [swiper, setSwiper] = useState(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [viewport, setViewport] = useState("desktop");

  useEffect(() => {
    const syncViewport = () => {
      const width = window.innerWidth;

      if (width < BREAKPOINTS.tablet) {
        setViewport("mobile");
        return;
      }

      if (width < BREAKPOINTS.desktop) {
        setViewport("tablet");
        return;
      }

      setViewport("desktop");
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  const carouselSettings = useMemo(
    () => ({
      slidesPerView: viewport === "desktop" ? 2 : 1.5,
      spaceBetween: 24,
    }),
    [viewport],
  );

  const eyebrow =
    data?.eyebrow ?? t("catalog.archiveSelectionEyebrow");
  const title = data?.title ?? t("catalog.archiveSelectionTitle");
  const summary = data?.summary ?? t("catalog.archiveSelectionSummary");
  const ctaLabel = data?.ctaLabel ?? t("catalog.archiveSelectionCta");

  const syncNavState = (instance) => {
    setAtStart(instance.isBeginning);
    setAtEnd(instance.isEnd);
  };

  if (fetchState === "loading") {
    return (
      <section
        className={`${styles["archive-selection"]} ${styles["archive-selection--loading"]}`}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="ds-container">
          <div className={styles["archive-selection__layout"]}>
            <div className={styles["archive-selection__content"]}>
              <div
                className={`${styles["archive-selection__skeleton"]} ${styles["archive-selection__skeleton--eyebrow"]}`}
              />
              <div
                className={`${styles["archive-selection__skeleton"]} ${styles["archive-selection__skeleton--title"]}`}
              />
              <div className={`${styles["archive-selection__skeleton"]} ${styles["archive-selection__skeleton--summary"]}`} />
              <div
                className={`${styles["archive-selection__skeleton"]} ${styles["archive-selection__skeleton--cta"]}`}
              />
            </div>
            <div className={styles["archive-selection__slider"]}>
              <div className={styles["archive-selection__skeleton-carousel"]}>
                <div
                  className={`${styles["archive-selection__skeleton"]} ${styles["archive-selection__skeleton--card"]}`}
                />
                <div
                  className={`${styles["archive-selection__skeleton"]} ${styles["archive-selection__skeleton--card"]}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (fetchState === "error") {
    return (
      <section
        className={`${styles["archive-selection"]} ${styles["archive-selection--error"]}`}
        aria-labelledby={`${sectionId}-err`}
      >
        <div className="ds-container">
          <div className={styles["archive-selection__layout"]}>
            <div className={styles["archive-selection__content"]}>
              <p className={styles["archive-selection__eyebrow"]}>{eyebrow}</p>
              <h2
                className={`${styles["archive-selection__title"]} t-h2`}
                id={`${sectionId}-err`}
              >
                {title}
              </h2>
              <p className={styles["archive-selection__summary"]}>{summary}</p>
              <Link
                href={localePath(locale, "/categories/sale")}
                className={styles["archive-selection__cta"]}
              >
                {ctaLabel}
              </Link>
            </div>
            <div className={styles["archive-selection__state"]}>
              <p className={styles["archive-selection__state-text"]}>
                {errorMessage || t("commerce.loadError")}
              </p>
              {httpStatus ? (
                <p className={styles["archive-selection__state-meta"]}>
                  {t("commerce.responseCode", { code: httpStatus })}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (fetchState !== "success" ) {
    return null;
  }

  return (
    <section
      className={styles["archive-selection"]}
      aria-labelledby={sectionId}
    >
      <div className="ds-container">
        <div className={styles["archive-selection__layout"]}>
          <div className={styles["archive-selection__content"]}>
            <p className={styles["archive-selection__eyebrow"]}>{eyebrow}</p>
            <h2
              className={`${styles["archive-selection__title"]} t-h2`}
              id={sectionId}
            >
              {title}
            </h2>
            <p className={styles["archive-selection__summary"]}>{summary}</p>
            <Link
              href={localePath(locale, "/categories/sale")}
              className={styles["archive-selection__cta"]}
            >
              {ctaLabel}
            </Link>
          </div>

          <div className={styles["archive-selection__slider"]}>
            <button
              type="button"
              className={`${styles["archive-selection__nav-button"]} ${styles["archive-selection__nav-button--prev"]}`}
              onClick={() => swiper?.slidePrev()}
              disabled={atStart}
              aria-label={t("common.back")}
            >
              <CarouselNavArrow direction="prev" />
            </button>

            <Swiper
              key={viewport}
              className={styles["archive-selection__carousel"]}
              modules={[Pagination]}
              allowTouchMove
              simulateTouch
              touchRatio={1}
              grabCursor
              speed={650}
              slidesPerView={carouselSettings.slidesPerView}
              spaceBetween={carouselSettings.spaceBetween}
              pagination={{ clickable: true }}
              onSwiper={(instance) => {
                setSwiper(instance);
                syncNavState(instance);
              }}
              onSlideChange={syncNavState}
              onReachBeginning={() => setAtStart(true)}
              onReachEnd={() => setAtEnd(true)}
              onFromEdge={(instance) => {
                setAtStart(instance.isBeginning);
                setAtEnd(instance.isEnd);
              }}
            >
              
              {products.map((item, index) => (
                <SwiperSlide key={`${item._id}-${index}`}>
                  <div className={styles["archive-selection__slide"]}>
                    <ProductItem
                      product={item}
                      showDiscount
                      discountBadge={getArchiveDiscountBadge(item.offers)}
                        actionButtons={{
                          WishButton: ProductWishlistButton,
                        }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              type="button"
              className={`${styles["archive-selection__nav-button"]} ${styles["archive-selection__nav-button--next"]}`}
              onClick={() => swiper?.slideNext()}
              disabled={atEnd}
              aria-label={t("common.next")}
            >
              <CarouselNavArrow direction="next" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
