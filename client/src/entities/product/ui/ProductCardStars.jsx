import styles from "./ProductCard.module.scss";

function StarIcon({ active }) {
  const fill = active ? "#11110F" : "#DEDEDE";

  return (
    <svg
      width="23"
      height="22"
      viewBox="0 0 23 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M11.4127 0L14.9394 7.1459L22.8254 8.2918L17.119 13.8541L18.4661 21.7082L11.4127 18L4.35927 21.7082L5.70635 13.8541L1.14441e-05 8.2918L7.88598 7.1459L11.4127 0Z"
        fill={fill}
      />
    </svg>
  );
}

export default function ProductCardStars({ rating = 0 }) {
  const safeRating = Number(rating);
  const rounded = Number.isFinite(safeRating)
    ? Math.min(5, Math.max(0, Math.round(safeRating)))
    : 0;

  return (
    <div
      className={styles.stars}
      role="img"
      aria-label={`Рейтинг: ${safeRating || 0} з 5`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={styles.star}>
          <StarIcon active={index < rounded} />
        </span>
      ))}
    </div>
  );
}
