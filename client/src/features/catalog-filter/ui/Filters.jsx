"use client";

import PriceRange from "@features/priceRange";
import {
  QUERY_CATEGORY_IDS,
  QUERY_CHAR,
  QUERY_OFFER_CHAR,
  QUERY_ONLY_AVAILABLE,
  QUERY_OPT,
  QUERY_PAGE,
  QUERY_PRICE_MAX,
  QUERY_PRICE_MIN,
} from "@shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback as useReactCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  findCategoryByFullSlug,
  sortCategoriesBySort,
} from "../lib/categoryTreeFlatten";
import { pickLocalizedField, prepareFilterableMetaItems } from "../lib/characteristicsMetaHelpers";
import ActiveFilterTags from "./ActiveFilterTags";
import CategoryTree from "./CategoryTree";
import { FilterAccordionChevron } from "./FilterAccordionChevron";
import MetaFilterSections from "./MetaFilterSections";

function setJsonSearchParam(params, queryKey, obj) {
  if (!obj || typeof obj !== "object" || Object.keys(obj).length === 0) {
    params.delete(queryKey);
  } else {
    params.set(queryKey, JSON.stringify(obj));
  }
}

function parseCategoriesPathFromPathname(pathname, locale) {
  const prefix = `/${locale}/categories/`;
  if (!pathname.startsWith(prefix)) return "";
  const rest = pathname.slice(prefix.length).replace(/\/$/, "");
  return rest || "all";
}

