"use client";

import { useI18n } from "@shared";
import { pickLocalizedString } from "@shared/lib/pickLocalized";
import Image from "next/image";

export default function ProductInfoSizeChartDialog({
  open,
  onClose,
  sizeChart,
  locale,
}) {
  const { t } = useI18n();
  if (!open) return null;

  const title =
    pickLocalizedString(sizeChart?.title, locale) ||
    t("pdp.sizeChartTitle");

  return (
    <div
      className="pdp-sizechart-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="pdp-sizechart" onClick={(e) => e.stopPropagation()}>
        <div className="pdp-sizechart__top">
          <p className="pdp-sizechart__title">
            {title.toUpperCase()}
          </p>
          <button
            type="button"
            className="pdp-sizechart__close"
            aria-label={t("aria.dialogClose")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="pdp-sizechart__body">
          {sizeChart?.imageUrl ? (
            <div className="pdp-sizechart__figure">
              <Image
                src={sizeChart.imageUrl}
                alt={pickLocalizedString(sizeChart?.title, locale) || ""}
                width={1000}
                height={700}
                className="pdp-sizechart__image"
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          ) : null}
          {pickLocalizedString(sizeChart?.description, locale) ? (
            <p className="pdp-info__text-muted">
              {pickLocalizedString(sizeChart.description, locale)}
            </p>
          ) : null}
          {!sizeChart?.imageUrl ? (
            <div
              className="pdp-sizechart__grid"
              role="table"
              aria-label={t("aria.sizeTable")}
            >
              <div className="pdp-sizechart__row pdp-sizechart__row--head" role="row">
                <span role="columnheader">UA</span>
                <span role="columnheader">СМ</span>
              </div>
              {[
                ["36", "23.0"],
                ["37", "24.0"],
                ["38", "24.5"],
                ["39", "25.0"],
                ["40", "25.5"],
              ].map(([ua, cm]) => (
                <div className="pdp-sizechart__row" role="row" key={`${ua}-${cm}`}>
                  <span role="cell">{ua}</span>
                  <span role="cell">{cm}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
