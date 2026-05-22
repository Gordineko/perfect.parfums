"use client";

import Filters from "@features/catalog-filter";
import { ActiveFilterTags } from "@features/catalog-filter";
import Pagination from "@features/catalog-pagination";
import Sort from "@features/Sort";
import {
  FilterIcon,
  MODALS,
  useI18n,
  useIsMobile,
  useModals,
  useOnClickOutside,
} from "@shared";
import Breadcrumbs from "@widgets/brad-crumps";
import ProductsGrid from "@widgets/products-grid";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef } from "react";

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
      isModalOpen === MODALS.SORT
        ? null
        : MODALS.SORT,
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

  const handleOpenFilters = () => {
    setIsModalOpen(
      isModalOpen === MODALS.FILTERS
        ? null
        : MODALS.FILTERS,
    );
  };

  const handleCloseFilters = () => {
    setIsModalOpen(null);
  };

  const totalCount = products?.meta?.total;

  const breadcrumbProps =
    Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0
      ? { items: breadcrumbItems }
      : slug === "all"
        ? { pageName: categoryTitle }
        : {
            categoryName: categoryTitle,
            categoryLink: slug,
          };

  return (
    <div className="catalog-page">
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

      <div className="container">
        <header className="catalog-page__header">
          <div className="catalog-page__heading">
            <h1 className="catalog-page__title t-page-title">
              {pageTitle}
            </h1>
          </div>

          <div className="catalog-page__toolbar">
            <button
              type="button"
              className="catalog-view__filters-btn"
              onClick={handleOpenFilters}
            >
              <FilterIcon />
              <p>{labels.filters}</p>
            </button>

            <div
              ref={sortToolbarRef}
              className="catalog-page__sort"
            >
              <button
                type="button"
                className="catalog-view__sort-button"
                onClick={handleOpenSort}
                aria-expanded={
                  isModalOpen === MODALS.SORT
                }
                aria-haspopup="listbox"
              >
                <p>
                  {labels.sort}: {getSortLabel()}
                </p>
              </button>

              {isModalOpen === MODALS.SORT && (
                <Sort
                  active={currentSort}
                  onClose={handleCloseSort}
                  labels={labels}
                />
              )}
            </div>
          </div>
        </header>

        {!isMobile && (
          <ActiveFilterTags
            filters={filters}
            characteristicsMeta={characteristicsMeta}
            locale={locale}
            priceLabel={filterLabels.price}
            panelLabel={labels.activeFiltersHeading}
            clearLabel={labels.clearActiveFilters}
            removeFilterAriaLabel={filterLabels.removeFilterAria}
          />
        )}

        <div className="catalog-layout">
          {!isMobile && (
            <aside className="catalog-layout__sidebar">
              <Filters
                locale={locale}
                categories={categories}
                filters={filters}
                characteristicsMeta={characteristicsMeta}
                totalCount={totalCount}
                labels={filterLabels}
              />
            </aside>
          )}

          <section className="catalog-layout__content">
            {isMobile && isModalOpen === MODALS.FILTERS && (
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

            <ProductsGrid products={products} />
            <Pagination
              data={products?.meta}
              labels={{
                prev: labels.paginationPrev,
                next: labels.paginationNext,
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default CatalogView;
