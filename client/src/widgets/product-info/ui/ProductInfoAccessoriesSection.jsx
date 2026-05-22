"use client";

import { useI18n } from "@shared";
import { formatPriceDigits } from "@shared/lib/formatPrice";
import { pickLocalizedString } from "@shared/lib/pickLocalized";
import Image from "next/image";

function num(v) {
  if (v == null || v === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export default function ProductInfoAccessoriesSection({
  accessories,
  locale,
  selectedAccessoryIds,
  onToggleAccessory,
}) {
  const { t } = useI18n();
  if (!accessories.length) return null;

  return (
    <>
      <div
        className="pdp-info__accessory-list"
        aria-label={t("pdp.accessoriesAria")}
      >
        {accessories.map((acc) => {
          const id = acc?.productGroupId;
          const selected = id
            ? [...selectedAccessoryIds].some((k) => String(k) === String(id))
            : false;
          const accTitle = pickLocalizedString(acc.title, locale);
          const accSub = pickLocalizedString(acc.subtitle, locale);
          const priceNum = num(acc?.price);
          const priceLabel = Number.isFinite(priceNum)
            ? `₴ ${formatPriceDigits(priceNum)}`
            : "₴ 0";

          return (
            <button
              key={id ?? accTitle}
              type="button"
              className="pdp-info__accessory-card"
              aria-pressed={selected ? "true" : "false"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleAccessory(id != null ? String(id) : id);
              }}
            >
              <span className="pdp-info__accessory-thumb" aria-hidden="true">
                {acc?.imageUrl ? (
                  <Image
                    fill
                    sizes="72px"
                    src={acc.imageUrl}
                    alt=""
                  />
                ) : null}
              </span>
              <span className="pdp-info__accessory-title">{accTitle}</span>
              <span className="pdp-info__accessory-subtitle">{accSub}</span>
              <span className="pdp-info__accessory-price">{priceLabel}</span>
              <span
                className={`pdp-info__accessory-check${selected ? " is-active" : ""}`}
                aria-hidden="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M1 7.93333L5.33333 14L14 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>

      <div className="pdp-info__divider" aria-hidden="true" />
    </>
  );
}
