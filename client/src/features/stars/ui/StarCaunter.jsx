import { useId, useState } from "react";

import { calcStarValue, getStarVariant } from "../lib/StarBtns";

const STAR_PATH =
  "M12.2793 7.25684L12.3926 7.5498L12.7061 7.57422L18.7881 8.04785L14.1074 12.2061L13.8848 12.4043L13.9521 12.6943L15.4082 18.8994L10.2734 15.5518L10 15.374L9.72656 15.5518L4.59082 18.8994L6.04785 12.6943L6.11523 12.4043L5.89258 12.2061L1.21094 8.04785L7.29395 7.57422L7.60742 7.5498L7.7207 7.25684L10 1.38086L12.2793 7.25684Z";

const GOLD = "#FFCD3F";
const EMPTY = "#E5E7EB";

function ModalStarIcon({ variant, clipPathId }) {
  if (variant === "full") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d={STAR_PATH} fill={GOLD} stroke={GOLD} />
      </svg>
    );
  }

  if (variant === "empty") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d={STAR_PATH} fill={EMPTY} stroke={EMPTY} />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipPathId}>
          <rect x="0" y="0" width="10" height="20" />
        </clipPath>
      </defs>
      <path d={STAR_PATH} fill={EMPTY} stroke={EMPTY} />
      <g clipPath={`url(#${clipPathId})`}>
        <path d={STAR_PATH} fill={GOLD} stroke={GOLD} />
      </g>
    </svg>
  );
}

const StarCounter = ({ rating = 0, onSelect }) => {
  const [hover, setHover] = useState(null);
  const display = hover ?? rating;
  const reactId = useId();
  const safePrefix = reactId.replace(/:/g, "");

  return (
    <div className="star-counter" role="group" aria-label="Оцінка">
      {Array.from({ length: 5 }).map((_, i) => {
        const variant = getStarVariant(display, i);
        const clipPathId = `${safePrefix}-half-${i}`;
        return (
          <button
            key={i}
            type="button"
            className="star-counter__btn"
            aria-label={`${i + 1} з 5`}
            onMouseMove={(e) => setHover(calcStarValue(e, i))}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => onSelect?.(calcStarValue(e, i))}
          >
            <ModalStarIcon
              variant={variant}
              clipPathId={clipPathId}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarCounter;
