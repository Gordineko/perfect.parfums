"use client";

import {
  getBucketCount,
  getBucketLabel,
  getBucketValueString,
} from "../lib/filterFacetHelpers";

export default function FilterSizeGrid({
  metaKey,
  buckets,
  locale,
  filterType,
  isSelected,
  onSizeToggle,
}) {
  return (
    <ul className="filters-size-grid">
      {buckets.map((bucket, idx) => {
        const valueStr = getBucketValueString(bucket, filterType);
        const label = getBucketLabel(bucket, locale, filterType);
        const count = getBucketCount(bucket);
        const selected = isSelected(metaKey, valueStr, filterType);

        return (
          <li className="filters-size-grid__item" key={idx}>
            <button
              type="button"
              className={`filters-size-grid__btn ${
                selected ? "is-selected" : ""
              }`}
              onClick={() =>
                onSizeToggle(metaKey, valueStr, filterType)
              }
            >
              <span className="filters-size-grid__label">
                {label}
              </span>
              {count != null && (
                <span className="filters-size-grid__count">
                  ({count})
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
