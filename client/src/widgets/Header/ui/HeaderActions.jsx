"use client";

import { localePath } from "@shared/lib/localePath";
import SearchModal from "@features/search-modal";
import {
  headerActionsList,
  MODALS,
  useModals,
} from "@shared";
import Basket from "@widgets/basket";
import BurgerMenu from "@widgets/burger-menu";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import styles from "./Header.module.scss";

const HeaderActions = ({
  headerNavItems,
  burgerNavItems,
  categories,
  locale,
  labels,
  searchLabels,
  visibleActions,
  renderOverlays = false,
}) => {
  const { isModalOpen, setIsModalOpen } = useModals();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const id_token = Cookies.get("auth_token");

  const cartItems = useSelector((state) => state.cart.items) ?? [];
  const cartTotalQty = Array.isArray(cartItems) ? cartItems.reduce(
    (sum, item) => sum + Math.max(0, Number(item?.quantityInCart) || 0),
    0,
  ) : 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleModal = (modal) => {
    setIsModalOpen(isModalOpen === modal ? null : modal);
  };

  const buildLocaleHref = (nextLocale) => {
    const p = typeof pathname === "string" ? pathname : "/";
    const parts = p.split("/").filter(Boolean);
    const rest = parts.length > 0 ? parts.slice(1) : [];
    const nextPath = `/${nextLocale}${rest.length ? `/${rest.join("/")}` : ""}`;
    const qs = searchParams?.toString?.() || "";
    return qs ? `${nextPath}?${qs}` : nextPath;
  };

  const onActionClick = (id) => {
    if (id === "search") return toggleModal(MODALS.SEARCH);

    if (id === "menu") return toggleModal(MODALS.BURGER);

    if (id === "basket") return toggleModal(MODALS.BASKET);

    if (id === "favorite") return router.push(localePath(locale, "/wishlist"));

    if (id === "profile")
      return id_token
        ? router.push(localePath(locale, "/profile/info"))
        : toggleModal(MODALS.LOGIN);

    if (id === "favorite") {
      router.push(localePath(locale, "/wishlist"));
      return;
    }
  };

  const actions = Array.isArray(visibleActions)
    ? visibleActions
        .map((id) => headerActionsList.find((a) => a.id === id))
        .filter(Boolean)
    : headerActionsList;

  return (
    <>
      <ul className={styles.actions}>
        {actions.map(({ id, label, Icon }, index) => {
          if (id === "lang") {
            return (
              <li
                key={index}
                className={`${styles.actionsItem} ${styles.actionsItemLang}`}
                data-id={id}
              >
                <div className={styles.lang} aria-label={label}>
                  <Link
                    href={buildLocaleHref("ua")}
                    className={`${styles.langOption} ${locale === "ua" ? styles.langOptionActive : ""}`}
                  >
                    UA
                  </Link>
                  <span className={styles.langSep}>/</span>
                  <Link
                    href={buildLocaleHref("en")}
                    className={`${styles.langOption} ${locale === "en" ? styles.langOptionActive : ""}`}
                  >
                    EN
                  </Link>
                </div>
              </li>
            );
          }

          return (
            <li key={index} className={styles.actionsItem} data-id={id}>
              <button
                type="button"
                aria-label={label}
                className={styles.actionsButton}
                onClick={
                  id === "search" ||
                  id === "menu" ||
                  id === "profile" ||
                  id === "basket" ||
                  id === "favorite"
                    ? () => onActionClick(id)
                    : undefined
                }
              >
                <Icon />

              {id === "basket" &&
                mounted &&
                cartTotalQty > 0 &&
                (() => {
                  const text = cartTotalQty > 99 ? "99+" : String(cartTotalQty);

                  return (
                    <span
                      className={styles.badge}
                      aria-label={`${labels.basketCount}: ${text}`}
                    >
                      {text}
                    </span>
                  );
                })()}
              </button>

              {id === "search" && (
                <SearchModal
                  locale={locale}
                  isOpen={isModalOpen === MODALS.SEARCH}
                  onClose={() => setIsModalOpen(null)}
                  labels={searchLabels}
                />
              )}
            </li>
          );
        })}
      </ul>

      {renderOverlays ? (
        <>
          <BurgerMenu
            categories={categories}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            navItems={headerNavItems}
            burgerNavItems={burgerNavItems}
            locale={locale}
          />
          <Basket locale={locale} />
        </>
      ) : null}
    </>
  );
};

export default HeaderActions;