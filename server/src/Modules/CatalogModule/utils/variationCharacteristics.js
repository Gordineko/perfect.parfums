import slugifyLib from "slugify";

export const VARIATION_AXIS_BINDINGS = {
  variant: {
    metaKey: "variant",
    title: localized("Варіант", "Variant"),
    type: "select",
    unit: null,
    scope: "offer",
  },
  A1: {
    metaKey: "color",
    title: localized("Колір", "Color"),
    type: "select",
    unit: null,
    scope: "offer",
  },
  A2: {
    metaKey: "insoleSize",
    title: localized("Розмір устілки", "Insole size"),
    type: "number",
    unit: "cm",
    scope: "offer",
  },
  A3: {
    metaKey: "heelType",
    title: localized("Форма підборів", "Heel shape"),
    type: "select",
    unit: null,
    scope: "offer",
  },
  A4: {
    metaKey: "heelHeight",
    title: localized("Висота підборів", "Heel height"),
    type: "number",
    unit: "cm",
    scope: "offer",
  },
  A5: {
    metaKey: "soleType",
    title: localized("Тип підошви", "Sole type"),
    type: "select",
    unit: null,
    scope: "offer",
  },
  A6: {
    metaKey: "size",
    title: localized("Розмір", "Size"),
    type: "select",
    unit: null,
    scope: "offer",
  },
  A7: {
    metaKey: "material",
    title: localized("Матеріал", "Material"),
    type: "select",
    unit: null,
    scope: "offer",
  },
};

const CHARACTERISTIC_KEY_ALIASES = new Map([
  ["heelheight", "heelHeight"],
  ["heel_height", "heelHeight"],
  ["sole", "soleType"],
  ["color", "color"],
  ["material", "material"],
  ["size", "size"],
  ["variant", "variant"],
  ["a1", "color"],
  ["a2", "insoleSize"],
  ["a3", "heelType"],
  ["a4", "heelHeight"],
  ["a5", "soleType"],
  ["a6", "size"],
  ["a7", "material"],
]);

