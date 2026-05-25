import { deriveProductPrimaryImageUrl } from "@shared/lib/deriveProductPrimaryImageUrl";
import { pickLocalizedString } from "@shared/lib/pickLocalized";

export function mapHomeReviewView(review, locale = "ua") {
  const product =
    review?.product && typeof review.product === "object"
      ? review.product
      : null;

  const slug =
    typeof product?.slug === "string" ? product.slug.trim() : "";

  return {
    id: String(review?._id ?? review?.id ?? ""),
    name: String(review?.name ?? "").trim(),
    text: String(review?.text ?? "").trim(),
    rating: Number(review?.rating) || 0,
    date: review?.createdAt ?? review?.updatedAt ?? null,
    avatarUrl: String(review?.photoUrl ?? "").trim(),
    product: {
      slug,
      title: pickLocalizedString(product?.title, locale) || pickLocalizedString(product?.subtitle, locale),
      imageUrl: deriveProductPrimaryImageUrl(product),
    },
  };
}
