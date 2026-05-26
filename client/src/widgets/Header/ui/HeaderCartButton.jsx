"use client";

import { MODALS, useModals } from "@shared";
import { useI18n } from "@shared/i18n/use-i18n";
import Basket from "@shared/ui/icons/Basket";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import styles from "./Header.module.scss";

export default function HeaderCartButton() {
  const { t } = useI18n();
  const { setIsModalOpen, isModalOpen } = useModals();
  const cartItems = useSelector((state) => state.cart.items) ?? [];
  const cartTotalQty = Array.isArray(cartItems)
    ? cartItems.reduce(
        (sum, item) => sum + Math.max(0, Number(item?.quantityInCart) || 0),
        0,
      )
    : 0;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const countText = mounted ? String(cartTotalQty) : "0";
  const labelPrefix = t("basket.basketCount");

  return (
    <button
      type="button"
      className={styles.cartButton}
      aria-label={t("basket.basketCountAria", { count: countText })}
      onClick={() =>
        setIsModalOpen(isModalOpen === MODALS.BASKET ? null : MODALS.BASKET)
      }
    >
      <span className={styles.cartIcon} aria-hidden>
        <Basket />
      </span>
      <span className={styles.cartText}>
        <span className={styles.cartLabel}>{labelPrefix}</span>
        <span className={styles.cartCount}>{countText}</span>
      </span>
    </button>
  );
}
