import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import PageHeader from "@shared/ui/PageHeader";
import Footer from "@widgets/Footer";
import Image from "next/image";
import Link from "next/link";

import styles from "./about-us.module.scss";

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
        title={pageTitle}
      />

      <div className="container">
        <section className={styles.shell}>
          <div className={styles.banner}>
            <div className={styles.bannerInner}>
              <p className={styles.bannerEyebrow}>{t("aboutPage.bannerEyebrow")}</p>
              <h2 className={styles.bannerTitle}>{t("aboutPage.bannerTitle")}</h2>
              <p className={styles.bannerSubtitle}>{t("aboutPage.bannerSubtitle")}</p>
            </div>
          </div>

          <section className={styles.story}>
            <div className={styles.storyContent}>
              <p className={styles.storyEyebrow}>{t("aboutPage.storyEyebrow")}</p>
              <h2 className={styles.storyTitle}>{t("aboutPage.storyTitle")}</h2>
              <p className={styles.storyText}>{t("aboutPage.storyText")}</p>
            </div>
            <div className={styles.storyMedia}>
              <div className={styles.storyImageWrapDesktop}>
                <Image
                  className={styles.storyImage}
                  src="/img/about-story.png"
                  alt={t("aboutPage.storyImageAlt")}
                  width={1365}
                  height={1820}
                  sizes="(max-width: 767.98px) 100%, (max-width: 1249.98px) 0px, 50vw"
                />
              </div>
              <div className={styles.storyImageWrapTablet}>
                <Image
                  className={styles.storyImage}
                  src="/img/about-story-tab.png"
                  alt={t("aboutPage.storyImageAlt")}
                  width={1365}
                  height={1820}
                  sizes="(min-width: 768px) and (max-width: 1249.98px) 100vw, 0px"
                />
              </div>
            </div>
          </section>

          <section className={styles.manifesto}>
            <blockquote className={styles.manifestoQuote}>
              {t("aboutPage.manifestoQuote")}
            </blockquote>
          </section>

          <section className={styles.values}>
            <div className={styles.valuesGrid}>
              <article className={styles.valuesCard}>
                <h3 className={styles.valuesCardTitle}>
                  {t("aboutPage.valuesNaturalnessTitle")}
                </h3>
                <p className={styles.valuesCardText}>
                  {t("aboutPage.valuesNaturalnessText")}
                </p>
              </article>
              <article className={styles.valuesCard}>
                <h3 className={styles.valuesCardTitle}>
                  {t("aboutPage.valuesCraftTitle")}
                </h3>
                <p className={styles.valuesCardText}>{t("aboutPage.valuesCraftText")}</p>
              </article>
              <article className={styles.valuesCard}>
                <h3 className={styles.valuesCardTitle}>
                  {t("aboutPage.valuesAestheticTitle")}
                </h3>
                <p className={styles.valuesCardText}>
                  {t("aboutPage.valuesAestheticText")}
                </p>
              </article>
            </div>
          </section>

          <section className={styles.cta}>
            <h2 className={styles.ctaTitle}>{t("aboutPage.ctaTitle")}</h2>
            <Link href={`/${locale}/categories/all`} className={styles.ctaButton}>
              {t("aboutPage.ctaButton")}
            </Link>
          </section>
        </section>
      </div>

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <div className="container products-layout-wrapper__inner" />
        <Footer categories={categories} locale={locale} data={footerData} />
      </section>
    </div>
  );
}
