import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

import { getLocalizedProductField } from "./getLocalizedProductField";
import { getProductDiscountBadge } from "./getProductDiscountBadge";
import { getProductDisplayPricing } from "./getProductDisplayPricing";
import { pickPrimaryImageFromProduct } from "./pickPrimaryImageFromProduct";
import { resolveProductSlug } from "./resolveProductSlug";

export function useProductItemViewModel({
  product,
  isInCart,
  variant,
  actionButtons,
  localeProp,
}) {
  const params = useParams();
  const locale = localeProp ?? params?.locale ?? "ua";
  const router = useRouter();
  const slug = resolveProductSlug(product, locale);

  const title = getLocalizedProductField(product, "title", locale);
  const subtitle = getLocalizedProductField(product, "subtitle", locale);
  const image = pickPrimaryImageFromProduct(product);

  const displayPricing = useMemo(
    () => getProductDisplayPricing(product),
    [product],
  );

  const discountBadge = useMemo(
    () => getProductDiscountBadge(product?.offers),
    [product?.offers],
  );

  const { CartButton, WishButton, Counter, RemoveButton } =
    actionButtons || {};

  const isSearchPreview = variant === "searchPreview";
  const isBasket = variant === "basket";
  const isCatalogCard = variant === "catalog";
  const isCatalogView = !isSearchPreview && !isBasket;

  const canNavigate = Boolean(slug) && (isCatalogCard || isSearchPreview);
  const pdpHref = canNavigate
    ? `/${locale}/product/${slug
        .split("/")
        .filter(Boolean)
        .map((s) => encodeURIComponent(s))
        .join("/")}`
    : null;

  const handleNavigate = (e) => {
    if (!pdpHref) return;

    const target = e?.target;
    const interactive =
      target &&
      typeof target.closest === "function" &&
      target.closest("button, a, input, textarea, select, label");

    if (interactive) return;

    router.push(pdpHref);
  };

  const handleKeyDown = (e) => {
    if (!pdpHref) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(pdpHref);
    }
  };

  const buttonText = isInCart ? "Додано в кошик" : "В кошик";

  return {
    locale,
    title,
    subtitle,
    image,
    displayPricing,
    discountBadge,
    CartButton,
    WishButton,
    Counter,
    RemoveButton,
    isSearchPreview,
    isBasket,
    isCatalogView,
    pdpHref,
    buttonText,
    handleNavigate,
    handleKeyDown,
  };
}
