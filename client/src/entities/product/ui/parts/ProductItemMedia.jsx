import ProductImage from "../common/ProductImage";

const ProductItemMedia = ({
  image,
  title,
  imagePriority,
  isSearchPreview,
  isBasket,
  showDiscount,
  discountBadge,
  WishButton,
  product,
}) => {
  return (
    <ProductImage
      image={image}
      alt={title || "Product"}
      priority={imagePriority}
    >
      {!isSearchPreview &&
        !isBasket &&
        showDiscount &&
        discountBadge != null && (
          <div
            className="product-item__discount"
            aria-label={discountBadge.ariaLabel}
          >
            <span className="product-item__discount-text">
              {discountBadge.text}
            </span>
          </div>
        )}

      {!isSearchPreview && !isBasket && WishButton && (
        <WishButton product={product} />
      )}
    </ProductImage>
  );
};

export default ProductItemMedia;
