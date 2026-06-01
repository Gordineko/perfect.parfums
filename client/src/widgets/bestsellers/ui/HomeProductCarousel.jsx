"use client";

import ProductItem from "@entities/product";
import { BREAKPOINTS, CarouselNavArrow, useI18n } from "@shared";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import styles from "./Bestsellers.module.scss";
import ProductCarouselSkeleton from "./ProductCarouselSkeleton";

export default function HomeProductCarousel({ items }) {
  const { t } = useI18n();
  const [isMounted, setIsMounted] = useState(false);
  const [isSwiperReady, setIsSwiperReady] = useState(false);
  const [swiper, setSwiper] = useState(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const syncNavState = (instance) => {
    setAtStart(instance.isBeginning);
    setAtEnd(instance.isEnd);
  };

  const showSkeleton = !isMounted || !isSwiperReady;

  return (
    <div
      className={styles.carouselShell}
      aria-busy={showSkeleton ? "true" : undefined}
    >
      {showSkeleton ? <ProductCarouselSkeleton /> : null}

      {isMounted ? (
        <>
          {!showSkeleton ? (
            <button
              type="button"
              className={`${styles.navButton} ${styles.navButtonPrev}`}
              onClick={() => swiper?.slidePrev()}
              disabled={atStart}
              aria-label={t("common.back")}
            >
              <CarouselNavArrow direction="prev" />
            </button>
          ) : null}

          <Swiper
            className={`${styles.carousel} ${showSkeleton ? styles.carouselInitHidden : ""}`}
            allowTouchMove={!showSkeleton}
            simulateTouch
            touchRatio={1}
            grabCursor={!showSkeleton}
            speed={650}
            slidesPerView={2}
            spaceBetween={8}
            breakpointsBase="window"
            observer
            observeParents
            onSwiper={(instance) => {
              setSwiper(instance);
              syncNavState(instance);
            }}
            onInit={(instance) => {
              instance.update();
              requestAnimationFrame(() => {
                setIsSwiperReady(true);
              });
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
            {items.map((item, index) => (
              <SwiperSlide key={`${item._id}-${index}`}>
                <div className={styles.slide}>
                  <ProductItem
                    product={item}
                    showDiscount={false}
                    imagePriority={index < 2}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {!showSkeleton ? (
            <button
              type="button"
              className={`${styles.navButton} ${styles.navButtonNext}`}
              onClick={() => swiper?.slideNext()}
              disabled={atEnd}
              aria-label={t("common.next")}
            >
              <CarouselNavArrow direction="next" />
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
