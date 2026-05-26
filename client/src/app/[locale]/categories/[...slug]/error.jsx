"use client";

import { useI18n } from "@shared";
import { useEffect } from "react";

export default function CategoriesRouteError({ error, reset }) {
  const { t } = useI18n();

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && error) {
      console.error("[categories]", error);
    }
  }, [error]);

  return (
    <div className="category-page category-page--error">
      <div className="container">
        <header className="catalog-page__header catalog-page-skeleton-error">
          <div className="catalog-page__heading">
            <h1 className="catalog-page__title t-h1">
              {t("catalog.loadErrorTitle")}
            </h1>
          </div>
        </header>

        <p className="catalog-page-error__lead">
          {t("catalog.loadErrorDescription")}
        </p>

        <button
          type="button"
          className="catalog-page-error__retry"
          onClick={() => reset()}
        >
          {t("catalog.loadErrorRetry")}
        </button>
      </div>
    </div>
  );
}
