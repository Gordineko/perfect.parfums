"use client";

import { useI18n } from "@shared";

const PRODUCT_PLACEHOLDERS = 8;
const PAGINATION_DOTS = 4;

function pickCount(length) {
  return Array.from({ length }, (_, i) => i);
}

export default function CatalogPageSkeleton() {
  const { t } = useI18n();

  return (
    <div
      className="catalog-page catalog-page-skeleton"
      aria-busy="true"
      aria-label={t("aria.catalogLoading")}
    >
      <div className="catalog-page-skeleton__breadcrumbs" aria-hidden>
        <div className="container">
          <div className="catalog-page-skeleton__breadcrumbs-line" />
        </div>
      </div>

      <div className="catalog-page-skeleton__filters-zone">
        <div className="catalog-page-skeleton__toolbar">
          <div className="container">
            <div
              className="catalog-page-skeleton__control-bar"
              aria-hidden
            >
              <div className="catalog-page-skeleton__control-cell" />
              <div className="catalog-page-skeleton__control-cell catalog-page-skeleton__control-cell--title" />
              <div className="catalog-page-skeleton__control-cell" />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="catalog-layout catalog-page-skeleton__layout">
          <section className="catalog-layout__content">
            <div className="catalog-page-skeleton__grid" aria-hidden>
              {pickCount(PRODUCT_PLACEHOLDERS).map((key) => (
                <div
                  key={`card-${String(key)}`}
                  className="catalog-page-skeleton__card"
                >
                  <div className="catalog-page-skeleton__media" />
                  <div className="catalog-page-skeleton__line catalog-page-skeleton__line--short" />
                  <div className="catalog-page-skeleton__line" />
                  <div className="catalog-page-skeleton__line catalog-page-skeleton__line--price" />
                </div>
              ))}
            </div>

            <div
              className="catalog-page-skeleton__pagination"
              aria-hidden
            >
              {pickCount(PAGINATION_DOTS).map((key) => (
                <span
                  key={`page-${String(key)}`}
                  className="catalog-page-skeleton__page-dot"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