const COLOR_VALUE_MAP = new Map([
  ["чорний", { value: "black", label: localized("Чорний", "Black") }],
  ["черный", { value: "black", label: localized("Чорний", "Black") }],
  ["black", { value: "black", label: localized("Чорний", "Black") }],
  ["білий", { value: "white", label: localized("Білий", "White") }],
  ["бiлий", { value: "white", label: localized("Білий", "White") }],
  ["белый", { value: "white", label: localized("Білий", "White") }],
  ["white", { value: "white", label: localized("Білий", "White") }],
  ["червоний", { value: "red", label: localized("Червоний", "Red") }],
  ["красный", { value: "red", label: localized("Червоний", "Red") }],
  ["red", { value: "red", label: localized("Червоний", "Red") }],
  ["бежевий", { value: "beige", label: localized("Бежевий", "Beige") }],
  ["бежевый", { value: "beige", label: localized("Бежевий", "Beige") }],
  ["beige", { value: "beige", label: localized("Бежевий", "Beige") }],
  ["срібний", { value: "silver", label: localized("Срібний", "Silver") }],
  ["серебряный", { value: "silver", label: localized("Срібний", "Silver") }],
  ["silver", { value: "silver", label: localized("Срібний", "Silver") }],
  ["рожевий", { value: "pink", label: localized("Рожевий", "Pink") }],
  ["розовый", { value: "pink", label: localized("Рожевий", "Pink") }],
  ["pink", { value: "pink", label: localized("Рожевий", "Pink") }],
  ["золотий", { value: "gold", label: localized("Золотий", "Gold") }],
  ["золотой", { value: "gold", label: localized("Золотий", "Gold") }],
  ["gold", { value: "gold", label: localized("Золотий", "Gold") }],
  ["прозорий", { value: "transparent", label: localized("Прозорий", "Transparent") }],
  ["прозрачный", { value: "transparent", label: localized("Прозорий", "Transparent") }],
  ["transparent", { value: "transparent", label: localized("Прозорий", "Transparent") }],
  ["сірий", { value: "grey", label: localized("Сірий", "Grey") }],
  ["сіірий", { value: "grey", label: localized("Сірий", "Grey") }],
  ["серый", { value: "grey", label: localized("Сірий", "Grey") }],
  ["grey", { value: "grey", label: localized("Сірий", "Grey") }],
  ["gray", { value: "grey", label: localized("Сірий", "Grey") }],
  ["шоколад", { value: "shokolad", label: localized("Шоколад", "Chocolate") }],
  ["шоколадный", { value: "shokolad", label: localized("Шоколад", "Chocolate") }],
  ["лимонний", { value: "lymonnyy", label: localized("Лимонний", "Lemon") }],
  ["лимонні", { value: "lymonnyy", label: localized("Лимонний", "Lemon") }],
  ["лимонный", { value: "lymonnyy", label: localized("Лимонний", "Lemon") }],
  ["lymonnyy", { value: "lymonnyy", label: localized("Лимонний", "Lemon") }],
  ["lymonni", { value: "lymonnyy", label: localized("Лимонний", "Lemon") }],
  ["лимонно жовтий", { value: "lymonno-zhovtyy", label: localized("Лимонно-жовтий", "Lemon yellow") }],
  ["лимонно желтый", { value: "lymonno-zhovtyy", label: localized("Лимонно-жовтий", "Lemon yellow") }],
  ["lymonno zhovtyy", { value: "lymonno-zhovtyy", label: localized("Лимонно-жовтий", "Lemon yellow") }],
  ["бордовий", { value: "bordovyy", label: localized("Бордовий", "Burgundy") }],
  ["бордовый", { value: "bordovyy", label: localized("Бордовий", "Burgundy") }],
  ["бордовые", { value: "bordovyy", label: localized("Бордовий", "Burgundy") }],
  ["bordovyy", { value: "bordovyy", label: localized("Бордовий", "Burgundy") }],
  ["bordovye", { value: "bordovyy", label: localized("Бордовий", "Burgundy") }],
  ["голубий", { value: "holubyy", label: localized("Голубий", "Blue") }],
  ["голубой", { value: "holubyy", label: localized("Голубий", "Blue") }],
  ["holubyy", { value: "holubyy", label: localized("Голубий", "Blue") }],
  ["оранжевий", { value: "oranzhevyy", label: localized("Оранжевий", "Orange") }],
  ["оранжевый", { value: "oranzhevyy", label: localized("Оранжевий", "Orange") }],
  ["oranzhevyy", { value: "oranzhevyy", label: localized("Оранжевий", "Orange") }],
  ["бірюза", { value: "byryuza", label: localized("Бірюза", "Turquoise") }],
  ["бирюза", { value: "byryuza", label: localized("Бірюза", "Turquoise") }],
  ["byryuza", { value: "byryuza", label: localized("Бірюза", "Turquoise") }],
  ["коричневий", { value: "brown", label: localized("Коричневий", "Brown") }],
  ["коричневый", { value: "brown", label: localized("Коричневий", "Brown") }],
  ["brown", { value: "brown", label: localized("Коричневий", "Brown") }],
  ["зелений", { value: "green", label: localized("Зелений", "Green") }],
  ["зеленый", { value: "green", label: localized("Зелений", "Green") }],
  ["green", { value: "green", label: localized("Зелений", "Green") }],
  ["жовтий", { value: "yellow", label: localized("Жовтий", "Yellow") }],
  ["желтый", { value: "yellow", label: localized("Жовтий", "Yellow") }],
  ["yellow", { value: "yellow", label: localized("Жовтий", "Yellow") }],
  ["ліловий", { value: "purple", label: localized("Ліловий", "Purple") }],
  ["лиловый", { value: "purple", label: localized("Ліловий", "Purple") }],
  ["purple", { value: "purple", label: localized("Ліловий", "Purple") }],
  ["синій", { value: "blue", label: localized("Синій", "Blue") }],
  ["синий", { value: "blue", label: localized("Синій", "Blue") }],
  ["blue", { value: "blue", label: localized("Синій", "Blue") }],
]);

