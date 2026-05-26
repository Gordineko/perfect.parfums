"use client";

import { useI18n, useModals } from "@shared";
import ReviewStars from "@entities/review-card/ui/ReviewStars";
import ReviewUserAvatarIcon from "@widgets/customer-reviews/ui/ReviewUserAvatarIcon";

import styles from "./PdpReviewsList.module.scss";

export default function PdpReviewsList({ reviews = [] }) {
  const { setIsModalOpen } = useModals();
  const { t } = useI18n();

  const items = Array.isArray(reviews) ? reviews : [];
  const count = items.length;
  const isEmpty = count === 0;

  return (
    <section
      className={`${styles.root} section-margin`}
      aria-label={t("pdp.reviews.sectionAria")}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          {t("pdp.reviews.sectionTitle")}{" "}
          <span className={styles.count}>({count})</span>
        </h2>

        <button
          type="button"
          className={styles.leave}
          onClick={() => setIsModalOpen("write-review")}
        >
          {t("pdp.reviews.addReview")}
        </button>
      </header>

      <div className={styles.list}>
        {isEmpty ? (
          <p className={styles.empty}>{t("pdp.reviews.empty")}</p>
        ) : (
          items.map((review) => (
            <article key={review.id} className={styles.item}>
              <div className={styles.itemHead}>
                <div className={styles.avatar}>
                  <ReviewUserAvatarIcon />
                </div>
                <div className={styles.meta}>
                  <p className={styles.name}>{review.name}</p>
                  <p className={styles.date}>{review.date}</p>
                </div>
              </div>

              <div className={styles.rating}>
                <ReviewStars rating={review.rating} />
              </div>

              <p className={styles.text}>{review.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
