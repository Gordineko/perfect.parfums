import { cartLineVariantSummary } from "@shared/lib/cartLineVariantSummary";

import ProductPrice from "../common/ProductPrice";
import ProductTitle from "../common/ProductTittle";

const ProductItemBasketContent = ({
  title,
  product,
  locale,
  Counter,
  RemoveButton,
  displayPricing,
  isBasket,
}) => {
  const variantLine = cartLineVariantSummary(product, locale);
  return (
    <>
      <div className="product-item__basket-content">
        <ProductTitle title={title} />
        {variantLine ? (
          <p className="product-item__variant-line">{variantLine}</p>
        ) : null}

        <div className="product-item__basket-bottom">
          {Counter ? (
            <div className="product-item__basket-counter">
              <Counter product={product} />
            </div>
          ) : null}

          <div className="product-item__basket-price">
            <ProductPrice
              quantity={product?.quantityInCart}
              price={displayPricing}
              isBasket={isBasket}
              showCurrent={true}
              showOld={true}
            />
          </div>
        </div>
      </div>

      {RemoveButton ? <RemoveButton product={product} /> : null}
    </>
  );
};

export default ProductItemBasketContent;