const HEEL_TYPE_MAP = new Map([
  ["прямий", { value: "straight", label: localized("Прямий", "Straight") }],
  ["прямой", { value: "straight", label: localized("Прямий", "Straight") }],
  ["straight", { value: "straight", label: localized("Прямий", "Straight") }],
  ["чарка", { value: "flare", label: localized("Чарка", "Flare") }],
  ["рюмка", { value: "flare", label: localized("Чарка", "Flare") }],
  ["flare", { value: "flare", label: localized("Чарка", "Flare") }],
  ["трикутник", { value: "triangle", label: localized("Трикутник", "Triangle") }],
  ["треугольник", { value: "triangle", label: localized("Трикутник", "Triangle") }],
  ["triangle", { value: "triangle", label: localized("Трикутник", "Triangle") }],
]);

const MATERIAL_MAP = new Map([
  ["еко шкіра", { value: "synthetic", label: localized("Синтетика", "Synthetic") }],
  ["екошкіра", { value: "synthetic", label: localized("Синтетика", "Synthetic") }],
  ["синтетика", { value: "synthetic", label: localized("Синтетика", "Synthetic") }],
  ["synthetic", { value: "synthetic", label: localized("Синтетика", "Synthetic") }],
  ["натуральна шкіра", { value: "leather", label: localized("Натуральна шкіра", "Leather") }],
  ["натуральная кожа", { value: "leather", label: localized("Натуральна шкіра", "Leather") }],
  ["шкіра", { value: "leather", label: localized("Натуральна шкіра", "Leather") }],
  ["кожа", { value: "leather", label: localized("Натуральна шкіра", "Leather") }],
  ["leather", { value: "leather", label: localized("Натуральна шкіра", "Leather") }],
  ["сатин", { value: "satin", label: localized("Сатин", "Satin") }],
  ["satin", { value: "satin", label: localized("Сатин", "Satin") }],
  ["мікрофібра", { value: "microfiber", label: localized("Мікрофібра", "Microfiber") }],
  ["микрофибра", { value: "microfiber", label: localized("Мікрофібра", "Microfiber") }],
  ["microfiber", { value: "microfiber", label: localized("Мікрофібра", "Microfiber") }],
  ["замша", { value: "premium-suede", label: localized("Преміальна замша", "Premium Suede") }],
  ["замш", { value: "zamsh", label: localized("Замш", "Suede") }],
  ["эко замш", { value: "eko-zamsh", label: localized("Еко-замш", "Eco suede") }],
  ["еко замш", { value: "eko-zamsh", label: localized("Еко-замш", "Eco suede") }],
  ["лак", { value: "lak", label: localized("Лак", "Patent") }],
]);

const SOLE_TEXTURE_MAP = new Map([
  ["ребрист", localized("ребриста", "ribbed")],
  ["rebryst", localized("ребриста", "ribbed")],
  ["гладк", localized("гладка", "smooth")],
  ["hladk", localized("гладка", "smooth")],
  ["замшев", localized("замшева", "suede")],
  ["zamshev", localized("замшева", "suede")],
]);

const SOLE_COLOR_MAP = new Map([
  ["беж", localized("Бежева", "Beige")],
  ["bezh", localized("Бежева", "Beige")],
  ["чорн", localized("Чорна", "Black")],
  ["черн", localized("Чорна", "Black")],
  ["chorn", localized("Чорна", "Black")],
  ["червон", localized("Червона", "Red")],
  ["chervon", localized("Червона", "Red")],
]);

