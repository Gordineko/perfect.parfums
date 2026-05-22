export function categoryNodeFullSlug(cat) {
  if (!cat || typeof cat !== "object") {
    return "";
  }
  const fromFs =
    typeof cat.fullSlug === "string" && cat.fullSlug.trim()
      ? cat.fullSlug.trim()
      : "";
  if (fromFs) {
    return fromFs;
  }
  if (Array.isArray(cat.path) && cat.path.length > 0) {
    return cat.path.join("/");
  }
  return "";
}

export function categoryTreeItemHref(locale, cat) {
  const fs = categoryNodeFullSlug(cat);
  if (fs) {
    return `/${locale}/categories/${fs}`;
  }
  if (cat?.slug) {
    return `/${locale}/categories/${String(cat.slug)}`;
  }
  return `/${locale}/categories/all`;
}
