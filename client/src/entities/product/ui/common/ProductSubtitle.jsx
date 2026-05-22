const ProductSubtitle = ({
  title = "Product text",
}) => {
  return (
    <p className="product-item__text">{title}</p>
  );
};

export default ProductSubtitle;
