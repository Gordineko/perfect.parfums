"use client";

import {
  buildCatalogSearchResultsHref,
  CloseX,
} from "@shared";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useDebounce } from "../lib/useDebounce";
import { searchProducts } from "../model/searchProducts";
import SearchModalPopular from "./common/SearchModalPopular";
import styles from "./SearchModal.module.scss";
import SearchResultsPreview from "./SearchResultsPreview";

const SearchModal = ({ isOpen, onClose, labels, locale }) => {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const prevPathnameRef = useRef(pathname);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState({
    items: [],
    meta: { total: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (!isOpen) return;
    if (prev === pathname) return;

    onClose();
  }, [isOpen, onClose, pathname]);

  const debouncedQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    let cancelled = false;

    if (!debouncedQuery.trim()) {
      setResults({ items: [], meta: { total: 0 } });
      setIsError(false);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsError(false);
      setIsLoading(true);
      try {
        const data = await searchProducts(
          debouncedQuery,
          locale ?? "ua",
        );
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
  }, [debouncedQuery, locale]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }
    const href = buildCatalogSearchResultsHref(
      locale,
      trimmed,
    );
    if (!href) {
      return;
    }
    onClose();
    router.push(href);
  };

  const popularItems = useMemo(
    () =>
      labels?.popularItems ?? [
        "Лляний сет \"Sable\"",
        "Плаття \"Fleur d'été\"",
      ],
    [labels?.popularItems],
  );

  const showPopular = isOpen && !searchQuery.trim();
  const showResultsBlock =
    isOpen && (isLoading || searchQuery.trim().length > 0);

  const content = (
    <div
      className={`${styles.root} ${isOpen ? styles.rootOpen : ""}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.content}>
        <div className={styles.container}>
          <button
            type="button"
            className={styles.close}
            aria-label={labels.close}
            onClick={onClose}
          >
            <CloseX />
          </button>

          <form
            className={styles.field}
            onSubmit={handleSearchSubmit}
          >
            <input
              type="text"
              className={styles.input}
              placeholder={labels.placeholder}
              value={searchQuery}
              onChange={handleInputChange}
              autoFocus={isOpen}
              enterKeyHint="search"
            />

            {showPopular && (
              <SearchModalPopular
                labels={labels}
                items={popularItems}
                activeQuery={searchQuery}
                onSelect={setSearchQuery}
              />
            )}

            {showResultsBlock && (
              <SearchResultsPreview
                locale={locale}
                items={results}
                isLoading={isLoading}
                isError={isError}
                query={searchQuery}
                onClose={onClose}
              />
            )}
          </form>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default SearchModal;
