"use client";

import {
  QUERY_PAGE,
  QUERY_PRICE_MAX,
  QUERY_PRICE_MIN,
} from "@shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const PRICE_URL_DEBOUNCE_MS = 350;

function priceInputWidthCh(value) {
  const len = String(value ?? "").length;
  const digits = Math.max(len, 1);
  return Math.min(digits + 1, 14);
}

function deriveLimits(price) {
  let MIN_LIMIT = Number(price?.min);
  let MAX_LIMIT = Number(price?.max);
  if (!Number.isFinite(MIN_LIMIT)) MIN_LIMIT = 0;
  if (!Number.isFinite(MAX_LIMIT)) MAX_LIMIT = MIN_LIMIT + 1;
  if (MAX_LIMIT <= MIN_LIMIT) MAX_LIMIT = MIN_LIMIT + 1;
  return { MIN_LIMIT, MAX_LIMIT };
}

function parseQueryPrice(raw, fallback) {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, low, high) {
  if (!Number.isFinite(n)) return low;
  return Math.min(high, Math.max(low, n));
}

function syncedMinMaxFromUrl(searchParams, MIN_LIMIT, MAX_LIMIT) {
  let minV = parseQueryPrice(
    searchParams.get(QUERY_PRICE_MIN),
    MIN_LIMIT,
  );
  let maxV = parseQueryPrice(
    searchParams.get(QUERY_PRICE_MAX),
    MAX_LIMIT,
  );
  minV = clamp(minV, MIN_LIMIT, MAX_LIMIT);
  maxV = clamp(maxV, MIN_LIMIT, MAX_LIMIT);
  if (minV > maxV) {
    minV = MIN_LIMIT;
    maxV = MAX_LIMIT;
  }
  return { minV, maxV };
}

const PriceRange = ({
  price,
  onApply,
  currency,
  priceMinAria = "Minimum price",
  priceMaxAria = "Maximum price",
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { MIN_LIMIT, MAX_LIMIT } = useMemo(
    () => deriveLimits(price),
    [price],
  );

  const [min, setMin] = useState(() =>
    syncedMinMaxFromUrl(
      searchParams,
      MIN_LIMIT,
      MAX_LIMIT,
    ).minV,
  );
  const [max, setMax] = useState(() =>
    syncedMinMaxFromUrl(
      searchParams,
      MIN_LIMIT,
      MAX_LIMIT,
    ).maxV,
  );

  const minRef = useRef(min);
  const maxRef = useRef(max);
  minRef.current = min;
  maxRef.current = max;

  const [dragging, setDragging] = useState(null);
  const sliderRef = useRef(null);
  const prevDraggingRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const applyPriceToUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(QUERY_PRICE_MIN, String(minRef.current));
    params.set(QUERY_PRICE_MAX, String(maxRef.current));
    params.delete(QUERY_PAGE);

    router.push(`${pathname}?${params.toString()}`, {
      scroll: false,
    });

    if (onApply) onApply();
  }, [searchParams, pathname, router, onApply]);

  const flushApplyPrice = useCallback(() => {
    if (debounceTimerRef.current != null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    applyPriceToUrl();
  }, [applyPriceToUrl]);

  const scheduleApplyPrice = useCallback(() => {
    if (debounceTimerRef.current != null) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      applyPriceToUrl();
    }, PRICE_URL_DEBOUNCE_MS);
  }, [applyPriceToUrl]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current != null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const { minV, maxV } = syncedMinMaxFromUrl(
      searchParams,
      MIN_LIMIT,
      MAX_LIMIT,
    );
    setMin(minV);
    setMax(maxV);
  }, [searchParams, MIN_LIMIT, MAX_LIMIT]);

  useEffect(() => {
    const wasDragging = prevDraggingRef.current !== null;
    const endedDrag =
      wasDragging && dragging === null;

    prevDraggingRef.current = dragging;

    if (endedDrag) {
      flushApplyPrice();
    }
  }, [dragging, flushApplyPrice]);

  const rangeSpan = MAX_LIMIT - MIN_LIMIT || 1;

  const valueToPercent = (value) =>
    ((clamp(value, MIN_LIMIT, MAX_LIMIT) - MIN_LIMIT) /
      rangeSpan) *
    100;
  const percentToValue = (percent) => {
    const v =
      MIN_LIMIT + (rangeSpan * percent) / 100;
    return Math.round(v);
  };

  useEffect(() => {
    if (!dragging) return;
    const slider = sliderRef.current;
    if (!slider) return;

    const handleMove = (e) => {
      const rect = slider.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let percent = (x / rect.width) * 100;
      if (percent < 0) percent = 0;
      if (percent > 100) percent = 100;

      const newValue = percentToValue(percent);

      if (dragging === "min") {
        if (newValue <= maxRef.current) setMin(newValue);
      } else if (dragging === "max") {
        if (newValue >= minRef.current) setMax(newValue);
      }
    };

    const handleUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  const handleMinInputChange = (e) => {
    const raw = e.target.value;
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    const capped = clamp(v, MIN_LIMIT, maxRef.current);
    setMin(capped);
    scheduleApplyPrice();
  };

  const handleMaxInputChange = (e) => {
    const raw = e.target.value;
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    const capped = clamp(v, minRef.current, MAX_LIMIT);
    setMax(capped);
    scheduleApplyPrice();
  };

  const handleMinBlur = () => {
    flushApplyPrice();
  };

  const handleMaxBlur = () => {
    flushApplyPrice();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      flushApplyPrice();
    }
  };

  const safeMin = clamp(min, MIN_LIMIT, MAX_LIMIT);
  const safeMax = clamp(max, MIN_LIMIT, MAX_LIMIT);
  const minPercent = valueToPercent(safeMin);
  const maxPercent = valueToPercent(safeMax);

  return (
    <div className="range-wrapper">
      <div className="slider">
        <div className="slider__inner" ref={sliderRef}>
          <div className="slider__track" />
          <div
            className="slider__range"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
          <div
            className="slider__thumb slider__thumb--left"
            style={{ left: `${minPercent}%` }}
            onMouseDown={() => setDragging("min")}
          />
          <div
            className="slider__thumb slider__thumb--right"
            style={{ left: `${maxPercent}%` }}
            onMouseDown={() => setDragging("max")}
          />
        </div>
      </div>

      <div className="range-wrapper__inputs">
        <div className="range-wrapper__input range-wrapper__input--from">
          <span className="range-wrapper__amount">
            <input
              type="number"
              value={safeMin}
              min={MIN_LIMIT}
              max={safeMax}
              onChange={handleMinInputChange}
              onBlur={handleMinBlur}
              onKeyDown={handleKeyDown}
              aria-label={priceMinAria}
              style={{
                width: `${priceInputWidthCh(safeMin)}ch`,
              }}
            />
            <span className="range-wrapper__currency">
              {currency}
            </span>
          </span>
        </div>
        <div className="range-wrapper__input range-wrapper__input--to">
          <span className="range-wrapper__amount">
            <input
              type="number"
              value={safeMax}
              min={safeMin}
              max={MAX_LIMIT}
              onChange={handleMaxInputChange}
              onBlur={handleMaxBlur}
              onKeyDown={handleKeyDown}
              aria-label={priceMaxAria}
              style={{
                width: `${priceInputWidthCh(safeMax)}ch`,
              }}
            />
            <span className="range-wrapper__currency">
              {currency}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceRange;
