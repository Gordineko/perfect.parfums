"use client";

import "swiper/css";

import { BREAKPOINTS, useI18n } from "@shared";
import { useId, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import { mapHomeReviewView } from "../lib/mapHomeReviewView";
import CustomerReviewCard from "./CustomerReviewCard";
import styles from "./CustomerReviews.module.scss";

export default function CustomerReviews({ reviews = [] }) {
  const sectionId = useId();
  const { t, locale } = useI18n();

  const items = useMemo(() => {
    const apiItems = Array.isArray(reviews) ? reviews : [];
    return apiItems
      .map((review) => mapHomeReviewView(review, locale))
      .filter((review) => review.id);
  }, [reviews, locale]);

  return (
    <section className={styles.root} aria-labelledby={sectionId}>
      <div className={`ds-container ${styles.inner}`}>
        <h2 className={`${styles.title} t-h2`} id={sectionId}>
          {t("reviews.homeSectionTitle")}
        </h2>

        {items.length === 0 ? (
          <div className={styles.empty} role="status">
            <span className={styles.emptyMark} aria-hidden>
              ✦
            </span>
            <p className={styles.emptyText}>{t("reviews.listEmpty")}</p>
          </div>
        ) : (
          <div className={styles.carouselShell}>
            <Swiper
              className={styles.carousel}
              allowTouchMove
              simulateTouch
              touchRatio={1}
              grabCursor
              speed={650}
              slidesPerView={1}
              spaceBetween={12}
              breakpoints={{
                [BREAKPOINTS.tablet]: {
                  slidesPerView: 2,
                  spaceBetween: 16,
                },
                [BREAKPOINTS.desktop]: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
              }}
            >
              {items.map((review) => (
                <SwiperSlide key={review.id}>
                  <div className={styles.slide}>
                    <CustomerReviewCard review={review} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
}
