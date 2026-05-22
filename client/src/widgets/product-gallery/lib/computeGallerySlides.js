import { pickLocalizedString } from "@shared/lib/pickLocalized";

export function extractImageSrc(value) {
  if (!value) return null;
  if (typeof value === "string") return value;

  if (typeof value === "object") {
    const candidate =
      value.src ??
      value.url ??
      value.imageURL ??
      value.imageUrl ??
      value.path ??
      value.href;

    return typeof candidate === "string" ? candidate : null;
  }

  return null;
}

export function buildSlidesFromLegacy(
  product,
  imagesProp,
  mergeProductImages,
  locale,
) {
  const fromProp = Array.isArray(imagesProp)
    ? imagesProp
    : imagesProp != null && imagesProp !== ""
      ? [imagesProp]
      : [];

  const fromProduct =
    mergeProductImages === false
      ? []
      : Array.isArray(product?.images)
        ? product.images
        : [product?.imageURL, product?.img, product?.imageSrc].filter(Boolean);

  const urls = [...fromProp, ...fromProduct]
    .flat()
    .map(extractImageSrc)
    .filter(Boolean);

  const deduped = Array.from(new Set(urls));
  const titleFallback =
    pickLocalizedString(product?.title, locale) || "Product image";

  return deduped.map((src) => ({ src, alt: titleFallback }));
}

export function computeGallerySlides({
  slidesProp,
  product,
  images,
  mergeProductImages,
  locale,
}) {
  if (Array.isArray(slidesProp) && slidesProp.length) {
    const titleFallback =
      pickLocalizedString(product?.title, locale) || "Product image";
    return slidesProp
      .map((s) => {
        const src = typeof s === "string" ? s.trim() : s?.src?.trim?.();
        if (!src) return null;
        const alt =
          (typeof s === "object" && s?.alt && String(s.alt).trim()) ||
          titleFallback;
        return { src, alt };
      })
      .filter(Boolean);
  }
  return buildSlidesFromLegacy(
    product,
    images,
    mergeProductImages,
    locale,
  );
}
