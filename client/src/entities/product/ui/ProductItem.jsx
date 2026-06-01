"use client";

import { useProductItemViewModel } from "../model/useProductItemViewModel";
import ProductItemBasketContent from "./parts/ProductItemBasketContent";
import ProductItemMedia from "./parts/ProductItemMedia";
import ProductItemSearchPreviewContent from "./parts/ProductItemSearchPreviewContent";
import ProductCard from "./ProductCard";

const ProductItem = ({
  product,
  isInCart,
  variant = "catalog",
  actionButtons,
  showDiscount = true,
  showProductMeta = true,
  imagePriority = false,
  locale: localeProp,
  discountBadge: discountBadgeOverride,
}) => {
  const vm = useProductItemViewModel({
    product,
    isInCart,
    variant,
    actionButtons,
    localeProp,
  });

  if (vm.isCatalogView) {
    const discountBadge =
      showDiscount && showProductMeta
        ? (discountBadgeOverride ?? vm.discountBadge)
        : null;

    return (
      <div
        itemScope
        itemType="https://schema.org/Product"
        className="product-item product-item--catalog"
        onClick={vm.handleNavigate}
        onKeyDown={vm.handleKeyDown}
        role={vm.pdpHref ? "link" : undefined}
        tabIndex={vm.pdpHref ? 0 : undefined}
      >
        <ProductCard
          product={product}
          locale={vm.locale}
          imagePriority={imagePriority}
          discountBadge={discountBadge}
          WishButton={vm.WishButton}
          CartButton={vm.CartButton}
        />
      </div>
    );
  }

  return (
    <div
      itemScope
      itemType="https://schema.org/Product"
      className={`product-item product-item--${variant}`}
      onClick={vm.handleNavigate}
      onKeyDown={vm.handleKeyDown}
      role={vm.pdpHref ? "link" : undefined}
      tabIndex={vm.pdpHref ? 0 : undefined}
    >
      <ProductItemMedia
        image={vm.image}
        title={vm.title}
        imagePriority={imagePriority}
        isSearchPreview={vm.isSearchPreview}
        isBasket={vm.isBasket}
        showDiscount={showDiscount}
        discountBadge={discountBadgeOverride ?? vm.discountBadge}
        WishButton={vm.WishButton}
        product={product}
      />

      {vm.isBasket ? (
        <ProductItemBasketContent
          title={vm.title}
          product={product}
          locale={vm.locale}
          Counter={vm.Counter}
          RemoveButton={vm.RemoveButton}
          displayPricing={vm.displayPricing}
          isBasket={vm.isBasket}
        />
      ) : (
        <ProductItemSearchPreviewContent
          title={vm.title}
          product={product}
          displayPricing={vm.displayPricing}
          isBasket={vm.isBasket}
        />
      )}
    </div>
  );
};

export default ProductItem;
