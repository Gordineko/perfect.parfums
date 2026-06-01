import WriteReviewModal from "@features/review";
import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
  getProductBySlug,
  resolveCatalogGroupSlugParam,
} from "@shared";
import Breadcrumbs from "@widgets/brad-crumps";
import { resolvePdpBreadcrumbItems } from "@widgets/brad-crumps/server";
import Footer from "@widgets/Footer";
import InstagramFeed from "@widgets/instagram-feed";
import { ProductPdpBlock } from "@widgets/product-pdp";
import PdpReviewsList from "@widgets/pdp-reviews-list";
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
          <ProductPdpBlock
            product={product}
            locale={locale}
            productTitle={productTitle}
            categoryLabel={categoryLabel}
            galleryAriaLabel={t("pdp.block.galleryAria")}
            infoAriaLabel={t("pdp.block.infoAria")}
          />
        </section>

        <TrackViewedProduct product={product} />

        <PdpReviewsList />
        <WriteReviewModal locale={locale} product={product} />

        <ViewedProducts />
      </div>

      <InstagramFeed variant="afterCatalog" />

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <Footer categories={categories} locale={locale} data={footerData} />
      </section>
    </div>
  );
}