export default function Filters({
  handleCloseFilters,
  locale,
  filters,
  categories,
  characteristicsMeta,
  totalCount,
  labels,
  showInlineActiveTags = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [accordionState, setAccordionState] = useState({});

  const routeCategoryPath = useMemo(
    () => parseCategoriesPathFromPathname(pathname, locale),
    [pathname, locale],
  );

  const categorySidebarRoots = useMemo(() => {
    const tree = categories?.items ?? [];
    if (!Array.isArray(tree) || tree.length === 0) {
      return [];
    }
    if (!routeCategoryPath || routeCategoryPath === "all") {
      return sortCategoriesBySort(tree);
    }
    const current = findCategoryByFullSlug(tree, routeCategoryPath);
    if (!current) {
      return [];
    }
    const next = current.children;
    return sortCategoriesBySort(Array.isArray(next) ? next : []);
  }, [categories?.items, routeCategoryPath]);

  const categoriesSectionTitle = useMemo(() => {
    const onCatalogAll =
      !routeCategoryPath || routeCategoryPath === "all";

    if (!onCatalogAll) {
      return (
        labels.subcategories ??
        labels.categories ??
        ""
      );
    }

    const fromFacets =
      filters?.facets?.categories?.meta?.title ??
      filters?.categories?.meta?.title;
    const localized = pickLocalizedField(fromFacets, locale);
    if (localized && String(localized).trim()) {
      return localized;
    }
    return labels.categories ?? "";
  }, [
    filters?.facets?.categories?.meta?.title,
    filters?.categories?.meta?.title,
    locale,
    labels.categories,
    labels.subcategories,
    routeCategoryPath,
  ]);

  useEffect(() => {
    if (routeCategoryPath && routeCategoryPath !== "all") {
      setAccordionState((prev) => ({
        ...prev,
        categories: true,
      }));
    }
  }, [routeCategoryPath]);

  const isSectionOpen = useReactCallback(
    (id) => accordionState[id] ?? true,
    [accordionState],
  );

  const toggleSection = useReactCallback((id) => {
    setAccordionState((prev) => ({
      ...prev,
      [id]: !(prev?.[id] ?? true),
    }));
  }, []);

  const getCharObject = () => {
    try {
      const charParam = searchParams.get(QUERY_CHAR);
      return charParam ? JSON.parse(charParam) : {};
    } catch {
      return {};
    }
  };

  const getOfferCharObject = () => {
    try {
      const offerCharParam = searchParams.get(QUERY_OFFER_CHAR);
      return offerCharParam ? JSON.parse(offerCharParam) : {};
    } catch {
      return {};
    }
  };

  const getOptObject = () => {
    try {
      const raw = searchParams.get(QUERY_OPT);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const commitFilterUrl = (nextChar, nextOfferChar, nextOpt) => {
    const params = new URLSearchParams(searchParams.toString());
    setJsonSearchParam(params, QUERY_CHAR, nextChar);
    setJsonSearchParam(params, QUERY_OFFER_CHAR, nextOfferChar);
    setJsonSearchParam(params, QUERY_OPT, nextOpt);
    params.delete(QUERY_PAGE);
    router.push(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const metaItemsPrepared = useMemo(
    () => prepareFilterableMetaItems(characteristicsMeta),
    [characteristicsMeta],
  );

  const charSnapshot = getCharObject();
  const offerSnapshot = getOfferCharObject();

  const handleClearAllFilters = useReactCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(QUERY_CHAR);
    params.delete(QUERY_OFFER_CHAR);
    params.delete(QUERY_OPT);
    params.delete(QUERY_PRICE_MIN);
    params.delete(QUERY_PRICE_MAX);
    params.delete(QUERY_CATEGORY_IDS);
    params.delete(QUERY_ONLY_AVAILABLE);
    params.delete(QUERY_PAGE);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const showResultsCount = Number(totalCount);
  const showResultsCountLabel = Number.isFinite(showResultsCount)
    ? showResultsCount
    : 0;

  return (
    <div className="filters" onClick={handleCloseFilters}>
      <div
        className="filters__card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filters__modal-header">
          <p className="filters__modal-title">
            {labels.modalTitle}
          </p>
          <button
            type="button"
            className="filters__button-close"
            onClick={handleCloseFilters}
            aria-label={labels.closeModal}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 1L12 12M12 1L1 12"
                stroke="#0D0D0D"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {showInlineActiveTags ? (
          <div className="filters__active-tags">
            <ActiveFilterTags
              variant="modal"
              filters={filters}
              characteristicsMeta={characteristicsMeta}
              locale={locale}
              priceLabel={labels.price}
              panelLabel={labels.selectedHeading}
              clearLabel={labels.clearActiveFilters}
              removeFilterAriaLabel={labels.removeFilterAria}
            />
          </div>
        ) : null}

        <div className="filters__groups">
        {categorySidebarRoots.length > 0 && (
          <div
            className={`filters__accordion ${
              isSectionOpen("categories")
                ? "filters__accordion--open"
                : "filters__accordion--closed"
            }`}
          >
            <button
              type="button"
              className="filters__accordion-header"
              onClick={() => toggleSection("categories")}
              aria-expanded={isSectionOpen("categories")}
            >
              <span className="filters__title">
                {categoriesSectionTitle}
              </span>
              <FilterAccordionChevron className="filters__accordion-chevron" />
            </button>

            <div className="filters__accordion-panel">
              <div className="filters__accordion-panel-inner filters__accordion-panel-inner--category-tree">
                <CategoryTree
                  locale={locale}
                  roots={categorySidebarRoots}
                  filters={filters}
                  routeCategoryPath={routeCategoryPath}
                  sectionTitle={categoriesSectionTitle}
                  onNavigate={handleCloseFilters}
                />
              </div>
            </div>
          </div>
        )}

        <MetaFilterSections
          items={metaItemsPrepared}
          locale={locale}
          filters={filters}
          charObj={charSnapshot}
          offerObj={offerSnapshot}
          isSectionOpen={isSectionOpen}
          toggleSection={toggleSection}
          onCommitCharOffer={(nextChar, nextOffer) =>
            commitFilterUrl(
              nextChar,
              nextOffer,
              getOptObject(),
            )
          }
        />

        </div>

        {filters?.facets?.pricing && (
          <div className="filters__price">
            <div
              className={`filters__accordion ${
                isSectionOpen("price")
                  ? "filters__accordion--open"
                  : "filters__accordion--closed"
              }`}
            >
              <button
                type="button"
                className="filters__accordion-header"
                onClick={() => toggleSection("price")}
                aria-expanded={isSectionOpen("price")}
              >
                <span className="filters__title">{labels.price}</span>
                <FilterAccordionChevron className="filters__accordion-chevron" />
              </button>

              <div className="filters__accordion-panel">
                <div className="filters__accordion-panel-inner">
                  <PriceRange
                    price={filters.facets.pricing}
                    currency={labels.currency}
                    priceMinAria={labels.priceMinAria}
                    priceMaxAria={labels.priceMaxAria}
                    onApply={handleCloseFilters}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {handleCloseFilters && (
          <div className="filters__footer">
            <button
              type="button"
              className="filters__footer-btn filters__footer-btn--secondary"
              onClick={handleClearAllFilters}
            >
              {labels.clearFiltersModal}
            </button>
            <button
              type="button"
              className="filters__footer-btn filters__footer-btn--primary"
              onClick={handleCloseFilters}
            >
              {labels.showResultsModal} ({showResultsCountLabel})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
