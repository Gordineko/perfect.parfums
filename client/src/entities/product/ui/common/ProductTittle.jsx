const ProductTitle = ({
  title = "Product name",
}) => {
  return (
    <h3 className="product-item__title">
      {title}
    </h3>
  );
};

export default ProductTitle;
