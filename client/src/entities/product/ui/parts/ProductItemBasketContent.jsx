import { cartLineVariantSummary } from "@shared/lib/cartLineVariantSummary";
import { resolveBasketVolumeLine } from "@widgets/product-info/lib/pdpStubVolume";

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
  const variantLine = resolveBasketVolumeLine(
    cartLineVariantSummary(product, locale),
    locale,
  );
  const sku =
    product?.offers?.[0]?.sku ??
    product?.offerId?.sku ??
    product?.sku ??
    product?.article ??
    product?.articleNumber ??
    null;
  return (
    <>
      <div className="product-item__basket-content">
        <div className="product-item__basket-info">
          <ProductTitle title={title} />
          {sku ? (
            <p className="product-item__article-line">{`Артикул: ${sku}`}</p>
          ) : null}
        </div>

        {variantLine ? (
          <p className="product-item__variant-line">
            {variantLine.includes(": ") ? (
              <>
                {`${variantLine.split(": ")[0]}: `}
                <strong>{variantLine.split(": ").slice(1).join(": ")}</strong>
              </>
            ) : (
              variantLine
            )}
          </p>
        ) : null}

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

      {RemoveButton ? <RemoveButton product={product} /> : null}
    </>
  );
};

export default ProductItemBasketContent;