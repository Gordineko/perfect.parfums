import { useId, useState } from "react";

import { calcStarValue, getStarVariant } from "../lib/StarBtns";

const STAR_PATH =
  "M12.2793 7.25684L12.3926 7.5498L12.7061 7.57422L18.7881 8.04785L14.1074 12.2061L13.8848 12.4043L13.9521 12.6943L15.4082 18.8994L10.2734 15.5518L10 15.374L9.72656 15.5518L4.59082 18.8994L6.04785 12.6943L6.11523 12.4043L5.89258 12.2061L1.21094 8.04785L7.29395 7.57422L7.60742 7.5498L7.7207 7.25684L10 1.38086L12.2793 7.25684Z";

const OUTLINE_STAR_PATH =
  "M24.4512 12.1309L24.5674 12.3672L24.8271 12.4043L36.9678 14.168L28.1826 22.7324L27.9951 22.916L28.0391 23.1748L30.1123 35.2656L19.2539 29.5576L19.0215 29.4355L18.7891 29.5576L7.92969 35.2656L10.0039 23.1748L10.0479 22.916L9.86035 22.7324L1.07422 14.168L13.2158 12.4043L13.4756 12.3672L13.5918 12.1309L19.0215 1.12891L24.4512 12.1309Z";

const GOLD = "#FFCD3F";
const EMPTY = "#E5E7EB";
const OUTLINE_STROKE = "#11110F";

function OutlineStarIcon({ variant, clipPathId }) {
  const filled = variant === "full";

  if (variant === "half") {
    return (
      <svg
        width="39"
        height="37"
        viewBox="0 0 39 37"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipPathId}>
            <rect x="0" y="0" width="19.5" height="37" />
          </clipPath>
        </defs>
        <path
          d={OUTLINE_STAR_PATH}
          stroke={OUTLINE_STROKE}
          fill="none"
        />
        <g clipPath={`url(#${clipPathId})`}>
          <path
            d={OUTLINE_STAR_PATH}
            stroke={OUTLINE_STROKE}
            fill={OUTLINE_STROKE}
          />
        </g>
      </svg>
    );
  }

  return (
    <svg
      width="39"
      height="37"
      viewBox="0 0 39 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={OUTLINE_STAR_PATH}
        stroke={OUTLINE_STROKE}
        fill={filled ? OUTLINE_STROKE : "none"}
      />
    </svg>
  );
}

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

const StarCounter = ({
  rating = 0,
  onSelect,
  appearance = "default",
  disableHover = false,
}) => {
  const useOutline = appearance === "outline";
  const hoverDisabled = disableHover || useOutline;
  const [hover, setHover] = useState(null);
  const display = hoverDisabled ? rating : hover ?? rating;
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
            onMouseMove={
              hoverDisabled
                ? undefined
                : (e) => setHover(calcStarValue(e, i))
            }
            onMouseLeave={
              hoverDisabled ? undefined : () => setHover(null)
            }
            onClick={(e) => onSelect?.(calcStarValue(e, i))}
          >
            {useOutline ? (
              <OutlineStarIcon
                variant={variant}
                clipPathId={clipPathId}
              />
            ) : (
              <ModalStarIcon
                variant={variant}
                clipPathId={clipPathId}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarCounter;
