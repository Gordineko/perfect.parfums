/** Тимчасові опції об’єму (мл), поки variationAxes з API не підключені. */
export const PDP_STUB_VOLUME_OPTIONS_ML = Object.freeze([
  2, 5, 10, 15, 20, 30,
]);

export const PDP_STUB_VOLUME_DEFAULT_ML = 10;

/** Поки cart line не містить variationAxes — показувати заглушку об'єму в кошику. */
export const BASKET_USE_STUB_VOLUME = true;

/** Приклад артикулу з макету, поки API не віддає sku. */
export const PDP_STUB_ARTICLE_SKU = "0123456";

/** Приклад цін за 1 мл з макету, поки API не віддає pricing / cross price. */
export const PDP_STUB_PRICE_PER_ML = 239;
export const PDP_STUB_OLD_PRICE_PER_ML = 187;

function trimSku(value) {
  if (value == null) return "";
  const s = String(value).trim();
  return s;
}

/**
 * Артикул з API (offer / product / offers[]) або приклад 0123456.
 */
export function resolvePdpArticleSku(product, activeOffer) {
  const candidates = [
    activeOffer?.sku,
    activeOffer?.article,
    activeOffer?.articleNumber,
    activeOffer?.vendorCode,
    product?.sku,
    product?.article,
    product?.articleNumber,
    product?.vendorCode,
    product?.productSku,
    product?.groupSku,
  ];

  const offers = product?.offers;
  if (Array.isArray(offers)) {
    for (const offer of offers) {
      candidates.push(offer?.sku, offer?.article, offer?.articleNumber);
    }
  }

  for (const raw of candidates) {
    const value = trimSku(raw);
    if (value) {
      return { value, fromApi: true };
    }
  }

  return { value: PDP_STUB_ARTICLE_SKU, fromApi: false };
}

/**
 * Повертає ціни для відображення на PDP.
 * Стара ціна-заглушка — якщо з API немає cross price для закреслення.
 */
export function resolvePdpDisplayPrices({
  hasNumericPrice,
  currentPrice,
  oldPriceFromApi,
}) {
  if (!hasNumericPrice) {
    return {
      current: PDP_STUB_PRICE_PER_ML,
      old: PDP_STUB_OLD_PRICE_PER_ML,
      useStubPrices: true,
    };
  }

  const current = currentPrice;
  const apiOld =
    oldPriceFromApi != null && Number.isFinite(oldPriceFromApi)
      ? oldPriceFromApi
      : null;

  if (apiOld != null && apiOld !== current) {
    return { current, old: apiOld, useStubPrices: false };
  }

  const ratioOld = PDP_STUB_OLD_PRICE_PER_ML / PDP_STUB_PRICE_PER_ML;
  const stubOld = Math.max(1, Math.round(current * ratioOld));

  return {
    current,
    old: stubOld,
    useStubPrices: true,
  };
}

export function formatStubVolumeLabel(ml, locale = "ua") {
  const n = Number(ml);
  if (!Number.isFinite(n)) return "";
  return locale === "en" ? `${n} ml` : `${n} мл`;
}

export function resolveBasketVolumeLine(apiLine, locale = "ua") {
  const line = String(apiLine ?? "").trim();
  if (line) return line;
  if (!BASKET_USE_STUB_VOLUME) return "";

  const loc = locale === "en" ? "en" : "ua";
  const ml = formatStubVolumeLabel(PDP_STUB_VOLUME_DEFAULT_ML, loc);
  return loc === "en" ? `Volume: ${ml}` : `Об'єм: ${ml}`;
}

export function isVolumeAxis(axis, locale) {
  const title = String(
    axis?.title?.[locale] ??
      axis?.title?.ua ??
      axis?.title?.uk ??
      axis?.title?.en ??
      "",
  ).toLowerCase();
  const unit = String(axis?.unit ?? "").toLowerCase();
  return (
    title.includes("об'єм") ||
    title.includes("обєм") ||
    title.includes("volume") ||
    unit === "мл" ||
    unit === "ml"
  );
}

export function productHasVolumeAxis(axes, locale) {
  if (!Array.isArray(axes) || !axes.length) return false;
  return axes.some((axis) => isVolumeAxis(axis, locale));
}
