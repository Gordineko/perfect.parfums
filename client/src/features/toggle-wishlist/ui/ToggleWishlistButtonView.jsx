"use client";

import { FavoriteHeart } from "@shared";

export default function ToggleWishlistButtonView({
  isActive,
  ariaLabel,
  buttonBusy,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`product-item__favorite ${
        isActive ? "active" : ""
      }`}
      aria-label={ariaLabel}
      aria-busy={buttonBusy}
      disabled={buttonBusy}
      onClick={onClick}
    >
      <FavoriteHeart />
    </button>
  );
}
