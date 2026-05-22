import { pickLocalizedString } from "@shared/lib/pickLocalized";

export function stringifyOptionPart(value) {
  if (value == null) return "";
  return String(value);
}

export function presetRawValue(entry) {
  if (entry == null) return undefined;
  if (typeof entry === "object" && entry !== null && "value" in entry) {
    return entry.value;
  }
  return entry;
}

export function getAxisOptionLabel(axis, value, locale) {
  const preset = axis?.valuesPreset;
  if (!Array.isArray(preset)) {
    const u = axis?.unit;
    return u ? `${value} ${u}`.trim() : String(value);
  }
  for (const p of preset) {
    const raw = presetRawValue(p);
    if (stringifyOptionPart(raw) === stringifyOptionPart(value)) {
      if (typeof p === "object" && p?.label) {
        const lb = pickLocalizedString(p.label, locale);
        if (lb) return lb;
      }
      break;
    }
  }
  const u = axis?.unit;
  return u ? `${value} ${u}`.trim() : String(value);
}

export function isPrefixedOptionKey(key) {
  return typeof key === "string" && /:[^|]/.test(key);
}

function parsePrefixedOptionKeyToMap(key) {
  const map = {};
  if (typeof key !== "string" || !key.length) return map;
  const segments = key.split("|");
  for (const seg of segments) {
    const i = seg.indexOf(":");
    if (i <= 0) continue;
    const axisId = seg.slice(0, i);
    const raw = seg.slice(i + 1);
    const n = Number(raw);
    map[axisId] =
      raw !== "" && Number.isFinite(n) && String(n) === String(raw).trim()
        ? n
        : raw;
  }
  return map;
}

function isAxisValueUnset(sel) {
  return (
    sel === undefined ||
    sel === null ||
    stringifyOptionPart(sel) === ""
  );
}

export function optionValuesEqual(offerVal, selectedVal) {
  if (stringifyOptionPart(offerVal) === stringifyOptionPart(selectedVal)) {
    return true;
  }
  const a = Number(offerVal);
  const b = Number(selectedVal);
  if (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    a === b &&
    stringifyOptionPart(offerVal) !== "" &&
    stringifyOptionPart(selectedVal) !== ""
  ) {
    return true;
  }
  return false;
}

export function offerMatchesPartialSelection(offer, axes, selectedByAxisId) {
  if (!offer || !Array.isArray(axes) || !axes.length) return false;
  const parts = getAxisValueArray(offer, axes);
  for (let i = 0; i < axes.length; i++) {
    const id = axes[i]?.axisId;
    if (id == null) continue;
    const sel = selectedByAxisId?.[id];
    if (isAxisValueUnset(sel)) continue;
    const pv = parts[i];
    if (!optionValuesEqual(pv, sel)) return false;
  }
  return true;
}

export function offerIsPurchasable(offer) {
  return offer != null && offer.available !== false;
}

export function isSelectionCompleteForAxes(axes, selectedByAxisId) {
  if (!Array.isArray(axes) || !axes.length) return true;
  return axes.every((ax) => {
    const id = ax?.axisId;
    if (id == null) return true;
    return !isAxisValueUnset(selectedByAxisId?.[id]);
  });
}

export function axisOptionHasPurchasableOffer(
  product,
  axisIndex,
  optionValue,
  partialSelection,
) {
  const axes = product?.variationAxes ?? [];
  const offers = product?.offers ?? [];
  const axis = axes[axisIndex];
  if (!axis?.axisId) return false;

  const hypothetical = {};
  for (let i = 0; i < axes.length; i++) {
    const id = axes[i]?.axisId;
    if (id == null) continue;
    if (i < axisIndex) {
      const v = partialSelection?.[id];
      if (!isAxisValueUnset(v)) hypothetical[id] = v;
    } else if (i === axisIndex) {
      hypothetical[id] = optionValue;
    }
  }

  return offers.some(
    (o) =>
      offerIsPurchasable(o) &&
      offerMatchesPartialSelection(o, axes, hypothetical),
  );
}

