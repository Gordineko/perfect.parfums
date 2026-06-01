"use client";

import { useEffect, useState } from "react";

import { useDebounce } from "../lib/useDebounce";
import { searchProducts } from "../model/searchProducts";
import clsx from "clsx";

import SearchResultsPreview from "./SearchResultsPreview";
import styles from "./SearchDropdown.module.scss";

export default function SearchDropdown({
  locale,
  labels,
  query,
  onClose,
  staticPanel = false,
}) {
  const debouncedQuery = useDebounce(query, 400);
  const trimmed = debouncedQuery.trim();

  const [results, setResults] = useState({ items: [], meta: { total: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!trimmed) {
      setResults({ items: [], meta: { total: 0 } });
      setIsError(false);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsError(false);
      setIsLoading(true);
      try {
        const data = await searchProducts(trimmed, locale ?? "ua");
        if (!cancelled) setResults(data);
      } catch (error) {
        console.error("Search error:", error);
        if (!cancelled) {
          setIsError(true);
          setResults({ items: [], meta: { total: 0 } });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [trimmed, locale]);

  if (!query.trim()) {
    return null;
  }

  return (
    <div
      className={clsx(styles.panel, staticPanel && styles.panelStatic)}
      role="listbox"
    >
      <SearchResultsPreview
        locale={locale}
        items={results}
        isLoading={isLoading}
        isError={isError}
        query={query}
        onClose={onClose}
        labels={labels}
      />
    </div>
  );
}
