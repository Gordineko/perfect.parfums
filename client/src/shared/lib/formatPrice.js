function formatWithLocale(rounded, fractionDigits) {
  return Number(rounded)
    .toLocaleString("uk-UA", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    .replace(/\u00A0/g, " ");
}

export function formatPrice(amount, options = {}) {
  const fractionDigits = options.fractionDigits ?? 0;
  const safe = Number(amount);
  if (!Number.isFinite(safe)) {
    return formatWithLocale(0, fractionDigits);
  }
  const rounded =
    fractionDigits === 0
      ? Math.round(safe)
      : Number(safe.toFixed(fractionDigits));
  return formatWithLocale(rounded, fractionDigits);
}

export function formatPriceDigits(n) {
  return formatPrice(n, { fractionDigits: 0 });
}

export function parsePriceLikeNumber(value) {
  if (value === null || value === undefined) return NaN;
  const normalized = String(value)
    .replace(/[^0-9.,]/g, "")
    .replace(",", ".");
  return Number(normalized);
}
