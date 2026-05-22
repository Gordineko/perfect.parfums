import { formatPriceDigits } from "@shared/lib/formatPrice";

export function getOfferDiscountBadgeDisplay(offer) {
  if (!offer || typeof offer !== "object") return null;
  const type = String(offer.discountType ?? "").toLowerCase();

  if (type === "none") {
    return null;
  }

  const tryPercent = () => {
    const pct = Number(offer.discount);
    if (Number.isFinite(pct) && pct > 0) {
      const rounded = Math.round(pct);
      return {
        text: `${rounded}%`,
        ariaLabel: `${rounded}% discount`,
      };
    }
    return null;
  };

  const tryAmount = () => {
    const uah = Number(offer.discountUAH);
    if (Number.isFinite(uah) && uah > 0) {
      return {
        text: `−${formatPriceDigits(uah)} ₴`,
        ariaLabel: `${formatPriceDigits(uah)} UAH discount`,
      };
    }
    return null;
  };

  if (type === "percent") return tryPercent();
  if (type === "amount") return tryAmount();

  if (type === "") {
    return tryPercent() ?? tryAmount();
  }

  return null;
}

export function getOfferMarketingTagLabels(offer, locale = "ua") {
  const chars = offer?.characteristics;
  if (!Array.isArray(chars)) return [];
  const tagsRow = chars.find((c) => c?.key === "tags");
  const values = tagsRow?.values;
  if (!Array.isArray(values)) return [];
  const out = [];
  for (const v of values) {
    const label = v?.label;
    let text = "";
    if (label && typeof label === "object") {
      text = String(
        label[locale] ?? label.ua ?? label.uk ?? label.en ?? "",
      ).trim();
    } else if (typeof label === "string") {
      text = label.trim();
    }
    if (text) out.push(text);
  }
  return out;
}