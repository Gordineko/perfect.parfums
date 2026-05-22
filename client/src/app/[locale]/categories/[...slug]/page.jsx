import {
  findCategoryByFullSlug,
  findCategoryById,
} from "@features/catalog-filter";
import { CatalogView } from "@pages/index";
import { createI18nServer, getLocalizedFooter, getMessages } from "@shared";
import {
  getAllFilters,
  getAllProducts,
  getAllProductsForSwiper,
  getCharacteristicsMeta,
} from "@shared";
import { getAllCategory, parseCategoryIdsFromResolvedSearch } from "@shared";
import { resolveCatalogPageBreadcrumbItems } from "@widgets/brad-crumps/server";
import Footer from "@widgets/Footer";
import RecommendedProducts from "@widgets/recommended-products";
import { notFound } from "next/navigation";

function pickLocalizedCategoryTitle(cat, locale) {
  if (!cat?.title || typeof cat.title !== "object") {
    return null;
  }
  const titles = cat.title;
  return (
    titles[locale] ??
    titles.ua ??
    titles.uk ??
    titles.en ??
    null
  );
}

export default async function CategoriesPage({
  params,
  searchParams,
}) {
  const { locale = "ua", slug: slugParam } = await params;
  const resolvedSearchParams = await searchParams;
  const segments = Array.isArray(slugParam)
    ? slugParam.map(String)
    : slugParam != null
      ? [String(slugParam)]
      : ["all"];
  const pathKey = segments.filter(Boolean).join("/") || "all";

  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);
  const categories = await getAllCategory();

  const parsedCategoryIds = parseCategoryIdsFromResolvedSearch(
    resolvedSearchParams,
  );

  const categoryFromSlug =
    pathKey === "all"
      ? null
      : findCategoryByFullSlug(categories.items, pathKey);

  if (
    pathKey !== "all" &&
    categoryFromSlug == null &&
    Array.isArray(categories.items) &&
    categories.items.length > 0
  ) {
    notFound();
  }

  let categoryId;
  if (categoryFromSlug) {
    categoryId = categoryFromSlug._id;
  } else if (
    pathKey === "all" &&
    parsedCategoryIds.length === 1
  ) {
    categoryId = parsedCategoryIds[0];
  }

  const breadcrumbItems =
    categoryId != null
      ? await resolveCatalogPageBreadcrumbItems({
          categoryId: String(categoryId),
          pathKey,
          treeRoots: categories.items,
          locale,
        })
      : null;

  let categoryTitle;
  if (pathKey !== "all") {
    const explicit = pickLocalizedCategoryTitle(
      categoryFromSlug,
      locale,
    );
    categoryTitle = explicit ?? pathKey;
  } else if (parsedCategoryIds.length === 1) {
    const filtered = findCategoryById(
      categories.items,
      parsedCategoryIds[0],
    );
    categoryTitle =
      pickLocalizedCategoryTitle(filtered, locale) ??
      t("catalog.catalogTitleAll");
  } else {
    categoryTitle = t("catalog.catalogTitleAll");
  }

  const apiSearchParams =
    resolvedSearchParams &&
    typeof resolvedSearchParams === "object"
      ? { ...resolvedSearchParams }
      : {};

  const products = await getAllProducts(
    apiSearchParams,
    categoryId,
    locale,
    { throwOnHttpError: true },
  );
  const filters = await getAllFilters(apiSearchParams, categoryId, locale);
  console.log(filters, "filters");
  const characteristicsMetaRaw = await getCharacteristicsMeta({
    status: "active",
  });
  const characteristicsMeta =
    characteristicsMetaRaw &&
    typeof characteristicsMetaRaw === "object"
      ? characteristicsMetaRaw
      : { items: [] };
  const actionsProducts = await getAllProductsForSwiper();

  return (
    <div className="category-page">
      <CatalogView
          slug={pathKey}
          categoryTitle={categoryTitle}
          breadcrumbItems={breadcrumbItems}
          categories={categories}
          locale={locale}
          filters={filters}
          characteristicsMeta={characteristicsMeta}
          products={products}
          labels={{
            breadcrumbHome: t("breadcrumbs.home"),
            breadcrumbPage: t("breadcrumbs.page"),
            allProducts: t("catalog.allProducts"),
            filters: t("catalog.filters"),
            sort: t("catalog.sort"),
            sortDefault: t("catalog.sortDefault"),
            sortPriceDesc: t("catalog.sortPriceDesc"),
            sortPriceAsc: t("catalog.sortPriceAsc"),
            sortTitleAsc: t("catalog.sortTitleAsc"),
            activeFiltersHeading: t(
              "catalog.activeFiltersHeading",
            ),
            clearActiveFilters: t(
              "catalog.clearActiveFilters",
            ),
            paginationPrev: t("catalog.paginationPrev"),
            paginationNext: t("catalog.paginationNext"),
          }}
          filterLabels={{
            modalTitle: t("filters.modalTitle"),
            closeModal: t("filters.closeModal"),
            selectedHeading: t("filters.selectedHeading"),
            clearFiltersModal: t("filters.clearFiltersModal"),
            showResultsModal: t("filters.showResultsModal"),
            clearActiveFilters: t("catalog.clearActiveFilters"),
            categories: t("filters.categories"),
            subcategories: t("filters.subcategories"),
            price: t("filters.price"),
            priceMinAria: t("filters.priceMinAria"),
            priceMaxAria: t("filters.priceMaxAria"),
            currency: t("filters.currency"),
            removeFilterAria: t("filters.removeFilterAria"),
          }}
      />

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <div className="container products-layout-wrapper__inner">
          <RecommendedProducts
            products={actionsProducts?.items ?? []}
            eyebrow={t("catalog.recommendedEyebrow")}
            title={t("catalog.recommendedTitle")}
          />
        </div>
        <Footer
          categories={categories}
          locale={locale}
          data={footerData}
        />
      </section>
    </div>
  );
}
