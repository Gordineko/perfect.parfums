"use client";

import { useProductItemViewModel } from "../model/useProductItemViewModel";
import ProductItemBasketContent from "./parts/ProductItemBasketContent";
import ProductItemCatalogMeta from "./parts/ProductItemCatalogMeta";
import ProductItemMedia from "./parts/ProductItemMedia";
import ProductItemSearchPreviewContent from "./parts/ProductItemSearchPreviewContent";

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

      {vm.isCatalogView ? (
        <ProductItemCatalogMeta
          showProductMeta={showProductMeta}
          title={vm.title}
          product={product}
          locale={vm.locale}
          displayPricing={vm.displayPricing}
          isBasket={vm.isBasket}
        />
      ) : vm.isBasket ? (
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

      {vm.CartButton && vm.isCatalogView ? (
        <vm.CartButton
          product={product}
          buttonText={vm.buttonText}
          pdpHref={vm.pdpHref}
        />
      ) : null}
    </div>
  );
};

export default ProductItem;