export function repairSelectionToPurchasableOffer(product, selectedByAxisId) {
  const axes = product?.variationAxes ?? [];
  const offers = product?.offers ?? [];
  if (!axes.length || !offers.length) return selectedByAxisId;
  if (!isSelectionCompleteForAxes(axes, selectedByAxisId)) {
    return selectedByAxisId;
  }

  const current = getActiveOffer(product, selectedByAxisId);
  if (current && offerIsPurchasable(current)) return selectedByAxisId;

  const purch = offers.filter(offerIsPurchasable);
  if (!purch.length) return selectedByAxisId;

  let best = null;
  let bestScore = -1;
  for (const o of purch) {
    const parts = getAxisValueArray(o, axes);
    let score = 0;
    let allSetMatch = true;
    for (let i = 0; i < axes.length; i++) {
      const id = axes[i]?.axisId;
      if (id == null) continue;
      const need = selectedByAxisId?.[id];
      if (isAxisValueUnset(need)) continue;
      if (!optionValuesEqual(parts[i], need)) {
        allSetMatch = false;
        break;
      }
      score++;
    }
    if (!allSetMatch) continue;
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }

  if (best) return parseOfferToSelection(best, axes);
  return parseOfferToSelection(purch[0], axes);
}

function getAxisValuesFromCharacteristics(offer, axes) {
  const raw = offer?.characteristics;
  if (!Array.isArray(raw) || !raw.length || !Array.isArray(axes) || !axes.length) {
    return null;
  }

  const byKey = new Map();
  for (const ch of raw) {
    const k = ch?.axisId ?? ch?.key ?? ch?.characteristicKey ?? ch?.id;
    if (k === undefined || k === null) continue;
    let v = ch?.value;
    if (v === undefined && Array.isArray(ch?.values)) {
      v = ch.values[0];
    }
    byKey.set(String(k), v);
  }

  const out = axes.map((ax) => {
    const id = ax?.axisId;
    if (id == null) return undefined;
    return byKey.has(String(id)) ? byKey.get(String(id)) : undefined;
  });

  if (out.every((v) => v === undefined || v === null)) return null;
  return out;
}

export function getAxisValueArray(offer, axes) {
  if (!offer || !Array.isArray(axes) || axes.length === 0) return [];

  const map = offer.optionMap;
  if (map && typeof map === "object") {
    const fromMap = axes.map((ax) => map?.[ax.axisId]);
    if (fromMap.some((v) => v !== undefined && v !== null)) {
      return fromMap;
    }
  }

  if (Array.isArray(offer.optionValues) && offer.optionValues.length) {
    return axes.map((_, idx) => offer.optionValues[idx]);
  }

  if (typeof offer.optionKey === "string" && offer.optionKey.length) {
    if (isPrefixedOptionKey(offer.optionKey)) {
      const parsed = parsePrefixedOptionKeyToMap(offer.optionKey);
      return axes.map((ax) => parsed[ax.axisId]);
    }
    const parts = offer.optionKey.split("|");
    return axes.map((_, idx) => parts[idx]);
  }

  const fromCharacteristics = getAxisValuesFromCharacteristics(offer, axes);
  if (fromCharacteristics) return fromCharacteristics;

  return axes.map(() => undefined);
}

export function getOfferParts(offer, axes) {
  return getAxisValueArray(offer, axes).map(stringifyOptionPart);
}

function shouldUsePrefixedOptionKeys(axes, product) {
  const sample = product?.offers?.[0];
  return (
    isPrefixedOptionKey(sample?.optionKey) ||
    (sample?.optionMap &&
      typeof sample.optionMap === "object" &&
      Object.keys(sample.optionMap).some((k) =>
        axes.some((a) => a.axisId === k),
      ))
  );
}

export function buildOptionKeyFromParts(parts, axes, product) {
  if (!Array.isArray(axes) || axes.length === 0) return "";
  const prefixed = shouldUsePrefixedOptionKeys(axes, product);
  if (prefixed) {
    return axes
      .map(
        (axis, i) =>
          `${axis.axisId}:${stringifyOptionPart(parts?.[i])}`,
      )
      .join("|");
  }
  return axes.map((_, i) => stringifyOptionPart(parts?.[i])).join("|");
}

export function buildOptionKey(axes, selectedByAxisId, product) {
  const parts = axes.map((ax) => selectedByAxisId?.[ax?.axisId]);
  return buildOptionKeyFromParts(parts, axes, product);
}

export function findOfferByOptionKey(
  offers,
  optionKey,
  axes,
  selectedByAxisId,
  product,
) {
  if (!Array.isArray(offers)) return null;

  if (typeof optionKey === "string" && optionKey.length) {
    let hit = offers.find((o) => o?.optionKey === optionKey);
    if (hit) return hit;
    hit = offers.find((o) => {
      const parts = getAxisValueArray(o, axes);
      return buildOptionKeyFromParts(parts, axes, product) === optionKey;
    });
    if (hit) return hit;
  }

  if (axes?.length && selectedByAxisId) {
    const matches = offers.filter((o) =>
      offerMatchesPartialSelection(o, axes, selectedByAxisId),
    );
    if (!matches.length) return null;
    if (typeof optionKey === "string" && optionKey.length) {
      const byCanon = matches.find((o) => {
        const parts = getAxisValueArray(o, axes);
        return buildOptionKeyFromParts(parts, axes, product) === optionKey;
      });
      if (byCanon) return byCanon;
    }
    return matches.find(offerIsPurchasable) ?? matches[0];
  }

  return null;
}

