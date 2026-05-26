"use client";

import { localePath } from "@shared/lib/localePath";
import FavoriteHeart from "@shared/ui/icons/FavoriteHeart";
import { useI18n } from "@shared/i18n/use-i18n";
import { useRouter } from "next/navigation";

import styles from "./Header.module.scss";

export default function HeaderWishlistButton({ locale }) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.wishlistButton}
      aria-label={t("navigation.burger.favorites")}
      onClick={() => router.push(localePath(locale, "/wishlist"))}
    >
      <FavoriteHeart />
    </button>
  );
}
