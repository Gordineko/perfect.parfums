"use client";

import { localePath } from "@shared/lib/localePath";
import FavoriteHeart from "@shared/ui/icons/FavoriteHeart";
import { useI18n } from "@shared/i18n/use-i18n";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import styles from "./Header.module.scss";

export default function HeaderWishlistButton({ locale }) {
  const { t } = useI18n();
  const router = useRouter();
  const wishlistItems = useSelector((state) => state.wishlist?.items);
  const count = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const showCount = mounted && count > 0;
  const countText = count > 99 ? "99+" : String(count);

  const hasToken = Boolean(Cookies.get("auth_token"));
  const wishlistPath = hasToken ? "/profile/wishlist" : "/wishlist";

  return (
    <button
      type="button"
      className={styles.wishlistButton}
      aria-label={t("navigation.burger.favorites")}
      onClick={() => router.push(localePath(locale, wishlistPath))}
    >
      <span className={styles.wishlistIcon} aria-hidden>
        <FavoriteHeart />
      </span>
      {showCount ? (
        <span className={styles.wishlistCount} aria-hidden>
          {countText}
        </span>
      ) : null}
    </button>
  );
}
