"use client";

import { useLanguageSwitcher } from "@features/language-switcher/model/useLanguageSwitcher";
import MainNav, {
  AccountIcon,
  ArrowMoreIcon,
  BurgerMenuCatalog,
  CloseBtn,
  FavoriteProductIcon,
  LanguageSwitcher,
} from "@shared";
import { localePath } from "@shared/lib/localePath";
import { MODALS } from "@shared/config/modals";
import { useI18n } from "@shared/i18n/use-i18n";
import SocialLinks from "@shared/ui/SocialLinks";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import BurgerMenuCatalogTree from "./BurgerMenuCatalogTree";

const BurgerMenu = ({
  categories,
  isModalOpen,
  setIsModalOpen,
  navItems,
  burgerNavItems,
  locale
}) => {
  const LANGS = [
    {
      locales: "ua",
      labelKey: "language.ukrainian",
      code: "UA",
      index: 1

    },
    {
      locales: "en",
      labelKey: "language.english",
      code: "EN",
      index: 2
    },
  ];
  const { t } = useI18n();
  const { currentLocale, isOpen, onSelect } =
    useLanguageSwitcher();
  const isOpenModal = isModalOpen === MODALS.BURGER;
  const [isCatalogOpen, setIsCatalogOpen] =
    useState(false);
  return (
    <>
      {isOpenModal && (
        <div
          className="burger-menu__overlay"
          onClick={() => setIsModalOpen(null)}
        />
      )}

      <div
        className={`burger-menu ${isOpenModal ? "open" : ""}`}
      >
        <div className="burger-menu__header">
          <Link
            href={localePath(locale)}
            className="burger-menu__logo-link"
            aria-label={t("aria.homeLogo")}
            onClick={() => setIsModalOpen(null)}
          >
            <Image
              src="/img/perfect-parfums-logo.svg"
              alt=""
              width={171}
              height={60}
              className="burger-menu__logo"
              priority
            />
          </Link>

          <button
            type="button"
            className="burger-menu__close"
            onClick={() => setIsModalOpen(null)}
            aria-label={t("aria.closeMenu")}
          >
            <CloseBtn size={12} color="#1A1A1A" />
          </button>
        </div>

        <div className="burger-menu__inner">
          <button
            type="button"
            className={`burger-menu-catalog ${isCatalogOpen ? "is-open" : ""}`}
            onClick={() =>
              setIsCatalogOpen((v) => !v)
            }
            aria-expanded={isCatalogOpen}
          >
            <div>
              <BurgerMenuCatalog />
              <h2 className="burger-menu-catalog__title">
                {t("catalogSection.title")}
              </h2>
            </div>

            <span className="burger-menu-catalog__arrow">
              <ArrowMoreIcon />
            </span>
          </button>

          {isCatalogOpen && (
            <div className="burger-menu-catalog__dropdown">
              <BurgerMenuCatalogTree
                locale={locale}
                roots={categories?.items ?? []}
                onNavigate={() => {
                  setIsCatalogOpen(false);
                  setIsModalOpen(null);
                }}
              />
            </div>
          )}

          <div className="burger-menu-catalog__dropdown">
            <MainNav navItems={burgerNavItems ?? navItems} />
          </div>


          <div className="lang-dropdown">
            <LanguageSwitcher />

            <div className="lang-dropdown__content">
              <h3 className="lang-dropdown__title">
                {t("navigation.burger.chooseLanguage")}
              </h3>

              <ul className="lang-dropdown__list">
                {LANGS.map(
                  ({ locales, labelKey, code, Icon, index }) => (

                    <li key={index} onClick={() => onSelect(locales)} className={locales !== locale ? "lang-dropdown__item" : "lang-dropdown__item active"}>
                      <p>{code}</p>
                    </li>


                  ),
                )}
              </ul>

            </div>
          </div>

          <div className="account-user">
            <AccountIcon />

            <p className="account-user__text">
              {t("navigation.burger.accountLogin")}
            </p>
          </div>

          <div className="favorite-product">
            <FavoriteProductIcon />

            <p className="favorite-product__text">
              {t("navigation.burger.favorites")}
            </p>
          </div>

          <div className="burger-menu-contact">
            <div>
              <h3 className="burger-menu-contact__title">
                {t("navigation.burger.phone")}
              </h3>

              <ul className="burger-menu-contact__list">
                <li className="burger-menu-contact__item">
                  <a
                    className="burger-menu-contact__link"
                    href="tel:+380955616826"
                  >
                    +380 (95) 561-68-26
                  </a>
                </li>
                <li className="burger-menu-contact__item">
                  <a
                    className="burger-menu-contact__link"
                    href="tel:+380687527128"
                  >
                    +380 (68) 752-71-28
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="burger-menu-contact__title">
                {t("navigation.burger.questions")}
              </h3>

              <a
                className="burger-menu-contact__link"
                href="mailto:maloehelp@gmail.com"
              >
                maloehelp@gmail.com
              </a>
            </div>

            <div>
              <h3 className="burger-menu-contact__title">
                {t("navigation.burger.social")}
              </h3>
              <SocialLinks />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BurgerMenu;
