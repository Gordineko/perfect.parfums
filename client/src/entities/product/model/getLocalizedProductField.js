export function getLocalizedProductField(product, fieldName, locale) {
  return (
    product?.[fieldName]?.[locale] ??
    product?.[fieldName]?.ua ??
    product?.[fieldName]?.uk ??
    product?.[fieldName]?.ru ??
    product?.[fieldName]?.en ??
    product?.[fieldName] ??
    ""
  );
}
