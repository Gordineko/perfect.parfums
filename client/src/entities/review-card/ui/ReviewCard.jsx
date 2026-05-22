"use client";
import { useI18n } from "@shared";

import ReviewStars from "./ReviewStars";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatReviewDate(value, t) {
  if (!value) return t("reviews.datePlaceholder");

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const ReviewCard = ({ review }) => {
  const { t } = useI18n();
  const name = review?.name || t("reviews.nameFallback");
  const txt = review?.text || t("reviews.textFallback");
  const rawRating = Number(review?.rating);
  const rating = Number.isFinite(rawRating) ? rawRating : 0;
  const dateText = formatReviewDate(
    review?.createdAt ?? review?.date ?? review?.updatedAt,
    t,
  );
  return (
    <article className="pdp-review-card">
      <header className="pdp-review-card__head">
        <div className="pdp-review-card__meta">
          <p className="pdp-review-card__date">{dateText}</p>
          <h3 className="pdp-review-card__name">{name}</h3>
        </div>

        <div
          className="pdp-review-card__rating"
          aria-label={t("aria.reviewRating")}
        >
          <ReviewStars rating={rating} />
        </div>
      </header>

      <p className="pdp-review-card__text">{txt}</p>
    </article>
  );
};

export default ReviewCard;
