"use client";

import Filters from "@features/catalog-filter";
import { ActiveFilterTags } from "@features/catalog-filter";
import Pagination from "@features/catalog-pagination";
import Sort from "@features/Sort";
import {
  FilterIcon,
  MODALS,
  QUERY_CATEGORY_IDS,
  QUERY_CHAR,
  QUERY_OFFER_CHAR,
  QUERY_ONLY_AVAILABLE,
  QUERY_OPT,
  QUERY_PRICE_MAX,
  QUERY_PRICE_MIN,
  QUERY_VALUE,
  useI18n,
  useIsMobile,
  useModals,
  useOnClickOutside,
} from "@shared";
import Breadcrumbs from "@widgets/brad-crumps";
import ProductsGrid from "@widgets/products-grid";
import { localePath } from "@shared/lib/localePath";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

function SortChevron({ open }) {
  return (
    <span
      className={`catalog-page__sort-chevron${
        open ? " catalog-page__sort-chevron--open" : ""
      }`}
      aria-hidden
    >
      <svg
        width="16"
        height="8"
        viewBox="0 0 16 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15.7403 0.253838C16.0866 0.592376 16.0866 1.14109 15.7403 1.47963L9.84968 7.23843C8.81129 8.25358 7.12791 8.25389 6.08914 7.23915L0.259716 1.54455C-0.0865707 1.2061 -0.0865707 0.657293 0.259716 0.318842C0.605914 -0.0196095 1.16728 -0.0196095 1.51347 0.318842L7.33988 6.01491C7.68617 6.35338 8.24744 6.35338 8.59364 6.01491L14.4866 0.253838C14.8328 -0.0846138 15.3941 -0.0846138 15.7403 0.253838Z"
          fill="#BDB8AE"
        />
      </svg>
    </span>
  );
}

