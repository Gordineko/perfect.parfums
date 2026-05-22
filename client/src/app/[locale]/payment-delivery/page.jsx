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
      <PageHeader
        locale={locale}
        breadcrumbsLabels={{
          home: t("breadcrumbs.home"),
          page: t("breadcrumbs.page"),
        }}
        breadcrumbsItems={[{ label: pageTitle }]}
        title={pageTitle}
      />

      <div className="container">
        <section className={styles.shell}>
          <div className={styles.card}>
            <p className={styles.strong}>{t("paymentDelivery.lead")}</p>

            <div className={styles.content}>
              <p>{t("paymentDelivery.delivery")}</p>
              <p>{t("paymentDelivery.freeDelivery")}</p>
              <p>{t("paymentDelivery.minDelivery")}</p>
              <p>{t("paymentDelivery.payment")}</p>
              <p>{t("paymentDelivery.returns")}</p>
              <p className={styles.strong}>{t("paymentDelivery.defectContact")}</p>
              <p>
                <span className={styles.strong}>{t("paymentDelivery.phoneLabel")}</span>{" "}
                <a className={styles.link} href="tel:+380679670163">
                  {t("paymentDelivery.phone")}
                </a>
              </p>
              <p>
                <span className={styles.strong}>{t("paymentDelivery.emailLabel")}</span>{" "}
                <a className={styles.link} href={`mailto:${t("paymentDelivery.email")}`}>
                  {t("paymentDelivery.email")}
                </a>
              </p>
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
