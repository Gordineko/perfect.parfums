import { getProductCategoryLine } from "../ui/common/ProductCategory";
import { PRODUCT_CARD_VOLUME_OPTIONS } from "./productCardVolumeOptions";

const PLACEHOLDER_IMAGE = "/img/product-placeholder.png";

function pickLocalizedTitle(title, locale = "ua") {
  if (!title) return "";
  if (typeof title === "string") return title.trim();
  return (
    title[locale] ??
    title.ua ??
    title.en ??
    ""
  ).trim();
}

function pricingFromProduct(product) {
  if (product?.pricing && typeof product.pricing === "object") {
    return product.pricing;
  }

  const first = product?.offers?.[0];
  const eff = Number(first?.effectivePrice);
  const list = Number(first?.price);
  const min = Number.isFinite(eff)
    ? String(Math.round(eff))
    : Number.isFinite(list)
      ? String(Math.round(list))
      : "0";

  const pricing = { min, currency: "UAH" };

  if (
    Number.isFinite(list) &&
    Number.isFinite(eff) &&
    list > eff
  ) {
    pricing.old = String(Math.round(list));
  }

  return pricing;
}

export function mapProductCardView(product, locale = "ua") {
  if (!product || typeof product !== "object") {
    return null;
  }

  const title = pickLocalizedTitle(product.title, locale);
  const brand = pickLocalizedTitle(product.brand, locale)
    || pickLocalizedTitle(product.subtitle, locale)
    || getProductCategoryLine(product, locale, "");

  const image = PLACEHOLDER_IMAGE;
  const volumes = PRODUCT_CARD_VOLUME_OPTIONS;

  return {
    id: String(product._id ?? product.id ?? title),
    product,
    image,
    brand,
    title: title || "—",
    rating: Number(product.rating) || 0,
    pricing: pricingFromProduct(product),
    volumes,
  };
}