const SOLE_TYPE_MAP = new Map([
  ["замшевий", { value: "suede", label: localized("Замшевий", "Suede") }],
  ["замшева", { value: "suede", label: localized("Замшевий", "Suede") }],
  ["suede", { value: "suede", label: localized("Замшевий", "Suede") }],
  ["звичайний", { value: "standard", label: localized("Звичайний", "Standard") }],
  ["обычный", { value: "standard", label: localized("Звичайний", "Standard") }],
  ["standard", { value: "standard", label: localized("Звичайний", "Standard") }],
  ["роздільний", { value: "split", label: localized("Роздільний", "Split") }],
  ["split", { value: "split", label: localized("Роздільний", "Split") }],
]);

function buildCanonicalOptionLookup(sourceMap) {
  const lookup = new Map();

  for (const [rawKey, option] of sourceMap.entries()) {
    const canonical = cloneSelectOption(option, rawKey);
    const candidates = [rawKey, option?.value, option?.label?.ua, option?.label?.en];

    for (const candidate of candidates) {
      const normalized = normalizeLookupValue(candidate);
      if (!normalized || lookup.has(normalized)) continue;
      lookup.set(normalized, canonical);
    }
  }

  return lookup;
}

const COLOR_OPTION_LOOKUP = buildCanonicalOptionLookup(COLOR_VALUE_MAP);
const HEEL_TYPE_OPTION_LOOKUP = buildCanonicalOptionLookup(HEEL_TYPE_MAP);
const MATERIAL_OPTION_LOOKUP = buildCanonicalOptionLookup(MATERIAL_MAP);
const SOLE_TYPE_OPTION_LOOKUP = buildCanonicalOptionLookup(SOLE_TYPE_MAP);
export function localized(ua, en = ua) {
  return {
    ua: String(ua || "").trim(),
    en: String(en ?? ua ?? "").trim(),
  };
}

export function normalizeLocalizedText(value = {}) {
  return {
    ua: String(value?.ua || "").trim(),
    en: String(value?.en || "").trim(),
  };
}

function slugify(value) {
  return slugifyLib(String(value || ""), {
    lower: true,
    strict: true,
    trim: true,
    locale: "uk",
  });
}

