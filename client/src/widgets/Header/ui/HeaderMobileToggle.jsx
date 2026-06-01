"use client";

import { MODALS, useModals } from "@shared";
import { useI18n } from "@shared/i18n/use-i18n";
import BurgerMenuIcon from "@shared/ui/icons/BurgerMenu";
import clsx from "clsx";

import styles from "./Header.module.scss";

export default function HeaderMobileToggle({ labelKey, variant = "icon" }) {
  const { t } = useI18n();
  const { isModalOpen, setIsModalOpen } = useModals();

  return (
    <button
      type="button"
      className={clsx(
        styles.mobileMenuButton,
        variant === "lines" && styles.mobileMenuButtonLines,
      )}
      aria-label={t(labelKey)}
      onClick={() =>
        setIsModalOpen(isModalOpen === MODALS.BURGER ? null : MODALS.BURGER)
      }
    >
      {variant === "lines" ? (
        <span className={styles.burgerLines} aria-hidden />
      ) : (
        <BurgerMenuIcon />
      )}
    </button>
  );
}
