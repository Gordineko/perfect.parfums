import { getLocalizedNavigation } from "@shared/config/navItems";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import AuthModal from "@widgets/auth-modal/ui/AuthModal";
import Link from "next/link";

import { HEADER_TOP_LINKS } from "../config/headerNavConfig";
import HeaderAccountButton from "./HeaderAccountButton";
import HeaderCartButton from "./HeaderCartButton";
import HeaderMobileToggle from "./HeaderMobileToggle";
import HeaderSearchBar from "./HeaderSearchBar";
import HeaderWishlistButton from "./HeaderWishlistButton";
import HeaderBackLink from "./HeaderBackLink";
import HeaderCategoryNav from "./HeaderCategoryNav";
import HeaderOverlays from "./HeaderOverlays";
import HeaderSticky from "./HeaderSticky";
import styles from "./Header.module.scss";
import TemplateLogo from "./TemplateLogo";

export default async function Header({ locale, categories }) {
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  const { footerNavItems, burgerNavItems } = getLocalizedNavigation(t, locale);

  const lightHeader = (
    <>
      <div className={styles.rowTop}>
        <div className="container">
          <div className={styles.topInner}>
            <HeaderBackLink label={t("notFound.back")} />
            <nav className={styles.topNav} aria-label={t("header.topNavAria")}>
              <ul className={styles.topList}>
                {HEADER_TOP_LINKS.map(({ id, path, labelKey }) => (
                  <li key={id}>
                    <Link href={`/${locale}/${path}`} className={styles.topLink}>
                      {t(labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <HeaderAccountButton locale={locale} labelKey="header.top.account" />
          </div>
        </div>
      </div>

      <div className={styles.rowMain}>
        <div className="container">
          <div className={styles.mainInner}>
            <div className={styles.mainRowTablet}>
              <HeaderMobileToggle labelKey="header.menu" variant="lines" />
              <Link
                href={`/${locale}`}
                className={styles.logoLink}
                aria-label={t("aria.homeLogo")}
              >
                <TemplateLogo tagline={t("header.tagline")} />
              </Link>
              <div className={styles.toolbarTabletRight}>
                <HeaderSearchBar locale={locale} mode="icon" />
                <HeaderCartButton />
              </div>
            </div>

            <div className={styles.mainRowMobile}>
              <HeaderMobileToggle labelKey="header.menu" variant="lines" />
              <Link
                href={`/${locale}`}
                className={styles.logoLink}
                aria-label={t("aria.homeLogo")}
              >
                <TemplateLogo />
              </Link>
              <div className={styles.toolbarMobileRight}>
                <HeaderSearchBar locale={locale} mode="icon" />
                <HeaderCartButton />
              </div>
            </div>

            <div className={styles.mainRowDesktop}>
              <Link
                href={`/${locale}`}
                className={styles.logoLink}
                aria-label={t("aria.homeLogo")}
              >
                <TemplateLogo tagline={t("header.tagline")} />
              </Link>
              <div className={styles.toolbarDesktop}>
                <HeaderSearchBar locale={locale} mode="bar" />
                <HeaderWishlistButton locale={locale} />
                <HeaderCartButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <AuthModal />
      <HeaderSticky
        lightHeader={lightHeader}
        navBar={<HeaderCategoryNav locale={locale} />}
      />
      <HeaderOverlays
        locale={locale}
        categories={categories}
        headerNavItems={footerNavItems}
        burgerNavItems={burgerNavItems}
      />
    </>
  );
}
