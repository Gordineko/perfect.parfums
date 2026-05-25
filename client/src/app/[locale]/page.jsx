import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import Bestsellers from "@widgets/bestsellers";
import NewArrivals from "@widgets/new-arrivals";
import {
  getNewCatalogCards,
  getPopularCatalogCards,
} from "@shared/api/productsServices";
import AboutBrand from "@widgets/about-brand";
import HomeFaq from "@widgets/home-faq";
import InstagramFeed from "@widgets/instagram-feed";
import CustomerReviews from "@widgets/customer-reviews";
import Footer from "@widgets/Footer";
import { fetchMainReviews } from "@shared/api/reviewsServices";
import { HeroSkeleton } from "@widgets/hero";
import { Suspense } from "react";

import BrandsCarousel from "pages/Home/ui/BrandsCarousel";
import HeroServerBlock from "./HeroServerBlock";


export default async function HomePage({ params }) {
  const { locale = "ua" } = await params;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);

  const categories = await getAllCategory();
  const popularProducts = await getPopularCatalogCards();
  const newProducts = await getNewCatalogCards();
  let mainReviews = [];

  try {
    mainReviews = await fetchMainReviews({ limit: 6, revalidate: 120 });
  } catch {
    mainReviews = [];
  }

  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroServerBlock locale={locale} />
      </Suspense>

      <BrandsCarousel />

      <Bestsellers fetchState="success" products={popularProducts} />

      <NewArrivals fetchState="success" products={newProducts} />

      <CustomerReviews
        reviews={mainReviews}
        useMockReviews={mainReviews.length === 0}
      />

      <AboutBrand />

      <HomeFaq />

      <InstagramFeed />

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