const CatalogView = ({
  locale,
  products,
  filters,
  characteristicsMeta = { items: [] },
  categories,
  labels,
  filterLabels,
  slug,
  categoryTitle,
  breadcrumbItems = null,
}) => {
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const { isModalOpen, setIsModalOpen } = useModals();
  const sortToolbarRef = useRef(null);
  const searchParams = useSearchParams();

  const searchValueRaw = searchParams.get("value");
  const pageTitle = useMemo(() => {
    const v =
      typeof searchValueRaw === "string"
        ? searchValueRaw.trim()
        : "";
    if (v) {
      return t("catalog.searchResults", { query: v });
    }
    return categoryTitle;
  }, [searchValueRaw, categoryTitle, t]);

  const currentSort =
    searchParams.get("sort") || "updated_desc";

  const getSortLabel = () => {
    switch (currentSort) {
      case "price_desc":
        return labels.sortPriceDesc ?? "";
      case "popularity":
        return labels.sortPopular ?? "";
      case "price_asc":
        return labels.sortPriceAsc ?? "";
      case "title_asc":
        return labels.sortTitleAsc ?? "";
      default:
        return labels.sortDefault ?? "";
    }
  };

  const handleOpenSort = () => {
    setIsModalOpen(
      isModalOpen === MODALS.SORT ? null : MODALS.SORT,
    );
  };

  const handleCloseSort = () => {
    setIsModalOpen(null);
  };

  useOnClickOutside(
    sortToolbarRef,
    handleCloseSort,
    isModalOpen === MODALS.SORT,
  );

  const [isDesktopFiltersOpen, setIsDesktopFiltersOpen] = useState(false);

  const handleToggleFilters = () => {
    if (isMobile) {
      setIsModalOpen(
        isModalOpen === MODALS.FILTERS ? null : MODALS.FILTERS,
      );
      return;
    }
    setIsDesktopFiltersOpen((open) => !open);
  };

  const handleCloseFilters = () => {
    setIsModalOpen(null);
    setIsDesktopFiltersOpen(false);
  };

  const totalCount = products?.meta?.total;
  const isSortOpen = isModalOpen === MODALS.SORT;
  const isFiltersOpen = isMobile
    ? isModalOpen === MODALS.FILTERS
    : isDesktopFiltersOpen;

  const catalogBreadcrumbItem = useMemo(
    () => ({
      label: labels.breadcrumbCatalog ?? t("breadcrumbs.catalog"),
      path: localePath(locale, "/categories/all"),
    }),
    [labels.breadcrumbCatalog, locale, t],
  );

  const breadcrumbItemsWithCatalog = useMemo(() => {
    if (
      !Array.isArray(breadcrumbItems) ||
      breadcrumbItems.length === 0
    ) {
      return null;
    }
    return [catalogBreadcrumbItem, ...breadcrumbItems];
  }, [breadcrumbItems, catalogBreadcrumbItem]);

  const breadcrumbProps =
    breadcrumbItemsWithCatalog
      ? { items: breadcrumbItemsWithCatalog }
      : slug === "all"
        ? {
            items: [
              catalogBreadcrumbItem,
              { label: categoryTitle },
            ],
          }
        : {
            items: [
              catalogBreadcrumbItem,
              { label: categoryTitle },
            ],
          };

  const sortButtonLabel =
    labels.sortBy ?? labels.sort ?? "";

  const hasActiveCatalogFilters = useMemo(() => {
    if (slug && slug !== "all") {
      return true;
    }
    const filterKeys = [
      QUERY_CHAR,
      QUERY_OFFER_CHAR,
      QUERY_OPT,
      QUERY_PRICE_MIN,
      QUERY_PRICE_MAX,
      QUERY_CATEGORY_IDS,
      QUERY_ONLY_AVAILABLE,
      QUERY_VALUE,
    ];
    return filterKeys.some((key) => {
      const value = searchParams.get(key);
      return value != null && String(value).trim() !== "";
    });
  }, [searchParams, slug]);

  const productsEmptyMessage = hasActiveCatalogFilters
    ? labels.noProductsForFilters
    : labels.noProductsEmpty;

  return (
    <div
      className={`catalog-page${
        isSortOpen ? " catalog-page--sort-open" : ""
      }${isFiltersOpen ? " catalog-page--filters-open" : ""}`}
    >
      <Breadcrumbs
        embedInPage
        className="catalog-page__breadcrumbs-root"
        locale={locale}
        labels={{
          home: labels.breadcrumbHome,
          page: labels.breadcrumbPage,
        }}
        {...breadcrumbProps}
      />

      {isMobile && (
        <div className="container">
          <header className="catalog-page__header">
            <h1 className="catalog-page__title t-h1">{pageTitle}</h1>
          </header>
        </div>
      )}

      <div
        className={`catalog-page__filters-zone${
          !isMobile && isFiltersOpen
            ? " catalog-page__filters-zone--expanded"
            : ""
        }`}
      >
        <div className="catalog-page__filters-toolbar">
          <div className="container">
            <div className="catalog-page__control-bar">
          <div
            ref={sortToolbarRef}
            className={`catalog-page__sort${
              isSortOpen ? " catalog-page__sort--open" : ""
            }`}
          >
            <button
              type="button"
              className="catalog-view__sort-button"
              onClick={handleOpenSort}
              aria-expanded={isSortOpen}
              aria-haspopup="listbox"
            >
              <span className="catalog-view__sort-button-label">
                {sortButtonLabel}
              </span>
              {isMobile && (
                <span className="catalog-view__sort-button-value">
                  {getSortLabel()}
                </span>
              )}
              <SortChevron open={isSortOpen} />
            </button>

            {isSortOpen && (
              <Sort
                active={currentSort}
                onClose={handleCloseSort}
                labels={labels}
              />
            )}
          </div>

          {!isMobile && (
            <h1 className="catalog-page__title catalog-page__title--bar">
              {pageTitle}
            </h1>
          )}

          <button
            type="button"
            className={`catalog-page__filters-toggle${
              isFiltersOpen ? " catalog-page__filters-toggle--active" : ""
            }`}
            onClick={handleToggleFilters}
            aria-expanded={isFiltersOpen}
          >
            {isMobile ? (
              <>
                <FilterIcon />
                <span>{labels.filters}</span>
              </>
            ) : (
              <span>{labels.filters}</span>
            )}
          </button>
            </div>
          </div>
        </div>

        {!isMobile && (
          <div
            className={`catalog-page__filters-panel${
              isFiltersOpen ? " catalog-page__filters-panel--open" : ""
            }`}
            aria-hidden={!isFiltersOpen}
          >
            <div className="catalog-page__filters-panel-inner">
              <div className="container">
                <Filters
                  variant="panel"
                  locale={locale}
                  categories={categories}
                  filters={filters}
                  characteristicsMeta={characteristicsMeta}
                  totalCount={totalCount}
                  labels={filterLabels}
                />
              </div>
            </div>
          </div>
        )}

        {!isMobile && !isFiltersOpen && (
          <div className="catalog-page__filters-tags">
            <div className="container">
              <ActiveFilterTags
                filters={filters}
                characteristicsMeta={characteristicsMeta}
                locale={locale}
                priceLabel={filterLabels.price}
                panelLabel={filterLabels.selectedHeading}
                clearLabel={labels.clearActiveFilters}
                removeFilterAriaLabel={filterLabels.removeFilterAria}
              />
            </div>
          </div>
        )}
      </div>

      <div className="container">
        <div
          className={`catalog-layout${
            isFiltersOpen ? " catalog-layout--filters-expanded" : ""
          }`}
        >
          <section className="catalog-layout__content">
            {isMobile && isFiltersOpen && (
              <div
                className="catalog-filters-modal"
                onClick={handleCloseFilters}
              >
                <div
                  className="catalog-filters-modal__content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Filters
                    locale={locale}
                    categories={categories}
                    filters={filters}
                    characteristicsMeta={characteristicsMeta}
                    totalCount={totalCount}
                    handleCloseFilters={handleCloseFilters}
                    labels={filterLabels}
                    showInlineActiveTags
                  />
                </div>
              </div>
            )}

            <ProductsGrid
              products={products}
              emptyMessage={productsEmptyMessage}
            />

            <div className="catalog-page__pagination-wrap">
              <Pagination
                data={products?.meta}
                variant="compact"
                showLoadMore={false}
                labels={{
                  prev: labels.paginationPrev,
                  next: labels.paginationNext,
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CatalogView;
