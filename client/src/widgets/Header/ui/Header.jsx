import { getLocalizedNavigation } from "@shared/config/navItems";
import { localePath } from "@shared/lib/localePath";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import AuthModal from "@widgets/auth-modal/ui/AuthModal";
import Link from "next/link";

import HeaderAccountButton from "./HeaderAccountButton";
import HeaderCartButton from "./HeaderCartButton";
import HeaderMobileToggle from "./HeaderMobileToggle";
import HeaderSearchBar from "./HeaderSearchBar";
import HeaderWishlistButton from "./HeaderWishlistButton";
import HeaderBackLink from "./HeaderBackLink";
import HeaderCategoryNav from "./HeaderCategoryNav";
import HeaderTopNav from "./HeaderTopNav";
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
            <HeaderTopNav locale={locale} />
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
                href={localePath(locale)}
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
                href={localePath(locale)}
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
                href={localePath(locale)}
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
