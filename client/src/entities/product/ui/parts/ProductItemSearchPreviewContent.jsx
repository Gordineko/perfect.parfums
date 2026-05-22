import ProductPrice from "../common/ProductPrice";
import ProductTitle from "../common/ProductTittle";

const ProductItemSearchPreviewContent = ({
  title,
  product,
  displayPricing,
  isBasket,
}) => {
  return (
    <>
      <ProductTitle title={title} />

      <ProductPrice
        quantity={product?.quantityInCart}
        price={displayPricing}
        hasDiscount={Boolean(product?.hasDiscount)}
        isBasket={isBasket}
        showCurrent={true}
        showOld={true}
      />
    </>
  );
};

export default ProductItemSearchPreviewContent;
