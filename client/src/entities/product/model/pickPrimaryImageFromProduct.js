import { deriveProductPrimaryImageUrl } from "@shared";

export function pickPrimaryImageFromProduct(product) {
  return deriveProductPrimaryImageUrl(product) || "";
}
