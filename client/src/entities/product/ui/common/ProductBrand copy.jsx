"use client"
const ProductBrand = ({ product, locale }) => {
  return (
    <span
      itemProp="brand"
      className="product-item__brand"
    >
      {product?.facets?.[0]?.characteristics?.map((
        char
      ) => {

        if (char.key === "brand") {
          return (<span itemProp="name">{char?.value?.label?.[locale]}</span>)
        }
      })}

    </span>
  );
};

export default ProductBrand;
