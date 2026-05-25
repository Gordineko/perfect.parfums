import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import ArchiveSelection from "@widgets/archive-selection";
import Bestsellers from "@widgets/bestsellers";
import { getPopularCatalogCards, getSaleCatalogCards } from "@shared/api/productsServices";
import BrandValues from "@widgets/brand-values";
import CategoryBanners from "@widgets/category-banners";
import Footer from "@widgets/Footer";
import { HeroSkeleton } from "@widgets/hero";
import { Suspense } from "react";

import BrandsCarousel from "pages/Home/ui/BrandsCarousel";
import ArchiveSelectionServerBlock from "./ArchiveSelectionServerBlock";
import HeroServerBlock from "./HeroServerBlock";


export default async function HomePage({ params }) {
  const { locale = "ua" } = await params;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);

  const archiveSection = {
    title: t("catalog.archiveSelectionTitle"),
    eyebrow: t("catalog.archiveSelectionEyebrow"),
    summary: t("catalog.archiveSelectionSummary"),
    ctaLabel: t("catalog.archiveSelectionCta"),
  };
  const categories = await getAllCategory();
  const popularProducts = await getPopularCatalogCards();
  const saleProducts = await getSaleCatalogCards();
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroServerBlock locale={locale} />
      </Suspense>

      <BrandsCarousel />

      <CategoryBanners locale={locale} />

      <Bestsellers fetchState="success" products={popularProducts}  />

      <Suspense
        fallback={
          <ArchiveSelection
            data={archiveSection}
            fetchState="loading"
            products={saleProducts}
          />
        }
      >
        <ArchiveSelectionServerBlock data={archiveSection} />
      </Suspense>

      <BrandValues />

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <Footer
          categories={categories}
          locale={locale}
          data={footerData}
        />
      </section>
    </>
  );
}
