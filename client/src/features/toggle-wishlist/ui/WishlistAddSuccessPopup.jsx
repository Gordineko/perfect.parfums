"use client";

import { useI18n } from "@shared";

import styles from "./WishlistAddSuccessPopup.module.scss";

export default function WishlistAddSuccessPopup({
  onNavigate,
  exiting,
  onExitTransitionEnd,
}) {
  const { t } = useI18n();

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "opacity") return;
    if (!exiting) return;
    onExitTransitionEnd?.();
  };

  return (
    <button
      type="button"
      className={`${styles.root} ${exiting ? styles.rootExiting : ""}`}
      onClick={onNavigate}
      onTransitionEnd={handleTransitionEnd}
      aria-label={`${t("wishlist.addSuccessMessage")}. ${t("wishlist.addSuccessCta")}`}
    >
      <div className={styles.message}>{t("wishlist.addSuccessMessage")}</div>
      <span className={styles.cta}>{t("wishlist.addSuccessCta")}</span>
    </button>
  );
}
