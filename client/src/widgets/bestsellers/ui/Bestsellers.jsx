"use client";

import "swiper/css";
import "swiper/css/pagination";

import ProductItem from "@entities/product";
import ProductWishlistButton from "@features/toggle-wishlist";
import { BREAKPOINTS, useI18n } from "@shared";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Pagination } from "swiper/modules";
import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import styles from "./Bestsellers.module.scss";


function BestsellersWishButton({ product }) {
  return <ProductWishlistButton product={product} />;
}

function BestsellersCartButton({ pdpHref }) {
  const { t } = useI18n();

  if (!pdpHref) return null;

  return (
    <Link
      href={pdpHref}
      className="product-item__button"
      onClick={(event) => event.stopPropagation()}
    >
      <p>{t("catalog.bestsellersGoToProduct")}</p>
    </Link>
  );
}

function CarouselArrow({ direction, active }) {
  const fill = active ? "#1A1A1A" : "#8D8D8D";
  const isPrev = direction === "prev";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="37"
      height="37"
      viewBox="0 0 37 37"
      fill="none"
      aria-hidden="true"
    >
      <rect
        width="37"
        height="37"
        transform={isPrev ? "matrix(-1 0 0 1 37 0)" : undefined}
        fill={fill}
      />
      <path
        d={isPrev ? "M20 24L17 18.5L20 13" : "M17 24L20 18.5L17 13"}
        stroke="#FEFEFE"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Bestsellers({
  fetchState = "success",
  errorMessage = "",
  httpStatus,
  products
}) {
  const sectionId = useId();
  const params = useParams();
  const locale = params?.locale ?? "ua";
  const { t } = useI18n();

  // items теперь приходят через products.items
  const [swiper, setSwiper] = useState(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncNavState = (instance) => {
    setAtStart(instance.isBeginning);
    setAtEnd(instance.isEnd);
  };

  if (fetchState === "loading") {
    return (
      <section
        className={`${styles.root} ${styles.loading}`}
        aria-busy="true"
        aria-live="polite"
      >
        <div className={`ds-container ${styles.inner}`}>
          <div className={styles.heading}>
            <div className={`${styles.skeleton} ${styles.skeletonKicker}`} />
            <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
          </div>
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
          <div className={styles.heading}>
            <p className={styles.eyebrow}>
              {t("catalog.bestsellersEyebrow")}
            </p>
            <h2
              className={`${styles.title} t-h2`}
              id={`${sectionId}-err`}
            >
              {t("catalog.bestsellersTitle")}
            </h2>
          </div>
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
    <section
      className={styles.root}
      aria-labelledby={sectionId}
    >
      <div className={`ds-container ${styles.inner}`}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>
              {t("catalog.bestsellersEyebrow")}
            </p>
            <h2 className={`${styles.title} t-h2`} id={sectionId}>
              {t("catalog.bestsellersTitle")}
            </h2>
          </div>
          <Link
            href={`/${locale}/categories/girls`}
            className={styles.allLink}
          >
            {t("catalog.allProducts")}
          </Link>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.carouselShell}>
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonPrev}`}
            onClick={() => swiper?.slidePrev()}
            disabled={atStart}
            aria-label={t("common.back")}
          >
            <CarouselArrow direction="prev" active={!atStart} />
          </button>

          <Swiper
            className={styles.carousel}
            modules={[Pagination]}
            allowTouchMove
            simulateTouch
            touchRatio={1}
            grabCursor
            speed={650}
            slidesPerView={2}
            spaceBetween={16}
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
            breakpoints={{
              [BREAKPOINTS.tablet]: {
                spaceBetween: 24,
              },
              [BREAKPOINTS.desktop]: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
          >
            {products.items.map((item, index) => (
              <SwiperSlide key={`${item._id}-${index}`}>
                <div className={styles.slide}>
                  <ProductItem
                    product={item}
                    showDiscount={false}
                    actionButtons={{
                      WishButton: BestsellersWishButton,
                      CartButton: BestsellersCartButton,
                    }}
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
            <CarouselArrow direction="next" active={!atEnd} />
          </button>
        </div>
      </div>
    </section>
  );
}
