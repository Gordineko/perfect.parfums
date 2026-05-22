import { pickLocalizedString } from "@shared/lib/pickLocalized";

export function getOrderItemCategoryLabel(item, locale) {
  const category =
    item?.categorySnapshot ??
    item?.offerId?.category?.title ??
    item?.offerId?.categoryTitle ??
    item?.offerId?.category ??
    item?.categoryTitle ??
    item?.category;

  const label = pickLocalizedString(category, locale);
  return label || "Взуття";
}
