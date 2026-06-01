import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import PageHeader from "@shared/ui/PageHeader";
import Footer from "@widgets/Footer";

import styles from "./payment-delivery.module.scss";

export default async function PaymentDeliveryPage({ params }) {
  const { locale = "ua" } = await params;
  const categories = await getAllCategory();
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);
  const pageTitle = t("navigation.footer.paymentDelivery");

  return (
    <div className={styles.pageShell}>
      <div className={styles.page}>
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
            <div className={styles.content}>
              <p className={styles.lead}>{t("paymentDelivery.lead")}</p>
              <p>{t("paymentDelivery.delivery")}</p>
              <p>{t("paymentDelivery.freeDelivery")}</p>
              <p>{t("paymentDelivery.minDelivery")}</p>
              <p>{t("paymentDelivery.payment")}</p>
              <p>{t("paymentDelivery.returns")}</p>
              <p>{t("paymentDelivery.defectContact")}</p>
              <p>
                {t("paymentDelivery.phoneLabel")}{" "}
                <a className={styles.link} href="tel:+380679670163">
                  {t("paymentDelivery.phone")}
                </a>
              </p>
              <p>
                {t("paymentDelivery.emailLabel")}{" "}
                <a className={styles.link} href={`mailto:${t("paymentDelivery.email")}`}>
                  {t("paymentDelivery.email")}
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <div className="container products-layout-wrapper__inner" />
        <Footer categories={categories} locale={locale} data={footerData} />
      </section>
    </div>
  );
}
