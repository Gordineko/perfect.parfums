const ProductBrand = ({ brand = "Brand" }) => {
  return (
    <span
      itemProp="brand"
      className="product-item__brand"
    >
      <span itemProp="name">{brand}</span>
    </span>
  );
};

export default ProductBrand;
