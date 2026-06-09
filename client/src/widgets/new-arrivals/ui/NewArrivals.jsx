"use client";

import "swiper/css";

import { useI18n } from "@shared";
import HomeProductCarousel from "@widgets/bestsellers/ui/HomeProductCarousel";
import ProductCarouselSkeleton from "@widgets/bestsellers/ui/ProductCarouselSkeleton";
import { useId, useMemo } from "react";

import styles from "../../bestsellers/ui/Bestsellers.module.scss";

export default function NewArrivals({
  fetchState = "success",
  errorMessage = "",
  httpStatus,
  products,
}) {
  const sectionId = useId();
  const { t } = useI18n();

  const sliderItems = useMemo(
    () => (Array.isArray(products?.items) ? products.items : []),
    [products?.items],
  );

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
            {t("catalog.newArrivalsTitle")}
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

  if (sliderItems.length === 0) {
    return null;
  }

  return (
    <section className={styles.root} aria-labelledby={sectionId}>
      <div className={`ds-container ${styles.inner}`}>
        <h2 className={`${styles.title} t-h2`} id={sectionId}>
          {t("catalog.newArrivalsTitle")}
        </h2>

        <HomeProductCarousel items={sliderItems} />
      </div>
    </section>
  );
}
