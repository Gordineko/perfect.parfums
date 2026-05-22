function urlFromImageEntry(im) {
  if (im == null) {
    return "";
  }
  if (typeof im === "string") {
    return im.trim();
  }
  if (typeof im === "object") {
    const u =
      (typeof im.url === "string" && im.url.trim()) ||
      (typeof im.src === "string" && im.src.trim()) ||
      (typeof im.imageURL === "string" && im.imageURL.trim()) ||
      "";
    return u;
  }
  return "";
}

/**
 * Primary image URL for catalog cards / viewed products (group-level).
 * Aligns with PDP gallery: imageURL, then gallery[].url, then images[].
 */
export function deriveProductPrimaryImageUrl(product) {
  const top =
    typeof product?.imageURL === "string"
      ? product.imageURL.trim()
      : "";
  if (top) {
    return top;
  }

  const gallery = product?.gallery;
  if (Array.isArray(gallery) && gallery.length) {
    const sorted = [...gallery].sort(
      (a, b) => (a?.sort ?? 0) - (b?.sort ?? 0),
    );
    const preferred =
      sorted.find((x) => x?.isMain && urlFromImageEntry(x)) ??
      sorted[0];
    const fromGallery = urlFromImageEntry(preferred);
    if (fromGallery) {
      return fromGallery;
    }
  }

  const images = product?.images;
  if (Array.isArray(images) && images.length) {
    const fromImages = urlFromImageEntry(images[0]);
    if (fromImages) {
      return fromImages;
    }
  }

  const groupUrl = product?.group?.imageURL;
  if (typeof groupUrl === "string" && groupUrl.trim()) {
    return groupUrl.trim();
  }

  for (const key of ["imageSrc", "image"]) {
    const v = product?.[key];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }

  return "";
}
