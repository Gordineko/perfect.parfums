import CooperationWhyUs from "@pages/cooperation-page/ui/CooperationWhyUs";
import TelegramCtaIcon from "@pages/cooperation-page/ui/TelegramCtaIcon";
import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import PageHeader from "@shared/ui/PageHeader";
import Footer from "@widgets/Footer";

function CooperationIconCheck({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 7.93333L5.33333 14L14 1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CooperationWholesaleBagDecor() {
  return (
    <div
      className="cooperation-cards__decor cooperation-cards__decor--bag"
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="183"
        height="203.003"
        viewBox="0 0 183 203.003"
        fill="none"
      >
        <path
          d="M141.222 0C144.62 0 147.972 0.791896 151.012 2.3125C153.861 3.73805 156.362 5.76767 158.344 8.25684L158.733 8.76074L178.622 35.2979C181.464 39.0887 183 43.6992 183 48.4375V181.103C183 186.91 180.694 192.481 176.589 196.588C172.484 200.695 166.917 203.003 161.111 203.003H21.8887C16.0831 203.003 10.5159 200.695 6.41113 196.588C2.3063 192.481 0 186.91 0 181.103V48.4375C0 46.0818 0.379408 43.7574 1.11035 41.5498C1.11276 41.5419 1.11566 41.5342 1.11816 41.5264C1.85729 39.3024 2.95331 37.1972 4.37695 35.2979L24.2666 8.76074L24.6553 8.25684C26.6368 5.76745 29.1387 3.73812 31.9883 2.3125C35.0276 0.791952 38.3791 5.80579e-05 41.7773 0H141.222ZM4.52441 44.1357C4.1783 45.5347 4 46.9787 4 48.4375V181.103C4 185.85 5.88529 190.404 9.24023 193.761C12.5951 197.117 17.1448 199.003 21.8887 199.003H161.111C165.855 199.003 170.405 197.117 173.76 193.761C177.115 190.404 179 185.85 179 181.103V48.4375C179 46.9787 178.822 45.5347 178.476 44.1357H4.52441ZM131.294 79.5928C132.398 79.5929 133.294 80.4883 133.294 81.5928C133.294 92.6785 128.892 103.31 121.058 111.149C113.223 118.989 102.596 123.394 91.5156 123.394C80.4352 123.393 69.8093 118.989 61.9746 111.149C54.1399 103.31 49.7383 92.6786 49.7383 81.5928C49.7383 80.4882 50.6337 79.5928 51.7383 79.5928C52.8428 79.5928 53.7383 80.4882 53.7383 81.5928C53.7383 91.6185 57.7189 101.233 64.8037 108.322C71.8884 115.411 81.4969 119.393 91.5156 119.394C101.535 119.394 111.144 115.411 118.229 108.322C125.313 101.233 129.294 91.6185 129.294 81.5928C129.294 80.4882 130.189 79.5928 131.294 79.5928ZM41.7773 4C39.0006 4.00006 36.262 4.64712 33.7783 5.88965C31.2944 7.13231 29.1332 8.93702 27.4668 11.1602L27.4658 11.1592L7.57812 37.6963C6.99781 38.4705 6.48419 39.2866 6.04004 40.1357H176.96C176.516 39.2866 176.002 38.4705 175.422 37.6963L155.532 11.1592V11.1582C153.866 8.93562 151.705 7.13209 149.222 5.88965C146.738 4.64699 143.999 4 141.222 4H41.7773Z"
        />
      </svg>
    </div>
  );
}

function CooperationInstructorsPersonDecor() {
  return (
    <div
      className="cooperation-cards__decor cooperation-cards__decor--instructor"
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="159"
        height="203"
        viewBox="0 0 159 203"
        fill="none"
      >
        <path
          d="M112.713 132.668C124.988 132.668 136.761 137.537 145.441 146.205C154.122 154.873 158.999 166.631 158.999 178.891V201.002C158.999 202.106 158.103 203.002 156.999 203.002C155.894 203.002 154.999 202.106 154.999 201.002V178.891C154.999 167.693 150.544 156.955 142.614 149.036C134.684 141.118 123.929 136.668 112.713 136.668H46.2852C35.0695 136.668 24.3136 141.118 16.3838 149.036C8.4543 156.955 4 167.694 4 178.891V201.002C3.99995 202.106 3.10454 203.002 2 203.002C0.895461 203.002 4.94772e-05 202.106 0 201.002V178.891C0 166.631 4.87712 154.873 13.5576 146.205C22.238 137.537 34.0105 132.668 46.2852 132.668H112.713ZM79.5 0C105.06 0 125.785 20.6919 125.785 46.2227C125.785 71.7533 105.06 92.4453 79.5 92.4453C53.9401 92.4452 33.2149 71.7533 33.2148 46.2227C33.2148 20.692 53.9401 8.85276e-05 79.5 0ZM79.5 4C56.1439 4.00009 37.2148 22.9065 37.2148 46.2227C37.2149 69.5388 56.1439 88.4452 79.5 88.4453C102.856 88.4453 121.785 69.5389 121.785 46.2227C121.785 22.9064 102.856 4 79.5 4Z"
        />
      </svg>
    </div>
  );
}

function CooperationIconBolt({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="13"
      viewBox="0 0 10 13"
      fill="none"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5319 1.30137L1.58543 5.85617H3.74213C4.17384 5.85617 4.47792 6.29538 4.34153 6.72158L3.30541 9.95354L7.87158 5.20548H6.26359C6.15587 5.20546 6.04994 5.1768 5.95586 5.12222C5.86179 5.06764 5.78269 4.98896 5.72608 4.89364C5.66948 4.79833 5.63724 4.68954 5.63243 4.57762C5.62762 4.46571 5.6504 4.35437 5.69861 4.25418L7.11826 1.30137H3.5319ZM2.5521 0.390411C2.65346 0.152911 2.87933 0 3.1296 0H8.12059C8.58985 0 8.8958 0.514041 8.68558 0.951302L7.26592 3.90411H9.36694C9.93004 3.90411 10.2116 4.61206 9.81367 5.02589L2.33499 12.8035C1.86323 13.2942 1.07739 12.7892 1.28886 12.1314L2.88308 7.15754H0.631906C0.526634 7.15754 0.42303 7.13018 0.330505 7.07796C0.237979 7.02574 0.159465 6.9503 0.102093 6.85851C0.0447202 6.76672 0.0103074 6.66147 0.00198023 6.55233C-0.00634695 6.44319 0.0116753 6.33362 0.0544098 6.23357L2.5521 0.390411Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default async function CooperationPage({ params }) {
  const { locale = "ua" } = await params;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  const categories = await getAllCategory();
  const footerData = getLocalizedFooter(t);

  const pageTitle = t("breadcrumbs.cooperation");
  const telegramCtaUrl =
    process.env.NEXT_PUBLIC_TELEGRAM_CTA_URL?.trim() || "#";

  return (
    <div className="cooperation-page-shell">
      <div className="cooperation-page">
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
          <div className="cooperation-page__content">
            <section
              className="cooperation-hero"
              aria-labelledby="cooperation-hero-title"
            >
              <div className="cooperation-hero__row">
                <div className="cooperation-hero__left">
                  <p className="cooperation-hero__eyebrow">
                    {t("cooperationPage.heroEyebrow")}
                  </p>
                  <h2
                    id="cooperation-hero-title"
                    className="cooperation-hero__title"
                  >
                    {t("cooperationPage.heroTitle")}
                  </h2>
                </div>
                <p className="cooperation-hero__lead">
                  {t("cooperationPage.heroLead")}
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="cooperation-cards-strip">
          <section
            className="cooperation-cards"
            aria-label={t("cooperationPage.cardsSectionLabel")}
          >
            <div className="container">
              <div className="cooperation-cards__grid">
                <article className="cooperation-cards__card cooperation-cards__card--light">
                  <div className="cooperation-cards__card-body">
                    <h3 className="cooperation-cards__title">
                      {t("cooperationPage.cardWholesaleTitle")}
                    </h3>
                    <p className="cooperation-cards__text">
                      {t("cooperationPage.cardWholesaleText")}
                    </p>
                    <ul className="cooperation-cards__list">
                      <li className="cooperation-cards__item">
                        <CooperationIconCheck className="cooperation-cards__icon" />
                        <span>
                          {t("cooperationPage.cardWholesaleItem1")}
                        </span>
                      </li>
                      <li className="cooperation-cards__item">
                        <CooperationIconCheck className="cooperation-cards__icon" />
                        <span>
                          {t("cooperationPage.cardWholesaleItem2")}
                        </span>
                      </li>
                      <li className="cooperation-cards__item">
                        <CooperationIconCheck className="cooperation-cards__icon" />
                        <span>
                          {t("cooperationPage.cardWholesaleItem3")}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <CooperationWholesaleBagDecor />
                </article>

                <article className="cooperation-cards__card cooperation-cards__card--dark">
                  <div className="cooperation-cards__card-body">
                    <h3 className="cooperation-cards__title">
                      {t("cooperationPage.cardInstructorsTitle")}
                    </h3>
                    <p className="cooperation-cards__text">
                      {t("cooperationPage.cardInstructorsText")}
                    </p>
                    <ul className="cooperation-cards__list">
                      <li className="cooperation-cards__item">
                        <CooperationIconBolt className="cooperation-cards__icon" />
                        <span>
                          {t("cooperationPage.cardInstructorsItem1")}
                        </span>
                      </li>
                      <li className="cooperation-cards__item">
                        <CooperationIconBolt className="cooperation-cards__icon" />
                        <span>
                          {t("cooperationPage.cardInstructorsItem2")}
                        </span>
                      </li>
                      <li className="cooperation-cards__item">
                        <CooperationIconBolt className="cooperation-cards__icon" />
                        <span>
                          {t("cooperationPage.cardInstructorsItem3")}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <CooperationInstructorsPersonDecor />
                </article>
              </div>
            </div>
          </section>
        </div>

        <CooperationWhyUs />

        <div className="cooperation-requirements-cta-wrap">
          <section
            className="cooperation-requirements"
            aria-labelledby="cooperation-requirements-heading"
          >
            <div className="cooperation-requirements__inner">
              <h2
                id="cooperation-requirements-heading"
                className="cooperation-requirements__heading"
              >
                {t("cooperationPage.requirementsTitle")}
              </h2>
              <ul className="cooperation-requirements__list">
                <li className="cooperation-requirements__item">
                  <span className="cooperation-requirements__index">
                    {t("cooperationPage.requirements1Index")}
                  </span>
                  <div className="cooperation-requirements__body">
                    <h3 className="cooperation-requirements__title">
                      {t("cooperationPage.requirements1Title")}
                    </h3>
                    <p className="cooperation-requirements__desc">
                      {t("cooperationPage.requirements1Desc")}
                    </p>
                  </div>
                </li>
                <li className="cooperation-requirements__item">
                  <span className="cooperation-requirements__index">
                    {t("cooperationPage.requirements2Index")}
                  </span>
                  <div className="cooperation-requirements__body">
                    <h3 className="cooperation-requirements__title">
                      {t("cooperationPage.requirements2Title")}
                    </h3>
                    <p className="cooperation-requirements__desc">
                      {t("cooperationPage.requirements2Desc")}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section
            className="cooperation-cta"
            aria-labelledby="cooperation-cta-heading"
          >
            <div className="container">
              <div className="cooperation-cta__inner">
                <h2
                  id="cooperation-cta-heading"
                  className="cooperation-cta__title"
                >
                  {t("cooperationPage.ctaTitle")}
                </h2>
                <p className="cooperation-cta__lead">
                  {t("cooperationPage.ctaLead")}
                </p>
                <a
                  className="cooperation-cta__btn"
                  href={telegramCtaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{t("cooperationPage.ctaButton")}</span>
                  <span
                    className="cooperation-cta__btn-icon"
                    aria-hidden
                  >
                    <TelegramCtaIcon />
                  </span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

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
