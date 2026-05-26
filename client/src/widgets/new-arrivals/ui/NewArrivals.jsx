"use client";

import "swiper/css";

import ProductItem from "@entities/product";
import { MOCK_PRODUCT_CARDS } from "@entities/product/model/mockProductCards";
import { BREAKPOINTS, CarouselNavArrow, useI18n } from "@shared";
import { useId, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import styles from "../../bestsellers/ui/Bestsellers.module.scss";

const MIN_SLIDER_ITEMS = 6;

export default function NewArrivals({
  fetchState = "success",
  errorMessage = "",
  httpStatus,
  products,
  useMockProducts = false,
}) {
  const sectionId = useId();
  const { t } = useI18n();

  const [swiper, setSwiper] = useState(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncNavState = (instance) => {
    setAtStart(instance.isBeginning);
    setAtEnd(instance.isEnd);
  };

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
          <div className={styles.skeletonCarousel}>
            <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
            <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
            <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
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

  return (
    <section className={styles.root} aria-labelledby={sectionId}>
      <div className={`ds-container ${styles.inner}`}>
        <h2 className={`${styles.title} t-h2`} id={sectionId}>
          {t("catalog.newArrivalsTitle")}
        </h2>

        <div className={styles.carouselShell}>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonPrev}`}
            onClick={() => swiper?.slidePrev()}
            disabled={atStart}
            aria-label={t("common.back")}
          >
            <CarouselNavArrow direction="prev" />
          </button>

          <Swiper
            className={styles.carousel}
            allowTouchMove
            simulateTouch
            touchRatio={1}
            grabCursor
            speed={650}
            slidesPerView={2}
            spaceBetween={8}
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
            breakpoints={{
              [BREAKPOINTS.tablet]: {
                slidesPerView: 3,
                spaceBetween: 16,
              },
              [BREAKPOINTS.desktop]: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
          >
            {sliderItems.map((item, index) => (
              <SwiperSlide key={`${item._id}-${index}`}>
                <div className={styles.slide}>
                  <ProductItem
                    product={item}
                    showDiscount={false}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonNext}`}
            onClick={() => swiper?.slideNext()}
            disabled={atEnd}
            aria-label={t("common.next")}
          >
            <CarouselNavArrow direction="next" />
          </button>
        </div>
      </div>
    </section>
  );
}
