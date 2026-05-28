import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import PageHeader from "@shared/ui/PageHeader";
import Footer from "@widgets/Footer";

import styles from "./warranty-returns.module.scss";

export default async function WarrantyReturnsPage({ params }) {
  const { locale = "ua" } = await params;
  const categories = await getAllCategory();
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);
  const pageTitle = t("navigation.footer.warrantyReturns");

  return (
    <div className={styles.pageShell}>
      <PageHeader
        locale={locale}
        breadcrumbsLabels={{
          home: t("breadcrumbs.home"),
          page: t("breadcrumbs.page"),
        }}
        breadcrumbsItems={[{ label: pageTitle }]}
        showTitle={false}
        plainBreadcrumbs
      />

      <div className="container">
        <section className={styles.shell}>
          <div className={styles.card}>
            <p className={styles.strong}>{t("warrantyReturnsPage.lead")}</p>

            <div className={styles.content}>
              <p>{t("warrantyReturnsPage.intro")}</p>
              <p>{t("warrantyReturnsPage.originality")}</p>
              <p>{t("warrantyReturnsPage.warranty")}</p>
              <p>{t("warrantyReturnsPage.term")}</p>
              <p className={styles.emphasis}>{t("warrantyReturnsPage.returns")}</p>
              <p className={styles.emphasis}>{t("warrantyReturnsPage.quality")}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <div className="container products-layout-wrapper__inner" />
        <Footer categories={categories} locale={locale} data={footerData} />
      </section>
    </div>
  );
}
