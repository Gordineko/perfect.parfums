"use client";

import { buildCatalogSearchResultsHref } from "@shared";
import Link from "next/link";
import { useMemo } from "react";

import SearchResultRow from "./SearchResultRow";
import styles from "./SearchResultsPreview.module.scss";

function hasUsableIdOrSlug(product) {
  if (!product || typeof product !== "object") {
    return false;
  }
  const idRaw = product._id ?? product.id;
  const hasId = idRaw != null && String(idRaw).trim() !== "";
  const slug = product.slug;
  if (typeof slug === "string") {
    return slug.trim() !== "";
  }
  if (slug && typeof slug === "object") {
    return Boolean(String(slug.ua ?? slug.en ?? slug.uk ?? "").trim());
  }
  return hasId;
}

function previewRowKey(product, index) {
  if (product?._id != null) return `search-${String(product._id)}`;
  if (product?.id != null) return `search-id-${String(product.id)}`;
  if (typeof product?.slug === "string" && product.slug.trim()) {
    return `search-slug-${product.slug}`;
  }
  return `search-idx-${index}`;
}

export default function SearchResultsPreview({
  items,
  locale,
  query,
  onClose,
  isLoading,
  isError = false,
  labels = {},
}) {
  const total = Number(items?.meta?.total ?? 0);
  const list = useMemo(() => {
    const raw = Array.isArray(items?.items) ? items.items : [];
    return raw.filter(hasUsableIdOrSlug);
  }, [items]);

  const previewList = list.slice(0, 6);
  const seeAllHref = useMemo(() => {
    const trimmed = String(query ?? "").trim();
    if (!trimmed || total <= previewList.length) return null;
    return buildCatalogSearchResultsHref(locale, trimmed);
  }, [locale, query, total, previewList.length]);

  if (isLoading) {
    return (
      <div className={styles.state}>
        <p>{labels.loading ?? "Завантаження…"}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.state}>
        <p>{labels.error ?? "Сталася помилка при завантаженні"}</p>
      </div>
    );
  }

  if (!list.length) {
    return (
      <div className={styles.state}>
        <p>{labels.empty ?? "Результатів не знайдено"}</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <ul className={styles.list}>
        {previewList.map((prod, index) => (
          <li key={previewRowKey(prod, index)}>
            <SearchResultRow product={prod} locale={locale} onClose={onClose} />
          </li>
        ))}
      </ul>

      {seeAllHref ? (
        <Link href={seeAllHref} className={styles.showAll} onClick={onClose}>
          {labels.showAll ?? "Показати усі результати"}
        </Link>
      ) : null}
    </div>
  );
}
