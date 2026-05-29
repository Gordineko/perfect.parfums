"use client";

import MainNav, {
  AccountIcon,
  ArrowMoreIcon,
  BurgerMenuCatalog,
  FavoriteProductIcon,
} from "@shared";
import { localePath } from "@shared/lib/localePath";
import { MODALS } from "@shared/config/modals";
import { useI18n } from "@shared/i18n/use-i18n";
import SocialLinks from "@shared/ui/SocialLinks";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import BurgerMenuCatalogTree from "./BurgerMenuCatalogTree";
import BurgerMenuCloseIcon from "./BurgerMenuCloseIcon";

const BURGER_CLOSE_MS = 1000;

const BurgerMenu = ({
  categories,
  isModalOpen,
  setIsModalOpen,
  navItems,
  burgerNavItems,
  locale,
}) => {
  const { t } = useI18n();
  const pathname = usePathname();
  const isOpenModal = isModalOpen === MODALS.BURGER;
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const pathnameRef = useRef(pathname);

  const closeMenu = useCallback(() => {
    setIsCatalogOpen(false);
    setIsModalOpen(null);

    if (isOpenModal) {
      setIsClosing(true);
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        setIsClosing(false);
      }, BURGER_CLOSE_MS);
    }
  }, [isOpenModal, setIsModalOpen]);

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (pathnameRef.current !== pathname && isOpenModal) {
      closeMenu();
    }
    pathnameRef.current = pathname;
  }, [pathname, isOpenModal, closeMenu]);

  useEffect(() => {
    if (isOpenModal) {
      setIsClosing(false);
      clearTimeout(closeTimerRef.current);
    }
  }, [isOpenModal]);

  const isMenuVisible = isOpenModal || isClosing;

  return (
    <>
      {isMenuVisible ? (
        <div
          className={`burger-menu__overlay ${isOpenModal ? "" : "is-fading"}`}
          onClick={closeMenu}
          aria-hidden={!isOpenModal}
        />
      ) : null}

      <div
        className={`burger-menu ${isOpenModal ? "open" : ""}`}
        aria-hidden={!isMenuVisible}
      >
        <div className="burger-menu__header">
          <Link
            href={localePath(locale)}
            className="burger-menu__logo-link"
            aria-label={t("aria.homeLogo")}
            onClick={closeMenu}
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
            onClick={closeMenu}
            aria-label={t("aria.closeMenu")}
          >
            <BurgerMenuCloseIcon />
          </button>
        </div>

        <div className="burger-menu__inner">
          <button
            type="button"
            className={`burger-menu-catalog ${isCatalogOpen ? "is-open" : ""}`}
            onClick={() => setIsCatalogOpen((v) => !v)}
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

          {isCatalogOpen ? (
            <div className="burger-menu-catalog__dropdown">
              <BurgerMenuCatalogTree
                locale={locale}
                roots={categories?.items ?? []}
                onNavigate={closeMenu}
              />
            </div>
          ) : null}

          <div className="burger-menu-catalog__dropdown">
            <MainNav
              navItems={burgerNavItems ?? navItems}
              onNavigate={closeMenu}
            />
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
                href="mailto:perfect.parfums@gmail.com"
              >
                perfect.parfums@gmail.com
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
