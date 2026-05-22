const ProductDescription = ({
  text,
  title,
  fallback = "Product text",
}) => {
  return (
    <p className="product-item__text">
      {text ?? title ?? fallback}
    </p>
  );
};

export default ProductDescription;
