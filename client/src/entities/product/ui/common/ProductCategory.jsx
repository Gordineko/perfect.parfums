export function getProductSubtitleLine(
  product,
  locale = "ua",
  fallback = "",
) {
  const desc =
    product?.description?.[locale] ??
    product?.description?.ua ??
    product?.description?.en ??
    product?.description?.ru;
  if (typeof desc === "string" && desc.trim()) {
    return desc.trim();
  }
  return getProductCategoryLine(product, locale, fallback);
}

export function getProductCategoryLine(
  product,
  locale = "ua",
  fallback = "",
) {
  const category =
    product?.category?.title?.[locale] ??
    product?.category?.[locale] ??
    product?.categoryTitle?.[locale] ??
    product?.categoryTitle ??
    product?.category?.title ??
    product?.category;

  const subcategory =
    product?.subcategory?.title?.[locale] ??
    product?.subcategory?.[locale] ??
    product?.subCategory?.title?.[locale] ??
    product?.subCategory?.[locale] ??
    product?.subCategoryTitle?.[locale] ??
    product?.subCategoryTitle ??
    product?.subcategory?.title ??
    product?.subcategory ??
    product?.subCategory?.title ??
    product?.subCategory;

  const parts = [category, subcategory]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  return parts.length ? parts.join(" / ") : (fallback || "");
}

const ProductCategory = ({
  product,
  locale = "ua",
  fallback = "",
}) => {
  const text = getProductSubtitleLine(product, locale, fallback);

  if (!text) {
    return null;
  }

  return (
    <p className="product-item__text">
      {text}
    </p>
  );
};

export default ProductCategory;

