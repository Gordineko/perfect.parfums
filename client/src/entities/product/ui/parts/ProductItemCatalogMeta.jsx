import ProductCategory from "../common/ProductCategory";
import ProductPrice from "../common/ProductPrice";
import ProductTitle from "../common/ProductTittle";

const ProductItemCatalogMeta = ({
  showProductMeta,
  title,
  product,
  locale,
  displayPricing,
  isBasket,
}) => {
  if (!showProductMeta) return null;

  return (
    <div className="product-item__meta-container product-item__meta-container--catalog">
      <div className="product-item__meta-text">
        <ProductTitle title={title} />

        <div className="product-item__subtitle-row product-item__subtitle-row--category-only">
          <ProductCategory
            product={product}
            locale={locale}
          />
        </div>
      </div>

      <div className="product-item__meta-price">
        <ProductPrice
          quantity={product?.quantityInCart}
          price={displayPricing}
          hasDiscount={Boolean(product?.hasDiscount)}
          isBasket={isBasket}
          showCurrent={true}
          showOld={true}
        />
      </div>
    </div>
  );
};

export default ProductItemCatalogMeta;
