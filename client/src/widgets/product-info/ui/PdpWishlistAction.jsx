"use client";

import { useToggleWishlistButton } from "@features/toggle-wishlist/model/useToggleWishlistButton";
import { FavoriteHeart, useI18n } from "@shared";

export default function PdpWishlistAction({ product }) {
  const { t } = useI18n();
  const { derivedIsActive, buttonBusy, handleClick } =
    useToggleWishlistButton({ product });

  return (
    <button
      type="button"
      className={`pdp-info__wishlist${derivedIsActive ? " is-active" : ""}`}
      onClick={handleClick}
      disabled={buttonBusy}
      aria-busy={buttonBusy}
      aria-label={
        derivedIsActive
          ? t("wishlist.removeFromWishlist")
          : t("pdp.addToWishlist")
      }
    >
      <span className="pdp-info__wishlist-icon" aria-hidden="true">
        <FavoriteHeart />
      </span>
      <span className="pdp-info__wishlist-label">
        {t("pdp.addToWishlist")}
      </span>
    </button>
  );
}
