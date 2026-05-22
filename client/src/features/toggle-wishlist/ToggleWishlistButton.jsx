"use client";

import { useToggleWishlistButton } from "./model/useToggleWishlistButton";
import ToggleWishlistButtonView from "./ui/ToggleWishlistButtonView";

export default function ToggleWishlistButton({
  product,
  productId,
  isActive,
  onToggle,
  ariaLabel = "Додати в обране",
}) {
  const { derivedIsActive, buttonBusy, handleClick } =
    useToggleWishlistButton({
      product,
      productId,
      isActive,
      onToggle,
    });

  return (
    <ToggleWishlistButtonView
      isActive={derivedIsActive}
      ariaLabel={ariaLabel}
      buttonBusy={buttonBusy}
      onClick={handleClick}
    />
  );
}
