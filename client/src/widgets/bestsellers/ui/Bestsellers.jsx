"use client";

import "swiper/css";

import { MOCK_PRODUCT_CARDS } from "@entities/product/model/mockProductCards";
import { useI18n } from "@shared";
import { useId, useMemo } from "react";

import styles from "./Bestsellers.module.scss";
import HomeProductCarousel from "./HomeProductCarousel";
import ProductCarouselSkeleton from "./ProductCarouselSkeleton";

const MIN_SLIDER_ITEMS = 6;

export default function Bestsellers({
  fetchState = "success",
  errorMessage = "",
  httpStatus,
  products,
  useMockProducts = false,
}) {
  const sectionId = useId();
  const { t } = useI18n();

  const sliderItems = useMemo(() => {
    if (useMockProducts) {
      return MOCK_PRODUCT_CARDS;
    }

    const apiItems = products?.items?.length ? products.items : [];

    if (apiItems.length === 0) {
      return MOCK_PRODUCT_CARDS;
    }

    if (apiItems.length >= MIN_SLIDER_ITEMS) {
      return apiItems;
    }

    const extraMocks = MOCK_PRODUCT_CARDS.slice(
      0,
      MIN_SLIDER_ITEMS - apiItems.length,
    );

    return [...apiItems, ...extraMocks];
  }, [products?.items, useMockProducts]);

  if (fetchState === "loading") {
    return (
      <section
        className={`${styles.root} ${styles.loading}`}
        aria-busy="true"
        aria-live="polite"
      >
        <div className={`ds-container ${styles.inner}`}>
          <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          <div className={styles.carouselShell}>
            <ProductCarouselSkeleton />
          </div>
        </div>
      </section>
    );
  }

  if (fetchState === "error") {
    return (
      <section
        className={`${styles.root} ${styles.error}`}
        aria-labelledby={`${sectionId}-err`}
      >
        <div className={`ds-container ${styles.inner}`}>
          <h2
            className={`${styles.title} t-h2`}
            id={`${sectionId}-err`}
          >
            {t("catalog.bestsellersTitle")}
          </h2>
          <div className={styles.state}>
            <p className={styles.stateText}>
              {errorMessage || t("commerce.loadError")}
            </p>
            {httpStatus ? (
              <p className={styles.stateMeta}>
                {t("commerce.responseCode", { code: httpStatus })}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.root} aria-labelledby={sectionId}>
      <div className={`ds-container ${styles.inner}`}>
        <h2 className={`${styles.title} t-h2`} id={sectionId}>
          {t("catalog.bestsellersTitle")}
        </h2>

        <HomeProductCarousel items={sliderItems} />
      </div>
    </section>
  );
}
