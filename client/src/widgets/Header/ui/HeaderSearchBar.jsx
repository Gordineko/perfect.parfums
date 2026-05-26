"use client";

import SearchDropdown from "@features/search-modal/ui/SearchDropdown";
import { buildCatalogSearchResultsHref, CloseX } from "@shared";
import { useI18n } from "@shared/i18n/use-i18n";
import Search from "@shared/ui/icons/Search";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import styles from "./Header.module.scss";

export default function HeaderSearchBar({ locale, mode = "bar" }) {
  const { t } = useI18n();
  const router = useRouter();
  const wrapRef = useRef(null);
  const inputId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const labels = {
    placeholder: t("header.searchPlaceholder"),
    loading: t("search.loading"),
    empty: t("search.empty"),
    error: t("search.error"),
    showAll: t("search.showAll"),
    clear: t("search.clear"),
  };

  const showDropdown = isOpen && searchQuery.trim().length > 0;

  const clearSearch = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleChange = (event) => {
    setSearchQuery(event.target.value);
    setIsOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const href = buildCatalogSearchResultsHref(locale, trimmed);
    if (!href) return;
    setIsOpen(false);
    router.push(href);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const searchInput = (
    <>
      <input
        id={inputId}
        type="text"
        className={styles.searchInput}
        placeholder={labels.placeholder}
        value={searchQuery}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        enterKeyHint="search"
        autoComplete="off"
      />
      {searchQuery ? (
        <button
          type="button"
          className={styles.searchClear}
          aria-label={labels.clear}
          onClick={clearSearch}
        >
          <CloseX />
        </button>
      ) : (
        <span className={styles.searchBarIcon} aria-hidden>
          <Search />
        </span>
      )}
    </>
  );

  if (mode === "icon") {
    return (
      <div ref={wrapRef} className={styles.searchMobileWrap}>
        <button
          type="button"
          className={styles.searchIconButton}
          aria-label={labels.placeholder}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Search />
        </button>
        {isOpen ? (
          <div className={styles.searchMobilePanel}>
            <form className={styles.searchWrap} onSubmit={handleSubmit}>
              {searchInput}
            </form>
            {showDropdown ? (
              <SearchDropdown
                locale={locale}
                labels={labels}
                query={searchQuery}
                onClose={() => setIsOpen(false)}
                staticPanel
              />
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={styles.searchField}>
      <form className={styles.searchWrap} onSubmit={handleSubmit}>
        {searchInput}
      </form>
      {showDropdown ? (
        <SearchDropdown
          locale={locale}
          labels={labels}
          query={searchQuery}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </div>
  );
}