function normalizeFilterLabel(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalizeFilterLabel(value) {
  const normalized = normalizeFilterLabel(value);
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function normalizeLocalizedLabel(label, fallback = "") {
  const rawUa = label?.ua ?? fallback;
  const rawEn = label?.en ?? rawUa;
  return localized(
    capitalizeFilterLabel(rawUa),
    capitalizeFilterLabel(rawEn)
  );
}

function cloneSelectOption(option, fallback = "") {
  return {
    value: String(option?.value ?? "").trim(),
    label: normalizeLocalizedLabel(option?.label, fallback || option?.value || ""),
  };
}

function normalizeLookupValue(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()'"`’]/g, " ")
    .replace(/[\/_.,;:+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toFiniteNumber(value, fallback = null) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeCharacteristicKey(key = "") {
  const rawKey = String(key || "").trim();
  if (!rawKey) return "";
  return CHARACTERISTIC_KEY_ALIASES.get(rawKey.toLowerCase()) || rawKey;
}

export function getVariationAxisBinding(axisId = "") {
  return VARIATION_AXIS_BINDINGS[String(axisId || "").trim()] || null;
}

function makeCustomSelectValue(rawValue, fallbackEn = null) {
  const displayLabel = capitalizeFilterLabel(rawValue);
  const normalizedValue = slugify(normalizeLookupValue(rawValue)) || slugify(String(rawValue || ""));

  return {
    value: normalizedValue || "unknown",
    label: localized(
      displayLabel || String(rawValue || "").trim(),
      capitalizeFilterLabel(fallbackEn || displayLabel || rawValue || "")
    ),
  };
}

function resolveCanonicalSelectOption(rawValue, optionLookup = null, fallbackEn = null) {
  const candidates =
    rawValue && typeof rawValue === "object"
      ? [rawValue.value, rawValue.label?.ua, rawValue.label?.en]
      : [rawValue];

  for (const candidate of candidates) {
    const normalized = normalizeLookupValue(candidate);
    if (!normalized || !optionLookup?.has(normalized)) continue;
    return cloneSelectOption(optionLookup.get(normalized), candidate);
  }

  const fallback =
    rawValue && typeof rawValue === "object"
      ? rawValue.label?.ua || rawValue.value
      : rawValue;

  return makeCustomSelectValue(fallback, fallbackEn);
}

function resolveDisplayColorOption(rawValue) {
  const option = resolveCanonicalSelectOption(rawValue, COLOR_OPTION_LOOKUP);
  const rawDisplayValue =
    rawValue && typeof rawValue === "object"
      ? rawValue.label?.ua || rawValue.value || rawValue.label?.en
      : rawValue;
  const displayValue = String(
    option?.label?.ua || rawDisplayValue || option?.value || ""
  ).trim();
  const normalizedDisplayValue = capitalizeFilterLabel(displayValue);
  const fallbackValue = String(option?.value || "").trim();

  return {
    value: normalizedDisplayValue || fallbackValue || "unknown",
    label: localized(
      normalizedDisplayValue || fallbackValue || "unknown",
      String(option?.label?.en || normalizedDisplayValue || fallbackValue || "unknown").trim()
    ),
  };
}

function resolveCanonicalSoleType(rawValue) {
  const candidates =
    rawValue && typeof rawValue === "object"
      ? [rawValue.value, rawValue.label?.ua, rawValue.label?.en]
      : [rawValue];

  for (const candidate of candidates) {
    const normalized = normalizeLookupValue(candidate);
    if (!normalized || !SOLE_TYPE_OPTION_LOOKUP.has(normalized)) continue;
    return cloneSelectOption(SOLE_TYPE_OPTION_LOOKUP.get(normalized), candidate);
  }

  const source =
    rawValue && typeof rawValue === "object"
      ? rawValue.label?.ua || rawValue.value || rawValue.label?.en
      : rawValue;
  const normalized = normalizeLookupValue(source);
  if (!normalized) {
    return makeCustomSelectValue(source, source);
  }

  let color = null;
  let texture = null;

  for (const [needle, label] of SOLE_COLOR_MAP.entries()) {
    if (normalized.includes(needle)) {
      color = label;
      break;
    }
  }

  for (const [needle, label] of SOLE_TEXTURE_MAP.entries()) {
    if (normalized.includes(needle)) {
      texture = label;
      break;
    }
  }

  if (color || texture) {
    const ua = [color?.ua, texture?.ua].filter(Boolean).join(" ").trim();
    const en = [color?.en, texture?.en].filter(Boolean).join(" ").trim();
    return {
      value: slugify(ua || source),
      label: localized(ua || source, en || ua || source),
    };
  }

  return makeCustomSelectValue(source, source);
}

export function resolveCanonicalPresetForKey(key, rawValue) {
  const normalizedKey = normalizeCharacteristicKey(key);

  if (normalizedKey === "color") {
    return resolveCanonicalSelectOption(rawValue, COLOR_OPTION_LOOKUP);
  }

  if (normalizedKey === "heelType") {
    return resolveCanonicalSelectOption(rawValue, HEEL_TYPE_OPTION_LOOKUP);
  }

  if (normalizedKey === "soleType") {
    return resolveCanonicalSoleType(rawValue);
  }

  if (normalizedKey === "material") {
    return resolveCanonicalSelectOption(rawValue, MATERIAL_OPTION_LOOKUP);
  }

  return resolveCanonicalSelectOption(rawValue, null);
}

function resolveVariationAxisPresetForKey(key, rawValue) {
  const normalizedKey = normalizeCharacteristicKey(key);

  if (normalizedKey === "color") {
    return resolveDisplayColorOption(rawValue);
  }

  return resolveCanonicalPresetForKey(normalizedKey, rawValue);
}

export function normalizeVariationAxisDefinition(axis = {}) {
  const axisId = String(axis?.axisId || "").trim();
  const binding = getVariationAxisBinding(axisId);
  const type = binding?.type || axis?.type || "string";
  const unit = binding?.unit ?? axis?.unit ?? null;
  const title = normalizeLocalizedLabel(axis?.title, binding?.title?.ua || axisId);
  let valuesPreset = Array.isArray(axis?.valuesPreset) ? axis.valuesPreset : [];

  if (type === "select") {
    const seen = new Set();
    valuesPreset = valuesPreset
      .map((preset) => resolveVariationAxisPresetForKey(binding?.metaKey || axisId, preset))
      .filter((preset) => {
        const signature = String(preset?.value || "").trim();
        if (!signature || seen.has(signature)) return false;
        seen.add(signature);
        return true;
      })
      .map((preset) => ({
        ...preset,
        label: normalizeLocalizedLabel(preset?.label, preset?.value),
      }));
  }

  return {
    ...axis,
    axisId,
    title,
    type,
    unit,
    valuesPreset,
  };
}

export function normalizeVariationAxesDefinitions(variationAxes = []) {
  return (variationAxes || [])
    .filter((axis) => axis?.axisId)
    .map(normalizeVariationAxisDefinition);
}

function normalizeSelectScalarByKey(key, rawValue) {
  if (normalizeCharacteristicKey(key) === "color") {
    return resolveDisplayColorOption(rawValue)?.value ?? null;
  }

  const option = resolveCanonicalPresetForKey(key, rawValue);
  return option?.value ?? null;
}

export function normalizeCharacteristicEntry(item = {}) {
  const key = normalizeCharacteristicKey(item?.key || "");
  const type = item?.type || "string";
  const unit = item?.unit ?? null;

  if (type === "multiselect") {
    const values = Array.isArray(item?.values)
      ? item.values
          .map((value) => {
            if (["color", "soleType", "heelType", "material", "size", "variant"].includes(key)) {
              return normalizeSelectScalarByKey(key, value);
            }

            return value ?? null;
          })
          .filter((value) => value !== undefined && value !== null && value !== "")
      : [];

    return {
      key,
      type,
      unit,
      value: null,
      values,
    };
  }

  let value = item?.value ?? null;

  if (value !== null && ["select", "string"].includes(type)) {
    if (["color", "soleType", "heelType", "material", "size", "variant"].includes(key)) {
      value = normalizeSelectScalarByKey(key, value);
    } else if (type === "string") {
      value = String(
        value && typeof value === "object"
          ? value.ua || value.en || value.value || ""
          : value
      ).trim();
    }
  }

  if (value !== null && type === "number") {
    const normalizedNumber = toFiniteNumber(value, null);
    value = normalizedNumber ?? value;
  }

  if (value !== null && type === "boolean") {
    value = Boolean(value);
  }

  return {
    key,
    type,
    unit,
    value,
    values: Array.isArray(item?.values)
      ? item.values.filter((entry) => entry !== undefined && entry !== null)
      : [],
  };
}

export function mergeCharacteristicPresets(existingPresets = [], incomingPresets = [], key = "") {
  const seen = new Set();
  const result = [];
  const normalizedKey = normalizeCharacteristicKey(key);

  for (const rawPreset of [...(existingPresets || []), ...(incomingPresets || [])]) {
    const preset =
      normalizedKey === "color"
        ? resolveDisplayColorOption(rawPreset)
        : resolveCanonicalPresetForKey(normalizedKey, rawPreset);
    const signature = String(preset?.value || "").trim();
    if (!signature || seen.has(signature)) continue;
    seen.add(signature);

    const canonicalLabel = normalizeLocalizedLabel(preset?.label, preset?.value);
    const preservedLabel =
      rawPreset && typeof rawPreset === "object"
        ? normalizeLocalizedLabel(rawPreset.label, rawPreset.value || preset?.value)
        : null;

    result.push({
      ...preset,
      label: {
        ua: preservedLabel?.ua || canonicalLabel.ua,
        en:
          preservedLabel?.en && preservedLabel.en !== preservedLabel.ua
            ? preservedLabel.en
            : canonicalLabel.en,
      },
    });
  }

  return result;
}

export function buildCharacteristicMetaFromVariationAxis(axis, existingMeta = null) {
  const normalizedAxis = normalizeVariationAxisDefinition(axis);
  const binding = getVariationAxisBinding(normalizedAxis.axisId);
  const key = normalizeCharacteristicKey(binding?.metaKey || normalizedAxis.axisId);
  const previousValuesPreset = Array.isArray(existingMeta?.valuesPreset) ? existingMeta.valuesPreset : [];

  return {
    key,
    title: normalizeLocalizedLabel(normalizedAxis.title, binding?.title?.ua || key),
    type: normalizedAxis.type || binding?.type || existingMeta?.type || "string",
    unit: normalizedAxis.unit ?? binding?.unit ?? existingMeta?.unit ?? null,
    valuesPreset: mergeCharacteristicPresets(previousValuesPreset, normalizedAxis.valuesPreset, key),
    scope: binding?.scope || existingMeta?.scope || "offer",
    filterable: existingMeta?.filterable ?? true,
    searchable: existingMeta?.searchable ?? false,
    sort: existingMeta?.sort ?? 0,
    status: existingMeta?.status || "active",
  };
}

export function normalizeCharacteristicMetaEntry(meta = {}) {
  const key = normalizeCharacteristicKey(meta?.key || "");
  return {
    ...meta,
    key,
    title: normalizeLocalizedLabel(meta?.title, key),
    valuesPreset: mergeCharacteristicPresets([], meta?.valuesPreset || [], key),
  };
}

export function normalizeOptionMapByVariationAxes(variationAxes = [], rawOptionMap = {}) {
  const normalizedAxes = normalizeVariationAxesDefinitions(variationAxes);
  const result = {};

  for (const axis of normalizedAxes) {
    const binding = getVariationAxisBinding(axis.axisId);
    const rawValue = rawOptionMap?.[axis.axisId];
    if (rawValue === undefined || rawValue === null || rawValue === "") continue;

    if (axis.type === "number") {
      result[axis.axisId] = toFiniteNumber(rawValue, rawValue);
      continue;
    }

    if (axis.type === "select") {
      result[axis.axisId] = resolveVariationAxisPresetForKey(
        binding?.metaKey || axis.axisId,
        rawValue
      )?.value ?? null;
      continue;
    }

    result[axis.axisId] = String(rawValue).trim();
  }

  return result;
}

export function buildDerivedOfferCharacteristics(variationAxes = [], optionMap = {}, existingCharacteristics = []) {
  const normalizedAxes = normalizeVariationAxesDefinitions(variationAxes);
  const derived = [];

  for (const axis of normalizedAxes) {
    const binding = getVariationAxisBinding(axis.axisId);
    const key = normalizeCharacteristicKey(binding?.metaKey || axis.axisId);
    const rawValue = optionMap?.[axis.axisId];
    if (rawValue === undefined || rawValue === null || rawValue === "") continue;

    if (axis.type === "number") {
      derived.push({
        key,
        type: "number",
        unit: axis.unit ?? null,
        value: toFiniteNumber(rawValue, rawValue),
        values: [],
      });
      continue;
    }

    if (axis.type === "select") {
      derived.push({
        key,
        type: "select",
        unit: axis.unit ?? null,
        value: normalizeSelectScalarByKey(key, rawValue),
        values: [],
      });
      continue;
    }

    derived.push({
      key,
      type: "string",
      unit: axis.unit ?? null,
      value: String(rawValue).trim(),
      values: [],
    });
  }

  const derivedKeys = new Set(derived.map((item) => item.key));
  const manual = (existingCharacteristics || [])
    .map(normalizeCharacteristicEntry)
    .filter((item) => !derivedKeys.has(item.key));

  return [...manual, ...derived].map(normalizeCharacteristicEntry);
}