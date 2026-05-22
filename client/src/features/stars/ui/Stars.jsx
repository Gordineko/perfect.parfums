import { StarDecor } from "@shared";
import React from "react";

const Stars = ({ rating }) => {
  const safeRating = Number(rating);
  const rounded = Number.isFinite(safeRating) ? Math.round(safeRating) : 0;
  const fullStars = Math.min(5, Math.max(0, rounded));
  const emptyStars = 5 - fullStars;

  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span
        key={`full-${i}`}
        className="stars__icon stars__icon--full"
        aria-hidden="true"
      >
        <StarDecor />
      </span>
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span
        key={`empty-${i}`}
        className="stars__icon stars__icon--empty"
        aria-hidden="true"
      >
        <StarDecor />
      </span>
    );
  }

  return (
    <div className="stars" aria-label={`Рейтинг: ${safeRating || 0} з 5`}>
      {stars}
    </div>
  );
};

export default Stars;
