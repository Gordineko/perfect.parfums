"use client";

import { MODALS, useModals } from "@shared";
import { useI18n } from "@shared/i18n/use-i18n";
import Profile from "@shared/ui/icons/Profile";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

import styles from "./Header.module.scss";

export default function HeaderAccountButton({
  locale,
  labelKey,
  variant = "text",
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { setIsModalOpen } = useModals();
  const hasToken = Boolean(Cookies.get("auth_token"));

  const handleClick = () => {
    if (hasToken) {
      router.push(`/${locale}/profile/info`);
      return;
    }
    setIsModalOpen(MODALS.LOGIN);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        className={styles.accountIconButton}
        aria-label={t(labelKey)}
        onClick={handleClick}
      >
        <Profile />
      </button>
    );
  }

  return (
    <button type="button" className={styles.topAccount} onClick={handleClick}>
      {t(labelKey)}
    </button>
  );
}
