"use client";

import ProductItem from "@entities/product";
import { buildCatalogSearchResultsHref } from "@shared";
import Link from "next/link";
import { useMemo } from "react";

import styles from "./SearchResultsPreview.module.scss";

function hasUsableIdOrSlug(product) {
  if (!product || typeof product !== "object") {
    return false;
  }
  const idRaw = product._id ?? product.id;
  const hasId =
    idRaw != null && String(idRaw).trim() !== "";
  const slug = product.slug;
  if (typeof slug === "string") {
    return slug.trim() !== "";
  }
  if (slug && typeof slug === "object") {
    return Boolean(
      String(slug.ua ?? slug.en ?? slug.uk ?? "").trim(),
    );
  }
  return hasId;
}

function previewRowKey(product, index) {
  if (product?._id != null) {
    return `search-${String(product._id)}`;
  }
  if (product?.id != null) {
    return `search-id-${String(product.id)}`;
  }
  if (typeof product?.slug === "string" && product.slug.trim()) {
    return `search-slug-${product.slug}`;
  }
  return `search-idx-${index}`;
}

const SearchResultsPreview = ({
  items,
  locale,
  query,
  onClose,
  isLoading,
  isError = false,
}) => {
  const total = Number(items?.meta?.total ?? 0);
  const list = useMemo(() => {
    const raw = Array.isArray(items?.items) ? items.items : [];
    return raw.filter(hasUsableIdOrSlug);
  }, [items]);

  const previewList = list.slice(0, 6);
  const shouldShowSeeAll = total > 6;
  const seeAllHref = useMemo(() => {
    if (!shouldShowSeeAll) {
      return null;
    }
    return buildCatalogSearchResultsHref(locale, query);
  }, [shouldShowSeeAll, locale, query]);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <p className={styles.label}>
          Завантаження…
        </p>
        <ul className={styles.list}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <li key={idx}>
              <div className={styles.skeleton} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.root}>
        <p className={styles.error}>
          Сталася помилка при завантаженні
        </p>
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>
          Результатів не знайдено
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <p className={styles.title}>Знайдені товари:</p>

      <ul className={styles.list}>
        {previewList.map((prod, index) => (
          <li key={previewRowKey(prod, index)}>
            <ProductItem product={prod} variant="searchPreview" />
          </li>
        ))}
      </ul>

      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className={styles.button}
          onClick={onClose}
        >
          <p>Дивитись всі результати</p>
        </Link>
      ) : null}
    </div>
  );
};

export default SearchResultsPreview;
