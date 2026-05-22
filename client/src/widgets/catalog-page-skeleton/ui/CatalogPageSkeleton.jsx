"use client";

import { useI18n } from "@shared";

const PRODUCT_PLACEHOLDERS = 6;
const SIDEBAR_BLOCK_COUNT = 4;

function pickCount() {
  return Array.from(
    { length: PRODUCT_PLACEHOLDERS },
    (_, i) => i,
  );
}

function pickSidebarBlocks() {
  return Array.from(
    { length: SIDEBAR_BLOCK_COUNT },
    (_, i) => i,
  );
}

export default function CatalogPageSkeleton() {
  const { t } = useI18n();
  return (
    <div
      className="catalog-page catalog-page-skeleton"
      aria-busy="true"
      aria-label={t("aria.catalogLoading")}
    >
      <div className="container">
        <div
          className="catalog-page-skeleton__breadcrumbs"
          aria-hidden
        />
        <header className="catalog-page__header">
          <div className="catalog-page__heading">
            <div
              className="catalog-page-skeleton__title"
              aria-hidden
            />
          </div>
          <div className="catalog-page__toolbar">
            <div
              className="catalog-page-skeleton__chip"
              aria-hidden
            />
            <div
              className="catalog-page-skeleton__chip catalog-page-skeleton__chip--wide"
              aria-hidden
            />
          </div>
        </header>

        <div className="catalog-layout catalog-page-skeleton__layout">
          <aside
            className="catalog-layout__sidebar catalog-page-skeleton__sidebar"
            aria-hidden
          >
            <div className="catalog-page-skeleton__sidebar-card">
              <div className="catalog-page-skeleton__sidebar-title" />
              {pickSidebarBlocks().map((key) => (
                <div
                  key={`sb-${String(key)}`}
                  className="catalog-page-skeleton__sidebar-row"
                />
              ))}
            </div>
          </aside>

          <section className="catalog-layout__content">
            <div className="catalog-page-skeleton__grid">
              {pickCount().map((key) => (
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
          </section>
        </div>
      </div>
    </div>
  );
}
