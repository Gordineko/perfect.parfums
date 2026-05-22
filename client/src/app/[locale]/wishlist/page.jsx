
import WishlistPage from "@pages/wishlist-page";
import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import Footer from "@widgets/Footer";

export default async function WishlistRoutePage({
  params,
}) {
  const resolvedParams = await params;
  const { locale = "ua" } = resolvedParams;

  const categories = await getAllCategory();
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);

  return (
    <div className="wishlist-page-shell">
      <WishlistPage />
      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <div className="container products-layout-wrapper__inner" />
        <Footer
          categories={categories}
          locale={locale}
          data={footerData}
        />
      </section>
    </div>
  );
}

