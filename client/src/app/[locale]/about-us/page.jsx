import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import PageHeader from "@shared/ui/PageHeader";
import Footer from "@widgets/Footer";

import styles from "./about-us.module.scss";

const OFFER_LIST_ITEMS = [
  { titleKey: "aboutPage.offerItem1Title", textKey: "aboutPage.offerItem1Text" },
  { titleKey: "aboutPage.offerItem2Title", textKey: "aboutPage.offerItem2Text" },
  { titleKey: "aboutPage.offerItem3Title", textKey: "aboutPage.offerItem3Text" },
  { titleKey: "aboutPage.offerItem4Title", textKey: "aboutPage.offerItem4Text" },
];

const WHY_LIST_ITEMS = [
  { titleKey: "aboutPage.whyItem1Title", textKey: "aboutPage.whyItem1Text" },
  { titleKey: "aboutPage.whyItem2Title", textKey: "aboutPage.whyItem2Text" },
  { titleKey: "aboutPage.whyItem3Title", textKey: "aboutPage.whyItem3Text" },
];

export default async function AboutUsPage({ params }) {
  const { locale = "ua" } = await params;
  const categories = await getAllCategory();
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);
  const pageTitle = t("navigation.footer.aboutUs");

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
          <div className={styles.content}>
            <p className={styles.leadHero}>{t("aboutPage.lead")}</p>
            <p className={styles.intro}>{t("aboutPage.intro")}</p>
            <p className={styles.lead}>{t("aboutPage.offerTitle")}</p>
            <p className={styles.intro}>{t("aboutPage.offerIntro")}</p>
            <ul className={styles.list}>
              {OFFER_LIST_ITEMS.map((item) => (
                <li key={item.titleKey}>
                  {t(item.titleKey)} — {t(item.textKey)}
                </li>
              ))}
            </ul>
            <p className={styles.lead}>{t("aboutPage.whyTitle")}</p>
            <ul className={styles.list}>
              {WHY_LIST_ITEMS.flatMap((item) => [
                <li key={item.titleKey}>{t(item.titleKey)}</li>,
                <li key={item.textKey}>{t(item.textKey)}</li>,
              ])}
            </ul>
            <p className={styles.lead}>{t("aboutPage.cultureTitle")}</p>
            <p className={styles.intro}>{t("aboutPage.cultureText")}</p>
            <p className={styles.lead}>{t("aboutPage.closingTitle")}</p>
            <p className={styles.intro}>{t("aboutPage.closingText")}</p>
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
