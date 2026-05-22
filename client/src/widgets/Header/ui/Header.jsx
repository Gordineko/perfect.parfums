import { getLocalizedNavigation } from "@shared/config/navItems";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import AuthModal from "@widgets/auth-modal/ui/AuthModal";
import Link from "next/link";

import HeaderActions from "./HeaderActions";
import HeaderBackLink from "./HeaderBackLink";
import HeaderDesktopNav from "./HeaderDesktopNav";
import HeaderSticky from "./HeaderSticky";
import styles from "./Header.module.scss";
import TemplateLogo from "./TemplateLogo";

export default async function Header({
  locale,
  categories,
}) {
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  const { footerNavItems, burgerNavItems } = getLocalizedNavigation(t, locale);

  const searchLabels = {
    placeholder: t("search.placeholder"),
    close: t("search.close"),
    popular: t("search.popular"),
    popularItems: [t("search.popularItem1"), t("search.popularItem2")],
  };

  return (
    <>
      <AuthModal />
      <HeaderSticky>
        <div className={`ds-container ${styles.inner}`}>
          <div className={styles.left}>
            <HeaderBackLink label={t("notFound.back")} />
            <HeaderDesktopNav
            categories={categories}
              locale={locale}
              labels={{
                new: t("navigation.header.new"),
                girls: t("navigation.header.girls"),
                boys: t("navigation.header.boys"),
                collections: t("navigation.header.collections"),
                megaCategories: t("navigation.header.megaCategories"),
                megaByAge: t("navigation.header.megaByAge"),
              }}
            />
            <div className={styles.mobileLeft}>
              <HeaderActions
                locale={locale}
                categories={categories}
                headerNavItems={footerNavItems}
                burgerNavItems={burgerNavItems}
                labels={{ basketCount: t("basket.basketCount") }}
                searchLabels={searchLabels}
                visibleActions={["search", "favorite"]}
              />
            </div>
          </div>

          <Link
            href={`/${locale}`}
            className={styles.logo}
            aria-label={t("aria.homeLogo")}
          >
            <TemplateLogo className={styles.logoSvg} />
          </Link>

          <div className={styles.right}>
            <div className={styles.actionsDesktop}>
              <HeaderActions
                locale={locale}
                categories={categories}
                headerNavItems={footerNavItems}
                burgerNavItems={burgerNavItems}
                labels={{ basketCount: t("basket.basketCount") }}
                searchLabels={searchLabels}
                visibleActions={["lang", "search", "favorite", "profile", "basket"]}
                renderOverlays
              />
            </div>

            <div className={styles.actionsMobile}>
              <HeaderActions
                locale={locale}
                categories={categories}
                headerNavItems={footerNavItems}
                burgerNavItems={burgerNavItems}
                labels={{ basketCount: t("basket.basketCount") }}
                searchLabels={searchLabels}
                visibleActions={["profile", "basket", "menu"]}
                renderOverlays
              />
            </div>
          </div>
        </div>
      </HeaderSticky>
    </>
  );
}
