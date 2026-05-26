import WriteReviewModal from "@features/review";
import {
  createI18nServer,
  getAllCategory,
  getAllProductsForSwiper,
  getLocalizedFooter,
  getMessages,
  getProductBySlug,
  resolveCatalogGroupSlugParam,
} from "@shared";
import Breadcrumbs from "@widgets/brad-crumps";
import { resolvePdpBreadcrumbItems } from "@widgets/brad-crumps/server";
import Footer from "@widgets/Footer";
import { ProductPdpBlock } from "@widgets/product-pdp";
import RecommendedProducts from "@widgets/recommended-products";
import ReviewSwiper from "@widgets/review-swiper";
import ViewedProducts, { TrackViewedProduct } from "@widgets/viewed-products";
import { notFound } from "next/navigation";

function getLocalizedProductTitle(product, locale) {
  return (
    product?.title?.[locale] ??
    product?.title?.ua ??
    product?.title?.uk ??
    product?.title?.en ??
    product?.title ??
    ""
  );
}

function getCategoryLabel(product, locale) {
  const category =
    product?.category?.title?.[locale] ??
    product?.category?.[locale] ??
    product?.categoryTitle?.[locale] ??
    product?.categoryTitle ??
    product?.category?.title ??
    product?.category;

  const subcategory =
    product?.subcategory?.title?.[locale] ??
    product?.subcategory?.[locale] ??
    product?.subCategory?.title?.[locale] ??
    product?.subCategory?.[locale] ??
    product?.subCategoryTitle?.[locale] ??
    product?.subCategoryTitle ??
    product?.subcategory?.title ??
    product?.subcategory ??
    product?.subCategory?.title ??
    product?.subCategory;

  const parts = [category, subcategory]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  return parts.length ? parts.join(" / ") : "HIGH HEELS";
}

export default async function ProductPdpPageContent({ params }) {
  const resolvedParams = await params;
  const { slug, locale } = resolvedParams;

  const groupSlug = resolveCatalogGroupSlugParam(slug);
  const data = await getProductBySlug(groupSlug);
  const actionsProducts = await getAllProductsForSwiper();
  const categories = await getAllCategory();

  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);

  if (!data || !data.item) {
    notFound();
  }

  const product = data.item;
  const productTitle = getLocalizedProductTitle(product, locale);
  const categoryLabel = getCategoryLabel(product, locale).toUpperCase();
  const productBreadcrumbLabel =
    typeof productTitle === "string" && productTitle.trim().length
      ? productTitle
      : t("breadcrumbs.product");
  const catalogBreadcrumbLabel = t("breadcrumbs.catalog");

  const breadcrumbItems = await resolvePdpBreadcrumbItems({
    product,
    locale,
    treeRoots: categories,
    productLabel: productBreadcrumbLabel,
    catalogFallbackLabel: catalogBreadcrumbLabel,
  });

  return (
    <div className="pdp-page">
      <div className="pdp-page__breadcrumbs">
        <Breadcrumbs
          embedInPage
          locale={locale}
          labels={{
            home: t("breadcrumbs.home"),
            page: t("breadcrumbs.page"),
          }}
          items={breadcrumbItems}
        />
      </div>

      <div className="container">
        <section className="pdp section-margin">
          <header className="pdp__header">
            <h1 className="pdp__title t-h1">
              {productTitle}
            </h1>
          </header>

          <div
            className="pdp__mobile-meta"
            aria-label="Collection and gender"
          >
            <p className="pdp-info__meta-row">
              <span className="pdp-info__meta-label">Collection:</span>{" "}
              <span className="pdp-info__meta-value pdp-info__meta-value--series">
                SHOES
              </span>
              <span className="pdp-info__meta-sep" aria-hidden="true" />
              <span className="pdp-info__meta-label pdp-info__meta-label--category">
                Gender:
              </span>{" "}
              <span className="pdp-info__meta-value pdp-info__meta-value--category">
                {categoryLabel}
              </span>
            </p>
          </div>

          <div className="pdp__grid">
            <ProductPdpBlock
              product={product}
              locale={locale}
              categoryLabel={categoryLabel}
              galleryAriaLabel={t("pdp.block.galleryAria")}
              infoAriaLabel={t("pdp.block.infoAria")}
            />
          </div>
        </section>

        <TrackViewedProduct product={product} />

        <ReviewSwiper product={product} />
        <WriteReviewModal locale={locale} product={product} />

        <ViewedProducts />
      </div>

      <section className="products-layout-wrapper products-layout-wrapper--pdp">
        <div className="container products-layout-wrapper__inner">
          <RecommendedProducts
            products={actionsProducts?.items ?? []}
            eyebrow={t("catalog.recommendedEyebrow")}
            title={t("pdp.recommendedStripTitle")}
            variant="pdp"
          />
        </div>

        <Footer categories={categories} locale={locale} data={footerData} />
      </section>
    </div>
  );
}
