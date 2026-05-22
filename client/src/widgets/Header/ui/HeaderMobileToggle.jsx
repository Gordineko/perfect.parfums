"use client";

import { MODALS, useModals } from "@shared";
import { useI18n } from "@shared/i18n/use-i18n";
import BurgerMenuIcon from "@shared/ui/icons/BurgerMenu";

import styles from "./Header.module.scss";

export default function HeaderMobileToggle({ labelKey }) {
  const { t } = useI18n();
  const { isModalOpen, setIsModalOpen } = useModals();

  return (
    <button
      type="button"
      className={styles.mobileMenuButton}
      aria-label={t(labelKey)}
      onClick={() =>
        setIsModalOpen(isModalOpen === MODALS.BURGER ? null : MODALS.BURGER)
      }
    >
      <BurgerMenuIcon />
    </button>
  );
}