export function parseOfferToSelection(offer, axes) {
  const out = {};
  if (!offer || !Array.isArray(axes) || axes.length === 0) return out;
  const arr = getAxisValueArray(offer, axes);
  axes.forEach((axis, i) => {
    const id = axis?.axisId;
    if (id == null) return;
    const raw = arr[i];
    if (raw === undefined) return;
    if (axis?.type === "number") {
      const n = Number(raw);
      out[id] = Number.isFinite(n) ? n : raw;
    } else {
      out[id] = raw;
    }
  });
  return out;
}

export function defaultSelectionFromProduct(product) {
  const axes = product?.variationAxes ?? [];
  const offers = product?.offers ?? [];
  if (!axes.length) return {};
  const first = offers.find(offerIsPurchasable) ?? offers[0] ?? null;
  if (!first) return {};
  return parseOfferToSelection(first, axes);
}

export function valuesForAxis(
  product,
  axisIndex,
  partialSelection,
  mode = "display",
) {
  const axes = product?.variationAxes ?? [];
  const offers = product?.offers ?? [];
  const axis = axes[axisIndex];
  if (!axis) return [];

  const runPass = (onlyPurchasable) => {
    const seen = new Set();
    const ordered = [];

    const pushVal = (raw) => {
      if (raw === undefined || raw === null) return;
      const typed = axis.type === "number" ? Number(raw) : raw;
      const key = stringifyOptionPart(typed);
      if (key === "" || seen.has(key)) return;
      seen.add(key);
      ordered.push(typed);
    };

    for (const offer of offers) {
      if (onlyPurchasable && !offerIsPurchasable(offer)) continue;

      const parts = getAxisValueArray(offer, axes);
      const v = parts[axisIndex];
      if (v === undefined || v === null || stringifyOptionPart(v) === "") {
        continue;
      }

      if (mode === "compatible") {
        let ok = true;
        for (let k = 0; k < axes.length; k++) {
          if (k === axisIndex) continue;
          const ax = axes[k];
          const sel = partialSelection?.[ax?.axisId];
          if (isAxisValueUnset(sel)) continue;
          const pk = parts[k];
          if (!optionValuesEqual(pk, sel)) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
      }

      pushVal(v);
    }
    return ordered;
  };

  let ordered;
  if (mode === "compatible") {
    ordered = runPass(true);
    if (!ordered.length) ordered = runPass(false);
  } else {
    ordered = runPass(true);
    if (!ordered.length && offers.length) ordered = runPass(false);
  }

  const preset = axis.valuesPreset;
  if (Array.isArray(preset) && preset.length) {
    const out = [];
    for (const p of preset) {
      const pv = presetRawValue(p);
      const key = stringifyOptionPart(pv);
      const found = ordered.find((w) => stringifyOptionPart(w) === key);
      if (found !== undefined) out.push(found);
    }
    if (out.length) return out;
    if (!ordered.length) {
      return preset
        .map((p) => {
          const raw = presetRawValue(p);
          if (axis.type === "number") {
            const n = Number(raw);
            return Number.isFinite(n) ? n : raw;
          }
          return raw;
        })
        .filter(
          (v) =>
            v !== undefined &&
            v !== null &&
            stringifyOptionPart(v) !== "",
        );
    }
  }

  return ordered;
}

export function resolveSelectionAfterAxisChange(
  product,
  prevSelection,
  changedAxisIndex,
  newValue,
) {
  const axes = product?.variationAxes ?? [];
  const offers = product?.offers ?? [];
  if (!axes.length) return {};

  const sel = {};
  for (let i = 0; i < changedAxisIndex; i++) {
    const id = axes[i]?.axisId;
    if (id == null) continue;
    const v = prevSelection?.[id];
    if (!isAxisValueUnset(v)) sel[id] = v;
  }
  const ax = axes[changedAxisIndex];
  if (ax?.axisId != null) sel[ax.axisId] = newValue;

  for (let j = changedAxisIndex + 1; j < axes.length; j++) {
    const opts = valuesForAxis(product, j, sel, "compatible");
    const nextAxis = axes[j];
    if (!opts.length || !nextAxis?.axisId) {
      const hit = offers.find(
        (o) =>
          offerIsPurchasable(o) &&
          offerMatchesPartialSelection(o, axes, sel),
      );
      return hit
        ? parseOfferToSelection(hit, axes)
        : defaultSelectionFromProduct(product);
    }
    sel[nextAxis.axisId] = opts[0];
  }

  return sel;
}

export function getActiveOffer(product, selectedByAxisId) {
  const axes = product?.variationAxes ?? [];
  const offers = product?.offers ?? [];
  if (!offers.length) return null;
  if (!axes.length) {
    return offers.find(offerIsPurchasable) ?? offers[0] ?? null;
  }
  if (!isSelectionCompleteForAxes(axes, selectedByAxisId)) {
    return null;
  }
  const key = buildOptionKey(axes, selectedByAxisId, product);
  return findOfferByOptionKey(offers, key, axes, selectedByAxisId, product);
}

function collectProductGallerySlidesOnly(product, locale) {
  const titleFallback =
    pickLocalizedString(product?.title, locale) || "Product image";

  const slideFromUrl = (url, alt) => {
    const src = typeof url === "string" ? url.trim() : "";
    if (!src) return null;
    const a =
      typeof alt === "string" && alt.trim()
        ? alt.trim()
        : titleFallback;
    return { src, alt: a };
  };

  const out = [];
  const seen = new Set();

  const mainUrl =
    typeof product?.imageURL === "string" ? product.imageURL.trim() : "";
  if (mainUrl) {
    out.push({ src: mainUrl, alt: titleFallback });
    seen.add(mainUrl);
  }

  if (Array.isArray(product?.gallery)) {
    const sorted = [...product.gallery].sort(
      (a, b) => (a?.sort ?? 0) - (b?.sort ?? 0),
    );
    for (const item of sorted) {
      const u = typeof item?.url === "string" ? item.url.trim() : "";
      if (!u || seen.has(u)) continue;
      seen.add(u);
      const alt = pickLocalizedString(item?.alt, locale) || titleFallback;
      out.push({ src: u, alt });
    }
  }

  if (Array.isArray(product?.images)) {
    for (const im of product.images) {
      const u = extractUrlFromImageEntry(im);
      if (u && !seen.has(u)) {
        seen.add(u);
        out.push({ src: u, alt: titleFallback });
      }
    }
  }

  if (mainUrl && !out.some((x) => x.src === mainUrl)) {
    out.unshift({ src: mainUrl, alt: titleFallback });
  }

  return dedupeSlidesBySrc(out);
}

function pickOfferPrimaryImageUrl(offer) {
  if (!offer || typeof offer !== "object") return "";
  const candidates = [
    offer.img,
    offer.imageURL,
    offer.imageUrl,
    offer.image,
    offer.coverUrl,
    offer.photoUrl,
    offer.photo,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

export function collectGallerySlides(offer, product, locale = "ua") {
  const titleFallback =
    pickLocalizedString(product?.title, locale) || "Product image";

  const slideFromUrl = (url, alt) => {
    const src = typeof url === "string" ? url.trim() : "";
    if (!src) return null;
    const a =
      typeof alt === "string" && alt.trim()
        ? alt.trim()
        : titleFallback;
    return { src, alt: a };
  };

  const base = collectProductGallerySlidesOnly(product, locale);

  const fromOffer = [];
  const hero = pickOfferPrimaryImageUrl(offer);
  if (hero) {
    const s = slideFromUrl(hero, titleFallback);
    if (s) fromOffer.push(s);
  }
  if (Array.isArray(offer?.images)) {
    for (const im of offer.images) {
      const u = extractUrlFromImageEntry(im);
      const s = slideFromUrl(u, titleFallback);
      if (s) fromOffer.push(s);
    }
  }

  if (!fromOffer.length) {
    return base.length ? base : dedupeSlidesBySrc([]);
  }

  const seen = new Set();
  const merged = [];
  for (const s of [...fromOffer, ...base]) {
    if (!s?.src || seen.has(s.src)) continue;
    seen.add(s.src);
    merged.push(s);
  }
  return merged.length ? merged : base;
}

function extractUrlFromImageEntry(im) {
  if (!im) return "";
  if (typeof im === "string") return im.trim();
  return (
    im?.url ??
    im?.src ??
    im?.imageURL ??
    im?.imageUrl ??
    ""
  ).trim();
}

function dedupeSlidesBySrc(slides) {
  const seen = new Set();
  const res = [];
  for (const s of slides) {
    if (!s?.src || seen.has(s.src)) continue;
    seen.add(s.src);
    res.push({ src: s.src, alt: s.alt ?? "" });
  }
  return res;
}

export function collectGalleryUrlsFromOffer(offer, product) {
  return collectGallerySlides(offer, product, "ua").map((s) => s.src);
}
