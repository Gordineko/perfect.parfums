import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import slugifyLib from "slugify";
import xlsx from "xlsx";

import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ReviewModel } from "../Modules/ReviewModule/Models/Review.model.js";
import { Warehouse } from "../Modules/InventoryModule/Models/Warehouse.model.js";
import { CharacteristicMeta } from "../Modules/CatalogModule/Models/CharacteristicMeta.model.js";
import {
  mergeAxisPresetValues,
  mergeVariationTemplateAxes,
} from "../Modules/CatalogModule/utils/variationTemplate.js";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const CLI_ARGS = new Set(process.argv.slice(2));
const DRY_RUN = CLI_ARGS.has("--write")
  ? false
  : String(process.env.DRY_RUN || "true").toLowerCase() !== "false";
const VERBOSE = CLI_ARGS.has("--verbose");
const STRICT_CATEGORY_MAP = CLI_ARGS.has("--strict-category-map");
const WORKBOOK_PATH =
  process.env.KEYCRM_XLSX_PATH || path.resolve(process.cwd(), "keycrm-export.xlsx");

const BRAND = "WOH";
const DEFAULT_TARGET_CATEGORY_SLUG = process.env.KEYCRM_DEFAULT_TARGET_CATEGORY || "high-heels";
const TARGET_CATEGORY_ROOTS = new Map([
  ["high-heels", "dance-heels"],
  ["virtual-heels", "virtual-heels"],
]);
const SOURCE_CATEGORY_TARGET_MAP = new Map(
  Object.entries(safeJsonParse(process.env.KEYCRM_SOURCE_CATEGORY_MAP, {}))
);
const VIRTUAL_HEELS_KEYWORDS = [
  "virtual",
  "вірту",
  "вирту",
  "топ",
  "шорт",
  "юбк",
  "спідниц",
  "body",
  "боді",
  "комплект",
  "сет",
  "портупея",
  "гартер",
];
const HIGH_HEELS_KEYWORDS = [
  "ботфорт",
  "босон",
  "туф",
  "чоб",
  "лодоч",
  "heels",
  "хілс",
  "hil",
  "ankle",
  "сапог",
  "черев",
];

const SIZE_TO_INSOLE = new Map([
  [34, 22.5],
  [35, 23],
  [36, 23.5],
  [37, 24],
  [38, 24.5],
  [39, 25],
  [40, 25.5],
  [41, 26],
  [42, 26.5],
  [43, 27],
]);

const PROPERTY_ALIASES = {
  color: new Set(["колір", "цвет", "color"]),
  size: new Set(["розмір", "размер", "size"]),
  insoleSize: new Set(["розмір стельки", "размер стельки", "insole size"]),
  heelDescriptor: new Set([
    "форма/висота підборів",
    "форма/высота каблука",
    "форма высота каблука",
    "heel type/height",
  ]),
  heelType: new Set(["тип каблука", "тип каблука ", "тип каблука/форма", "heel type"]),
  heelHeight: new Set([
    "довжина каблука",
    "висота підборів",
    "высота каблука",
    "heel height",
  ]),
  soleType: new Set(["тип підошви", "тип подошвы", "sole type"]),
  material: new Set(["матеріал", "материал", "material"]),
};

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
  ["серый", { value: "grey", label: localized("Сірий", "Grey") }],
  ["grey", { value: "grey", label: localized("Сірий", "Grey") }],
  ["gray", { value: "grey", label: localized("Сірий", "Grey") }],
  ["шоколад", { value: "shokolad", label: localized("Шоколад", "Chocolate") }],
]);

const COLOR_FAMILY_RULES = [
  { matcher: /^(чорн|черн)/, value: "black" },
  { matcher: /^(біл|бiл|бел)/, value: "white" },
  { matcher: /^(червон|красн)/, value: "red" },
  { matcher: /^беж/, value: "beige" },
  { matcher: /^(срібн|срiбн|серебр)/, value: "silver" },
  { matcher: /^(рожев|розов)/, value: "pink" },
  { matcher: /^золот/, value: "gold" },
  { matcher: /^прозор/, value: "transparent" },
  { matcher: /^(сір|сiр|сер(?!еб))/, value: "grey" },
  { matcher: /^шоколад/, value: "shokolad" },
];

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
  ["suede", { value: "premium-suede", label: localized("Преміальна замша", "Premium Suede") }],
]);

const DEFAULT_SUBTITLE = localized(
  "Професійні танцювальні хилси для тренувань та виступів",
  "Professional dance heels for training and stage work"
);

const AXIS_META_OVERRIDES = {
  A1: {
    axisId: "A1",
    title: localized("Колір", "Color"),
    type: "select",
    unit: null,
  },
  A2: {
    axisId: "A2",
    title: localized("Розмір устілки", "Insole size"),
    type: "number",
    unit: "cm",
  },
  A3: {
    axisId: "A3",
    title: localized("Форма підборів", "Heel shape"),
    type: "select",
    unit: null,
  },
  A4: {
    axisId: "A4",
    title: localized("Висота підборів", "Heel height"),
    type: "number",
    unit: "cm",
  },
  A5: {
    axisId: "A5",
    title: localized("Тип підошви", "Sole type"),
    type: "select",
    unit: null,
  },
  A6: {
    axisId: "A6",
    title: localized("Розмір", "Size"),
    type: "select",
    unit: null,
  },
  A7: {
    axisId: "A7",
    title: localized("Матеріал", "Material"),
    type: "select",
    unit: null,
  },
};

function localized(ua, en = ua) {
  return {
    ua: String(ua || "").trim(),
    en: String(en ?? ua ?? "").trim(),
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

function titleCase(value) {
  return String(value || "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function normalizeLocalizedLabel(label, fallback = "") {
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

function toFiniteNumber(value, fallback = 0) {
  const num = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(num) ? num : fallback;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];

  for (const item of values) {
    const value = String(item || "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

function safeJsonParse(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function normalizePropertyName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
const SOLE_TYPE_OPTION_LOOKUP = buildCanonicalOptionLookup(SOLE_TYPE_MAP);
const MATERIAL_OPTION_LOOKUP = buildCanonicalOptionLookup(MATERIAL_MAP);

const COLOR_CANONICAL_BY_VALUE = new Map(
  [...COLOR_VALUE_MAP.values()].map((option) => [String(option.value), cloneSelectOption(option, option.value)])
);

function resolveCanonicalColorFamily(rawValue) {
  const candidates =
    rawValue && typeof rawValue === "object"
      ? [rawValue.label?.ua, rawValue.label?.en, rawValue.value]
      : [rawValue];

  for (const candidate of candidates) {
    const normalized = normalizeLookupValue(candidate);
    if (!normalized || normalized.includes(" ")) continue;

    for (const rule of COLOR_FAMILY_RULES) {
      if (!rule.matcher.test(normalized)) continue;
      const option = COLOR_CANONICAL_BY_VALUE.get(rule.value);
      if (option) return cloneSelectOption(option, candidate);
    }
  }

  return null;
}

function resolveCanonicalSelectOption(rawValue, optionLookup = null) {
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

  return makeCustomSelectValue(fallback);
}

function makeCustomSelectValue(rawValue) {
  const normalizedSource = normalizeLookupValue(rawValue);
  const displayLabel = capitalizeFilterLabel(rawValue);
  const normalizedValue = slugify(normalizedSource) || slugify(String(rawValue).replace(/[^\p{L}\p{N}]+/gu, " "));
  const value = normalizedValue || "unknown";
  return {
    value,
    label: localized(displayLabel || String(rawValue || "").trim(), displayLabel || titleCase(value.replace(/-/g, " "))),
  };
}

function makeSelectCharacteristic(key, rawValue, label, unit = null) {
  return {
    key,
    type: "select",
    unit,
    value: { value: rawValue, label: normalizeLocalizedLabel(label, rawValue) },
    values: [],
  };
}

function makeStringCharacteristic(key, ua, en = ua, unit = null) {
  return {
    key,
    type: "string",
    unit,
    value: localized(ua, en),
    values: [],
  };
}

function makeBooleanCharacteristic(key, boolValue) {
  return {
    key,
    type: "boolean",
    unit: null,
    value: {
      value: Boolean(boolValue),
      label: localized(String(Boolean(boolValue)), String(Boolean(boolValue))),
    },
    values: [],
  };
}

function makeNumberCharacteristic(key, value, unit = null) {
  return {
    key,
    type: "number",
    unit,
    value: Number(value),
    values: [],
  };
}

function makeMultiCharacteristic(key, items, unit = null) {
  return {
    key,
    type: "multiselect",
    unit,
    value: null,
    values: items,
  };
}

function parseAttachments(row = {}) {
  const attachments = safeJsonParse(row.attachments_data, []);
  const values = Array.isArray(attachments) ? attachments : [];
  const urls = uniqueStrings([
    String(row.thumbnail_url || "").trim(),
    ...values.map((item) => String(item || "").trim()),
  ]);

  return urls;
}

function parseOfferProperties(value) {
  const parsed = safeJsonParse(value, []);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => ({
      name: String(item?.name || "").trim(),
      value: String(item?.value || "").trim(),
    }))
    .filter((item) => item.name && item.value);
}

function buildRawPropertySignature(properties = []) {
  return JSON.stringify(
    [...properties]
      .map((item) => ({
        name: String(item?.name || "").trim(),
        value: String(item?.value || "").trim(),
      }))
      .filter((item) => item.name && item.value)
      .sort((left, right) => {
        const nameDiff = left.name.localeCompare(right.name);
        if (nameDiff !== 0) return nameDiff;
        return left.value.localeCompare(right.value);
      })
  );
}

function buildRawPropertyMap(properties = []) {
  const result = {};

  for (const item of properties) {
    const key = normalizePropertyName(item?.name);
    const value = String(item?.value || "").trim();
    if (!key || !value) continue;
    result[key] = value;
  }

  return result;
}

function parseProductCharacteristicsMap(value) {
  const parsed = safeJsonParse(value, {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  return Object.fromEntries(
    Object.entries(parsed)
      .map(([key, rawValue]) => {
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];
        const normalizedValues = values
          .map((item) => String(item || "").trim())
          .filter(Boolean);
        return [String(key || "").trim(), normalizedValues];
      })
      .filter(([key, values]) => key && values.length)
  );
}

function buildPropertyLookup({ productCharacteristics = {}, offerProperties = [], fallbackName = "" }) {
  const lookup = new Map();

  for (const [rawName, rawValues] of Object.entries(productCharacteristics || {})) {
    const key = normalizePropertyName(rawName);
    const values = Array.isArray(rawValues)
      ? rawValues.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    if (key && values.length) {
      lookup.set(key, { rawName, values });
    }
  }

  for (const item of offerProperties) {
    const key = normalizePropertyName(item.name);
    if (!key) continue;
    lookup.set(key, { rawName: item.name, values: [item.value] });
  }

  const extractedSize = extractTrailingSize(fallbackName);
  if (extractedSize != null && !lookup.has(normalizePropertyName("Розмір"))) {
    lookup.set(normalizePropertyName("Розмір"), {
      rawName: "Розмір",
      values: [String(extractedSize)],
    });
  }

  return lookup;
}

function getLookupEntry(lookup, aliases) {
  for (const alias of aliases) {
    const key = normalizePropertyName(alias);
    if (lookup.has(key)) {
      return { key, entry: lookup.get(key) };
    }
  }

  return null;
}

function extractTrailingSize(name = "") {
  const match = String(name || "").match(/(\d+(?:[.,]\d+)?)\s*$/u);
  if (!match) return null;
  return toFiniteNumber(match[1], null);
}

function normalizeColor(rawValue) {
  return resolveCanonicalColorFamily(rawValue)
    || resolveCanonicalSelectOption(rawValue, COLOR_OPTION_LOOKUP);
}

function normalizeHeelType(rawValue) {
  return resolveCanonicalSelectOption(rawValue, HEEL_TYPE_OPTION_LOOKUP);
}

function normalizeSoleType(rawValue) {
  return resolveCanonicalSelectOption(rawValue, SOLE_TYPE_OPTION_LOOKUP);
}

function normalizeMaterial(rawValue) {
  return resolveCanonicalSelectOption(rawValue, MATERIAL_OPTION_LOOKUP);
}

function normalizeSizeValue(rawValue) {
  const numeric = toFiniteNumber(rawValue, null);
  if (numeric == null) return null;
  if (numeric >= 22 && numeric <= 27) return numeric;
  if (SIZE_TO_INSOLE.has(numeric)) return SIZE_TO_INSOLE.get(numeric);
  return numeric;
}

function normalizeGenericSizeValue(rawValue) {
  const value = normalizeFilterLabel(rawValue);
  if (!value) return null;
  return makeCustomSelectValue(value);
}

function normalizeAxisPresetValue(axisId, preset) {
  if (!preset || typeof preset !== "object") return preset;

  if (axisId === "A1") {
    return normalizeColor({ value: preset.value, label: preset.label });
  }

  const optionLookup = {
    A3: HEEL_TYPE_OPTION_LOOKUP,
    A5: SOLE_TYPE_OPTION_LOOKUP,
    A7: MATERIAL_OPTION_LOOKUP,
  }[axisId] || null;

  return resolveCanonicalSelectOption(
    { value: preset.value, label: preset.label },
    optionLookup
  );
}

function normalizeVariationAxesForFilters(variationAxes = []) {
  return (variationAxes || [])
    .filter((axis) => axis?.axisId)
    .map((axis) => {
      const axisId = String(axis.axisId);
      const axisOverride = AXIS_META_OVERRIDES[axisId] || null;
      const axisType = axisOverride?.type || axis?.type || "string";

      let valuesPreset = Array.isArray(axis?.valuesPreset) ? axis.valuesPreset : [];
      if (axisType === "select") {
        const deduped = [];
        const seen = new Set();

        for (const rawPreset of valuesPreset) {
          const preset = normalizeAxisPresetValue(axisId, rawPreset);
          const presetKey = String(preset?.value ?? "").trim();
          if (!presetKey || seen.has(presetKey)) continue;
          seen.add(presetKey);
          deduped.push(preset);
        }

        valuesPreset = deduped.map((preset) => ({
          ...preset,
          label: normalizeLocalizedLabel(preset?.label, preset?.value),
        }));
      }

      return {
        ...axis,
        title: axisOverride?.title || axis?.title || localized(axisId, axisId),
        type: axisType,
        unit: axisOverride?.unit ?? axis?.unit ?? null,
        valuesPreset,
      };
    });
}

function normalizeVariationAxesForStorage(variationAxes = []) {
  return (variationAxes || []).map((axis) => ({
    ...axis,
    title: normalizeLocalizedLabel(axis?.title, axis?.axisId),
    valuesPreset: Array.isArray(axis?.valuesPreset)
      ? axis.valuesPreset.map((preset) => {
          if (!preset || typeof preset !== "object") return preset;
          return {
            ...preset,
            label: normalizeLocalizedLabel(preset?.label, preset?.value),
          };
        })
      : [],
  }));
}

function normalizeCharacteristicMetaPreset(key, preset) {
  if (!preset || typeof preset !== "object") return preset;

  if (key === "color") {
    return normalizeColor({ value: preset.value, label: preset.label });
  }

  if (key === "heelType") {
    return normalizeHeelType({ value: preset.value, label: preset.label });
  }

  if (key === "soleType") {
    return normalizeSoleType({ value: preset.value, label: preset.label });
  }

  if (key === "material") {
    return normalizeMaterial({ value: preset.value, label: preset.label });
  }

  return {
    ...preset,
    value: String(preset.value ?? "").trim(),
    label: normalizeLocalizedLabel(preset?.label, preset?.value),
  };
}

function normalizeCharacteristicMetaValuesPreset(key, valuesPreset = []) {
  const result = [];
  const seen = new Set();

  for (const rawPreset of valuesPreset || []) {
    const preset = normalizeCharacteristicMetaPreset(key, rawPreset);
    const signature =
      preset && typeof preset === "object"
        ? String(preset.value ?? "").trim()
        : String(preset ?? "").trim();

    if (!signature || seen.has(signature)) continue;
    seen.add(signature);
    result.push(preset);
  }

  return result;
}

function parseHeelDescriptor(rawValue) {
  const source = String(rawValue || "").trim();
  if (!source) {
    return { heelType: null, heelHeight: null };
  }

  const normalized = normalizeLookupValue(source);
  let heelType = null;

  for (const [needle, mapped] of HEEL_TYPE_MAP.entries()) {
    if (normalized.includes(needle)) {
      heelType = mapped;
      break;
    }
  }

  const numberMatch = source.match(/(\d+(?:[.,]\d+)?)/u);
  const heelHeight = numberMatch ? toFiniteNumber(numberMatch[1], null) : null;
  const textPart = normalized
    .replace(/\d+(?:[.,]\d+)?/gu, " ")
    .replace(/\b(см|cm)\b/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!heelType && textPart) {
    heelType = makeCustomSelectValue(textPart);
  }

  return {
    heelType,
    heelHeight,
  };
}

function stripStandaloneTitleVariant(name = "") {
  return String(name || "")
    .replace(/\s+\d+(?:[.,]\d+)?\s*$/u, "")
    .trim();
}

function deriveStandaloneGroupKey(product = {}) {
  const sku = String(product.sku || "").trim();
  if (sku) {
    const parts = sku.split("-").filter(Boolean);
    if (parts.length > 1) {
      return parts.slice(0, -1).join("-");
    }
  }

  return slugify(stripStandaloneTitleVariant(product.name || `product-${product.id}`));
}

function buildAxisOptionKey(variationAxes = [], optionMap = {}) {
  if (!variationAxes.length) return "default";
  return variationAxes.map((axis) => `${axis.axisId}:${String(optionMap[axis.axisId])}`).join("|");
}

function buildGallery(imageUrls = [], titleText = "") {
  return uniqueStrings(imageUrls).map((url, index) => ({
    url,
    alt: localized(
      index === 0 ? titleText : `${titleText} фото ${index + 1}`,
      index === 0 ? titleText : `${titleText} photo ${index + 1}`
    ),
    sort: index,
    isMain: index === 0,
  }));
}

function resolveTargetCategorySlug(product = {}) {
  const sourceCategoryId = product.category_id == null ? null : String(product.category_id);
  const title = String(product.name || "");
  const haystack = `${sourceCategoryId || ""} ${title}`.toLowerCase();

  if (sourceCategoryId && SOURCE_CATEGORY_TARGET_MAP.has(sourceCategoryId)) {
    return SOURCE_CATEGORY_TARGET_MAP.get(sourceCategoryId);
  }

  if (VIRTUAL_HEELS_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "virtual-heels";
  }

  if (HIGH_HEELS_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return "high-heels";
  }

  return DEFAULT_TARGET_CATEGORY_SLUG;
}

function buildAxisStateFromLookup(lookup, sourceName) {
  const consumed = new Set();

  const colorMatch = getLookupEntry(lookup, PROPERTY_ALIASES.color);
  const sizeMatch = getLookupEntry(lookup, PROPERTY_ALIASES.insoleSize) || getLookupEntry(lookup, PROPERTY_ALIASES.size);
  const heelDescriptorMatch = getLookupEntry(lookup, PROPERTY_ALIASES.heelDescriptor);
  const heelTypeMatch = getLookupEntry(lookup, PROPERTY_ALIASES.heelType);
  const heelHeightMatch = getLookupEntry(lookup, PROPERTY_ALIASES.heelHeight);
  const soleTypeMatch = getLookupEntry(lookup, PROPERTY_ALIASES.soleType);
  const materialMatch = getLookupEntry(lookup, PROPERTY_ALIASES.material);

  const heelDescriptor = heelDescriptorMatch ? parseHeelDescriptor(heelDescriptorMatch.entry.values[0]) : null;

  if (colorMatch) consumed.add(colorMatch.key);
  if (sizeMatch) consumed.add(sizeMatch.key);
  if (heelDescriptorMatch) consumed.add(heelDescriptorMatch.key);
  if (heelTypeMatch) consumed.add(heelTypeMatch.key);
  if (heelHeightMatch) consumed.add(heelHeightMatch.key);
  if (soleTypeMatch) consumed.add(soleTypeMatch.key);
  if (materialMatch) consumed.add(materialMatch.key);

  const color = colorMatch ? normalizeColor(colorMatch.entry.values[0]) : null;
  const rawSize = sizeMatch ? String(sizeMatch.entry.values[0] || "").trim() : "";
  const size = sizeMatch ? normalizeSizeValue(rawSize) : extractTrailingSize(sourceName);
  const genericSize = size == null && rawSize ? normalizeGenericSizeValue(rawSize) : null;

  const heelType = heelTypeMatch
    ? normalizeHeelType(heelTypeMatch.entry.values[0])
    : heelDescriptor?.heelType || null;
  const heelHeight = heelHeightMatch
    ? toFiniteNumber(heelHeightMatch.entry.values[0], null)
    : heelDescriptor?.heelHeight || null;

  const soleType = soleTypeMatch ? normalizeSoleType(soleTypeMatch.entry.values[0]) : null;
  const material = materialMatch ? normalizeMaterial(materialMatch.entry.values[0]) : normalizeMaterial("Синтетика");

  return {
    axisValues: {
      A1: color?.value ?? null,
      A2: size ?? null,
      A3: heelType?.value ?? null,
      A4: heelHeight ?? null,
      A5: soleType?.value ?? null,
    },
    axisLabels: {
      A1: color?.label ?? null,
      A3: heelType?.label ?? null,
      A5: soleType?.label ?? null,
    },
    extraAxisValues: {
      A6: genericSize?.value ?? null,
      A7: materialMatch ? material?.value ?? null : null,
    },
    extraAxisLabels: {
      A6: genericSize?.label ?? null,
      A7: materialMatch ? material?.label ?? null : null,
    },
    material,
    unknownPropertyNames: [...lookup.keys()].filter((key) => !consumed.has(key)),
  };
}

function createVariantFromOffer(product, offer, productCharacteristics) {
  const offerProperties = parseOfferProperties(offer.properties);
  const propertyLookup = buildPropertyLookup({
    productCharacteristics,
    offerProperties,
    fallbackName: product.name,
  });

  const normalized = buildAxisStateFromLookup(propertyLookup, product.name);
  const images = parseAttachments(product);

  return {
    sourceProductId: product.id,
    sourceOfferId: offer.id,
    sku: String(offer.sku || "").trim(),
    price: toFiniteNumber(offer.price, toFiniteNumber(product.min_price, toFiniteNumber(product.price, 0))),
    quantity: toFiniteNumber(offer.quantity, 0),
    reserved: toFiniteNumber(offer.in_reserve, 0),
    purchasePrice: toFiniteNumber(offer.purchased_price, 0),
    imageUrl: String(offer.thumbnail_url || product.thumbnail_url || images[0] || "").trim(),
    axisValues: normalized.axisValues,
    axisLabels: normalized.axisLabels,
    extraAxisValues: normalized.extraAxisValues,
    extraAxisLabels: normalized.extraAxisLabels,
    material: normalized.material,
    unknownPropertyNames: normalized.unknownPropertyNames,
    rawPropertySignature: buildRawPropertySignature(offerProperties),
    rawPropertyMap: buildRawPropertyMap(offerProperties),
  };
}

function createVariantFromStandaloneProduct(product, productCharacteristics) {
  const sourceProperties = Object.entries(productCharacteristics || {}).flatMap(([name, values]) => {
    const items = Array.isArray(values) ? values : [];
    return items.map((value) => ({ name, value }));
  });
  const propertyLookup = buildPropertyLookup({
    productCharacteristics,
    offerProperties: [],
    fallbackName: product.name,
  });

  const normalized = buildAxisStateFromLookup(propertyLookup, product.name);
  const images = parseAttachments(product);

  return {
    sourceProductId: product.id,
    sourceOfferId: null,
    sku: String(product.sku || `KEYCRM-${product.id}`).trim(),
    price: toFiniteNumber(product.price, toFiniteNumber(product.min_price, 0)),
    quantity: toFiniteNumber(product.quantity, 0),
    reserved: toFiniteNumber(product.in_reserve, 0),
    purchasePrice: toFiniteNumber(product.purchased_price, 0),
    imageUrl: String(product.thumbnail_url || images[0] || "").trim(),
    axisValues: normalized.axisValues,
    axisLabels: normalized.axisLabels,
    extraAxisValues: normalized.extraAxisValues,
    extraAxisLabels: normalized.extraAxisLabels,
    material: normalized.material,
    unknownPropertyNames: normalized.unknownPropertyNames,
    rawPropertySignature: buildRawPropertySignature(sourceProperties),
    rawPropertyMap: buildRawPropertyMap(sourceProperties),
  };
}

function chooseGroupMaterial(variants = []) {
  for (const variant of variants) {
    if (variant.material?.value) {
      return variant.material;
    }
  }

  return normalizeMaterial("Синтетика");
}

function buildGroupCharacteristics({ categoryDoc, material, isNew, isSale }) {
  const categoryTitle = categoryDoc?.title || localized("High Heels", "High Heels");

  return [
    makeStringCharacteristic(
      "subtitle",
      `Модель для ${String(categoryTitle.ua || categoryTitle.en || "сценічних виступів").toLowerCase()} та сценічних виступів`,
      `Model for ${String(categoryTitle.en || categoryTitle.ua || "stage performance").toLowerCase()} and stage performance`
    ),
    makeSelectCharacteristic("material", material.value, material.label),
    makeBooleanCharacteristic("isNew", isNew),
    makeBooleanCharacteristic("isSale", isSale),
    makeMultiCharacteristic("audience", [{ value: "women", label: localized("Жінки", "Women") }]),
    makeSelectCharacteristic("brand", BRAND, localized(BRAND, BRAND)),
  ];
}

function buildContentSections({ titleText, material, heelHeight }) {
  const heightTextUa = heelHeight == null ? "не вказана" : `${heelHeight} см`;
  const heightTextEn = heelHeight == null ? "not specified" : `${heelHeight} cm`;

  return [
    {
      key: "description",
      title: localized("ОПИС МОДЕЛІ", "MODEL DESCRIPTION"),
      content: localized(
        `Професійні туфлі ${titleText} з покращеною підтримкою гомілки та стабільною посадкою. Створені для тренувань, виступів і сценічної роботи.`,
        `${titleText} professional dance heels with improved ankle support and stable fit. Designed for training, performance and stage work.`
      ),
      sort: 10,
    },
    {
      key: "specs",
      title: localized("ХАРАКТЕРИСТИКА МОДЕЛІ", "MODEL SPECS"),
      content: localized(
        `Висота підборів ${heightTextUa}; Матеріал: ${material.label.ua}; Підошва адаптована для контрольованого ковзання та впевненого балансу.`,
        `Heel height ${heightTextEn}; Material: ${material.label.en}; Sole is adapted for controlled sliding and stable balance.`
      ),
      sort: 20,
    },
    {
      key: "shipping",
      title: localized("ОПЛАТА І ДОСТАВКА", "PAYMENT & SHIPPING"),
      content: localized(
        "Відправка Новою Поштою по всій Україні. Можлива онлайн-оплата на сайті або після підтвердження замовлення.",
        "Nova Poshta shipping across Ukraine. Online payment is available on the site or after order confirmation."
      ),
      sort: 30,
    },
  ];
}

function buildGroupVariationAxes({ variants, rootTemplate = [] }) {
  const normalizedRootTemplate = normalizeVariationAxesForFilters(rootTemplate || []);
  const rootTemplateById = new Map(normalizedRootTemplate.filter((axis) => axis?.axisId).map((axis) => [String(axis.axisId), axis]));
  const templateOrder = normalizedRootTemplate.map((axis) => String(axis.axisId));
  const extraAxisConfig = {
    A6: AXIS_META_OVERRIDES.A6,
    A7: AXIS_META_OVERRIDES.A7,
  };
  const allAxisIds = uniqueStrings([
    ...templateOrder,
    ...variants.flatMap((variant) => Object.keys(variant.axisValues || {})),
    ...variants.flatMap((variant) => Object.keys(variant.extraAxisValues || {})),
  ]);

  const activeAxisIds = allAxisIds.filter((axisId) => {
    const values = variants.map((variant) => {
      if (variant.axisValues && Object.prototype.hasOwnProperty.call(variant.axisValues, axisId)) {
        return variant.axisValues[axisId];
      }
      if (variant.extraAxisValues && Object.prototype.hasOwnProperty.call(variant.extraAxisValues, axisId)) {
        return variant.extraAxisValues[axisId];
      }
      return null;
    });
    const isComplete = values.length && values.every((value) => value !== undefined && value !== null && value !== "");
    if (!isComplete) return false;

    if (extraAxisConfig[axisId]) {
      return new Set(values).size > 1;
    }

    return true;
  });

  return normalizeVariationAxesForFilters(activeAxisIds.map((axisId) => {
    const templateAxis = rootTemplateById.get(axisId);
    const values = variants.map((variant) => {
      if (variant.axisValues && Object.prototype.hasOwnProperty.call(variant.axisValues, axisId)) {
        return variant.axisValues[axisId];
      }
      if (variant.extraAxisValues && Object.prototype.hasOwnProperty.call(variant.extraAxisValues, axisId)) {
        return variant.extraAxisValues[axisId];
      }
      return null;
    });
    const uniqueValues = [...new Set(values)];
    const fallbackAxis = extraAxisConfig[axisId] || null;

    let seenPresetValues = uniqueValues;
    if ((templateAxis?.type || fallbackAxis?.type || "string") === "select") {
      seenPresetValues = uniqueValues.map((value) => {
        const label = variants.find((variant) => {
          const baseValue = variant.axisValues?.[axisId];
          if (baseValue === value) return true;
          const extraValue = variant.extraAxisValues?.[axisId];
          return extraValue === value;
        })?.axisLabels?.[axisId]
          || variants.find((variant) => {
            const extraValue = variant.extraAxisValues?.[axisId];
            return extraValue === value;
          })?.extraAxisLabels?.[axisId];
        return label ? { value, label: normalizeLocalizedLabel(label, value) } : makeCustomSelectValue(value);
      });
    }

    const axisOverride = AXIS_META_OVERRIDES[axisId] || null;

    return {
      axisId,
      title: axisOverride?.title || templateAxis?.title || fallbackAxis?.title || localized(axisId, axisId),
      type: axisOverride?.type || templateAxis?.type || fallbackAxis?.type || (axisId === "A2" || axisId === "A4" ? "number" : "select"),
      unit: axisOverride?.unit ?? templateAxis?.unit ?? fallbackAxis?.unit ?? (axisId === "A2" || axisId === "A4" ? "cm" : null),
      valuesPreset: mergeAxisPresetValues(templateAxis?.valuesPreset || [], seenPresetValues),
    };
  }));
}

function buildOfferCharacteristics(variant) {
  const result = [];

  if (variant.axisValues?.A1) {
    result.push(makeSelectCharacteristic("color", variant.axisValues.A1, variant.axisLabels.A1));
  }

  if (variant.axisValues?.A3) {
    result.push(makeSelectCharacteristic("heelType", variant.axisValues.A3, variant.axisLabels.A3));
  }

  if (variant.axisValues?.A4 !== undefined && variant.axisValues?.A4 !== null) {
    result.push(makeNumberCharacteristic("heelHeight", variant.axisValues.A4, "cm"));
  }

  if (variant.axisValues?.A5) {
    result.push(makeSelectCharacteristic("soleType", variant.axisValues.A5, variant.axisLabels.A5));
  }

  if (variant.extraAxisValues?.A6) {
    result.push(makeSelectCharacteristic("size", variant.extraAxisValues.A6, variant.extraAxisLabels.A6));
  }

  if (variant.extraAxisValues?.A7) {
    result.push(makeSelectCharacteristic("material", variant.extraAxisValues.A7, variant.extraAxisLabels.A7));
  }

  const tags = [];
  if (Number(variant.axisValues?.A4) >= 10) {
    tags.push({ value: "stage", label: localized("Сцена", "Stage") });
  }

  if (tags.length) {
    result.push(makeMultiCharacteristic("tags", tags));
  }

  return result;
}

function getVariantAxisValue(variant, axisId) {
  if (variant.axisValues && Object.prototype.hasOwnProperty.call(variant.axisValues, axisId)) {
    return variant.axisValues[axisId];
  }

  if (variant.extraAxisValues && Object.prototype.hasOwnProperty.call(variant.extraAxisValues, axisId)) {
    return variant.extraAxisValues[axisId];
  }

  return null;
}

function findDuplicateOfferKeys(groupSlug, offers = []) {
  const byKey = new Map();

  for (const offer of offers) {
    const key = String(offer.optionKey || "");
    if (!byKey.has(key)) {
      byKey.set(key, []);
    }
    byKey.get(key).push(offer.sku);
  }

  return [...byKey.entries()]
    .filter(([, skus]) => skus.length > 1)
    .map(([optionKey, skus]) => ({ groupSlug, optionKey, skus }));
}

function mergeExactDuplicateOffers(offers = []) {
  const byKey = new Map();

  for (const offer of offers) {
    const key = String(offer.optionKey || "");
    if (!byKey.has(key)) {
      byKey.set(key, []);
    }
    byKey.get(key).push(offer);
  }

  const merged = [];
  const conflicts = [];

  for (const group of byKey.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    const priceSignature = new Set(
      group.map((offer) =>
        JSON.stringify({
          price: offer.price,
          optionMap: offer.optionMap,
        })
      )
    );

    if (priceSignature.size > 1) {
      conflicts.push(group);
      continue;
    }

    const base = { ...group[0] };
    const purchasePriceSource = [...group].sort((left, right) => Number(right.quantity || 0) - Number(left.quantity || 0))[0];
    base.quantity = group.reduce((sum, offer) => sum + Number(offer.quantity || 0), 0);
    base.reserved = group.reduce((sum, offer) => sum + Number(offer.reserved || 0), 0);
    base.available = Math.max(0, base.quantity - base.reserved) > 0;
    base.purchasePrice = purchasePriceSource?.purchasePrice ?? base.purchasePrice;
    merged.push(base);
  }

  return { merged, conflicts };
}

function buildSourceSummary(products = [], offers = []) {
  const categoryCounts = new Map();
  const categorySamples = new Map();
  let standaloneProducts = 0;

  for (const product of products) {
    const key = product.category_id == null ? "null" : String(product.category_id);
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
    if (!categorySamples.has(key)) {
      categorySamples.set(key, []);
    }
    if (categorySamples.get(key).length < 3) {
      categorySamples.get(key).push(String(product.name || ""));
    }
    if (!product.has_offers) standaloneProducts += 1;
  }

  return {
    products: products.length,
    offers: offers.length,
    standaloneProducts,
    sourceCategoryCounts: Object.fromEntries([...categoryCounts.entries()].sort((left, right) => left[0].localeCompare(right[0]))),
    sourceCategorySamples: Object.fromEntries([...categorySamples.entries()].sort((left, right) => left[0].localeCompare(right[0]))),
  };
}

function buildImportPlan({ products, offers, productCharacteristicsByProductId, categoriesBySlug }) {
  const offersByProductId = new Map();
  const standaloneBuckets = new Map();
  const slugsInUse = new Set();
  const targetCategoryCounts = new Map();
  const unknownPropertyNames = new Set();
  const groups = [];

  for (const offer of offers) {
    const key = String(offer.product_id);
    if (!offersByProductId.has(key)) {
      offersByProductId.set(key, []);
    }
    offersByProductId.get(key).push(offer);
  }

  function allocateSlug(targetCategorySlug, titleText, fallbackId) {
    const baseSlug = `${targetCategorySlug}-${slugify(titleText) || `product-${fallbackId}`}`;
    let candidate = baseSlug;

    if (!slugsInUse.has(candidate)) {
      slugsInUse.add(candidate);
      return candidate;
    }

    candidate = `${baseSlug}-${fallbackId}`;
    while (slugsInUse.has(candidate)) {
      candidate = `${candidate}-dup`;
    }

    slugsInUse.add(candidate);
    return candidate;
  }

  function registerGroup({ sourceProducts, variants, targetCategorySlug, baseTitle }) {
    const targetCategory = categoriesBySlug.get(targetCategorySlug);
    if (!targetCategory) {
      throw new Error(`Target category not found: ${targetCategorySlug}`);
    }

    const rootSlug = TARGET_CATEGORY_ROOTS.get(targetCategorySlug) || targetCategorySlug;
    const rootCategory = categoriesBySlug.get(rootSlug);
    if (!rootCategory) {
      throw new Error(`Root category not found: ${rootSlug}`);
    }

    targetCategoryCounts.set(targetCategorySlug, (targetCategoryCounts.get(targetCategorySlug) || 0) + 1);

    const material = chooseGroupMaterial(variants);
    const imageUrls = uniqueStrings(sourceProducts.flatMap((product) => parseAttachments(product)));
    const imageURL = String(variants.find((variant) => variant.imageUrl)?.imageUrl || imageUrls[0] || "").trim();
    const gallery = buildGallery(imageUrls.length ? imageUrls : [imageURL].filter(Boolean), baseTitle);
    const variationAxes = buildGroupVariationAxes({
      variants,
      rootTemplate: rootCategory.variationTemplate || [],
    });
    const previewHeelHeight = variants.find((variant) => variant.axisValues?.A4 != null)?.axisValues?.A4 ?? null;
    const slug = allocateSlug(targetCategorySlug, baseTitle, sourceProducts[0]?.id || baseTitle);
    const title = localized(baseTitle, baseTitle);

    const rawOffers = variants.map((variant, index) => {
      const optionMap = {};
      const optionValues = [];

      for (const axis of variationAxes) {
        const value = getVariantAxisValue(variant, axis.axisId);
        if (value === undefined || value === null || value === "") continue;
        optionMap[axis.axisId] = value;
        optionValues.push(value);
      }

      return {
        sourceProductId: variant.sourceProductId,
        sourceOfferId: variant.sourceOfferId,
        sku: variant.sku || `${slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${String(index + 1).padStart(2, "0")}`,
        price: variant.price,
        opt_price: null,
        available: Math.max(0, variant.quantity - variant.reserved) > 0,
        img: variant.imageUrl || imageURL,
        optionValues,
        optionMap,
        optionKey: buildAxisOptionKey(variationAxes, optionMap),
        stocks: [],
        characteristics: buildOfferCharacteristics(variant),
        purchasePrice: variant.purchasePrice,
        quantity: variant.quantity,
        reserved: variant.reserved,
        rawPropertySignature: variant.rawPropertySignature,
      };
    });

    const mergeResult = mergeExactDuplicateOffers(rawOffers);
    if (mergeResult.conflicts.length) {
      const firstConflict = mergeResult.conflicts[0];
      throw new Error(
        `Non-mergeable duplicate optionKey in import plan for ${slug}: ${firstConflict[0].optionKey} (${firstConflict
          .map((offer) => offer.sku)
          .join(", ")})`
      );
    }

    groups.push({
      slug,
      sourceProductIds: sourceProducts.map((product) => product.id),
      sourceOfferIds: variants.map((variant) => variant.sourceOfferId).filter(Boolean),
      sourceSkus: uniqueStrings(variants.map((variant) => variant.sku)),
      sourceImageUrls: uniqueStrings([imageURL, ...gallery.map((item) => item.url)]),
      sourceTitles: uniqueStrings(sourceProducts.map((product) => product.name)),
      targetCategorySlug,
      rootCategoryId: String(rootCategory._id),
      group: {
        slug,
        title,
        subtitle: DEFAULT_SUBTITLE,
        description: localized(
          `Танцювальні хилси ${baseTitle}. Створені для стабільної роботи стопи, акцентної лінії ноги та комфортного балансу під час руху.`,
          `Dance heels ${baseTitle}. Designed for stable footwork, a beautiful leg line and comfortable balance in motion.`
        ),
        categoryIds: [targetCategory._id],
        imageURL,
        gallery,
        sizeChart: {
          imageUrl: "",
          title: localized("Розмірна сітка", "Size chart"),
          description: localized(
            "Допоміжна таблиця для підбору правильного розміру стельки.",
            "Guide for choosing the correct insole size."
          ),
        },
        contentSections: buildContentSections({
          titleText: baseTitle,
          material,
          heelHeight: previewHeelHeight,
        }),
        variationAxes,
        characteristics: buildGroupCharacteristics({
          categoryDoc: targetCategory,
          material,
          isNew: false,
          isSale: false,
        }),
        relatedProductIds: [],
        accessories: [],
        reviews: [],
        ratingSummary: { average: 0, count: 0 },
        status: "active",
        isSale: false,
        isPopular: false,
        isNew: false,
      },
      offers: mergeResult.merged.map((offer) => {
        const { rawPropertySignature, ...rest } = offer;
        return rest;
      }),
    });

    const currentGroup = groups[groups.length - 1];
    const duplicates = findDuplicateOfferKeys(currentGroup.group.slug, currentGroup.offers);
    if (duplicates.length) {
      const firstDuplicate = duplicates[0];
      throw new Error(
        `Duplicate optionKey in import plan for ${firstDuplicate.groupSlug}: ${firstDuplicate.optionKey} (${firstDuplicate.skus.join(", ")})`
      );
    }

    variants.forEach((variant) => {
      variant.unknownPropertyNames.forEach((name) => unknownPropertyNames.add(name));
    });
  }

  for (const product of products) {
    const productKey = String(product.id);
    const productCharacteristics = productCharacteristicsByProductId.get(productKey) || {};
    const productOffers = offersByProductId.get(productKey) || [];

    if (product.has_offers && productOffers.length) {
      const targetCategorySlug = resolveTargetCategorySlug(product);
      registerGroup({
        sourceProducts: [product],
        variants: productOffers.map((offer) => createVariantFromOffer(product, offer, productCharacteristics)),
        targetCategorySlug,
        baseTitle: String(product.name || `Product ${product.id}`).trim(),
      });
      continue;
    }

    const standaloneKey = deriveStandaloneGroupKey(product);
    if (!standaloneBuckets.has(standaloneKey)) {
      standaloneBuckets.set(standaloneKey, []);
    }
    standaloneBuckets.get(standaloneKey).push({ product, productCharacteristics });
  }

  for (const bucket of standaloneBuckets.values()) {
    const firstProduct = bucket[0]?.product;
    if (!firstProduct) continue;

    const targetCategorySlug = resolveTargetCategorySlug(firstProduct);
    const baseTitle = stripStandaloneTitleVariant(firstProduct.name || `Product ${firstProduct.id}`) || String(firstProduct.name || firstProduct.id);

    try {
      registerGroup({
        sourceProducts: bucket.map((item) => item.product),
        variants: bucket.map((item) => createVariantFromStandaloneProduct(item.product, item.productCharacteristics)),
        targetCategorySlug,
        baseTitle,
      });
    } catch (error) {
      const errorMessage = String(error?.message || "");
      const normalizedMessage = errorMessage.toLowerCase();
      if (!normalizedMessage.includes("duplicate optionkey")) {
        throw error;
      }

      for (const item of bucket) {
        const itemTitle = stripStandaloneTitleVariant(item.product.name || `Product ${item.product.id}`)
          || String(item.product.name || item.product.id);

        registerGroup({
          sourceProducts: [item.product],
          variants: [createVariantFromStandaloneProduct(item.product, item.productCharacteristics)],
          targetCategorySlug: resolveTargetCategorySlug(item.product),
          baseTitle: itemTitle,
        });
      }
    }
  }

  if (STRICT_CATEGORY_MAP) {
    const unknownCategories = [...groups]
      .filter((item) => !item.targetCategorySlug)
      .map((item) => item.group.slug);
    if (unknownCategories.length) {
      throw new Error(`Unknown category mapping for groups: ${unknownCategories.join(", ")}`);
    }
  }

  return {
    groups,
    summary: {
      groups: groups.length,
      offers: groups.reduce((sum, item) => sum + item.offers.length, 0),
      targetCategoryCounts: Object.fromEntries([...targetCategoryCounts.entries()].sort((left, right) => left[0].localeCompare(right[0]))),
      unknownPropertyNames: [...unknownPropertyNames].sort(),
    },
  };
}

async function resolveCategories() {
  const docs = await Category.find({
    slug: { $in: [...new Set([DEFAULT_TARGET_CATEGORY_SLUG, ...TARGET_CATEGORY_ROOTS.keys(), ...TARGET_CATEGORY_ROOTS.values()])] },
  }).lean();

  const bySlug = new Map(docs.map((doc) => [String(doc.slug), doc]));

  for (const slug of new Set([DEFAULT_TARGET_CATEGORY_SLUG, ...TARGET_CATEGORY_ROOTS.keys(), ...TARGET_CATEGORY_ROOTS.values()])) {
    if (!bySlug.has(slug)) {
      throw new Error(`Category not found in database: ${slug}`);
    }
  }

  return bySlug;
}

async function resolveDefaultWarehouse() {
  return (
    (await Warehouse.findOne({ isDefault: true, status: "active" }).lean()) ||
    (await Warehouse.findOne({ isActive: true, status: "active" }).sort({ isDefault: -1, sort: 1 }).lean()) ||
    null
  );
}

async function resolveDeletionCandidates(importPlan) {
  const sourceSkus = uniqueStrings(importPlan.groups.flatMap((item) => item.sourceSkus));
  const sourceTitles = uniqueStrings(importPlan.groups.flatMap((item) => item.sourceTitles));
  const sourceImageUrls = uniqueStrings(importPlan.groups.flatMap((item) => item.sourceImageUrls));
  const sourceSlugs = uniqueStrings(importPlan.groups.map((item) => item.group.slug));

  const matchedOffers = sourceSkus.length
    ? await Offer.find({ sku: { $in: sourceSkus } }).select({ _id: 1, groupId: 1, sku: 1 }).lean()
    : [];

  const matchedGroupIds = new Set(matchedOffers.map((offer) => String(offer.groupId)));
  const groupQuery = [];

  if (sourceSlugs.length) groupQuery.push({ slug: { $in: sourceSlugs } });
  if (sourceTitles.length) {
    groupQuery.push({ "title.ua": { $in: sourceTitles } });
    groupQuery.push({ "title.en": { $in: sourceTitles } });
  }
  if (sourceImageUrls.length) {
    groupQuery.push({ imageURL: { $in: sourceImageUrls } });
    groupQuery.push({ "gallery.url": { $in: sourceImageUrls } });
  }

  const matchedGroups = groupQuery.length
    ? await ProductGroup.find({ $or: groupQuery }).select({ _id: 1, slug: 1 }).lean()
    : [];

  matchedGroups.forEach((group) => matchedGroupIds.add(String(group._id)));

  return {
    sourceSkus,
    groupIds: [...matchedGroupIds].map((id) => new mongoose.Types.ObjectId(id)),
    matchedOffersCount: matchedOffers.length,
    matchedGroupsCount: matchedGroupIds.size,
  };
}

async function writeImport({ importPlan, deletionCandidates, defaultWarehouse }) {
  const deletionFilters = [];
  if (deletionCandidates.groupIds.length) {
    deletionFilters.push({ groupId: { $in: deletionCandidates.groupIds } });
  }
  if (deletionCandidates.sourceSkus.length) {
    deletionFilters.push({ sku: { $in: deletionCandidates.sourceSkus } });
  }

  if (deletionFilters.length) {
    await Offer.deleteMany({ $or: deletionFilters });
  }

  if (deletionCandidates.groupIds.length) {
    await ReviewModel.deleteMany({ product: { $in: deletionCandidates.groupIds } });
    await ProductGroup.deleteMany({ _id: { $in: deletionCandidates.groupIds } });
  }

  const rootTemplateState = new Map();
  const createdGroups = [];

  for (const item of importPlan.groups) {
    const groupDoc = await ProductGroup.create({
      ...item.group,
      variationAxes: normalizeVariationAxesForStorage(item.group.variationAxes || []),
    });
    createdGroups.push(groupDoc);

    const offerDocs = item.offers.map((offer) => ({
      groupId: groupDoc._id,
      sku: offer.sku,
      price: offer.price,
      opt_price: offer.opt_price,
      available: offer.available,
      img: offer.img,
      optionValues: offer.optionValues,
      optionMap: offer.optionMap,
      optionKey: offer.optionKey,
      stocks: defaultWarehouse
        ? [
            {
              warehouseId: defaultWarehouse._id,
              onHand: offer.quantity,
              reserved: offer.reserved,
              purchasePrice: offer.purchasePrice,
            },
          ]
        : [],
      characteristics: offer.characteristics,
    }));

    if (offerDocs.length) {
      await Offer.insertMany(offerDocs, { ordered: false });
    }

    const rootState = rootTemplateState.get(item.rootCategoryId) || {
      current: null,
      next: null,
    };

    if (!rootState.current) {
      const rootCategory = await Category.findById(item.rootCategoryId).select({ _id: 1, variationTemplate: 1 }).lean();
      rootState.current = normalizeVariationAxesForStorage(
        normalizeVariationAxesForFilters(rootCategory?.variationTemplate || [])
      );
      rootState.next = rootState.current;
    }

    rootState.next = normalizeVariationAxesForStorage(
      normalizeVariationAxesForFilters(
        mergeVariationTemplateAxes(rootState.next, item.group.variationAxes || [])
      )
    );
    rootTemplateState.set(item.rootCategoryId, rootState);
  }

  for (const [rootCategoryId, state] of rootTemplateState.entries()) {
    if (JSON.stringify(state.current || []) === JSON.stringify(state.next || [])) {
      continue;
    }

    await Category.updateOne(
      { _id: rootCategoryId },
      {
        $set: {
          variationTemplate: state.next,
        },
      }
    );
  }

  for (const rootCategoryId of rootTemplateState.keys()) {
    const persistedCategory = await Category.findById(rootCategoryId)
      .select({ _id: 1, variationTemplate: 1 })
      .lean();

    const normalizedTemplate = normalizeVariationAxesForStorage(
      normalizeVariationAxesForFilters(persistedCategory?.variationTemplate || [])
    );

    if (JSON.stringify(persistedCategory?.variationTemplate || []) === JSON.stringify(normalizedTemplate)) {
      continue;
    }

    await Category.updateOne(
      { _id: rootCategoryId },
      {
        $set: {
          variationTemplate: normalizedTemplate,
        },
      }
    );
  }

  const characteristicMetas = await CharacteristicMeta.find({
    key: { $in: ["color", "heelType", "soleType", "material"] },
    scope: { $in: ["offer", "both"] },
  })
    .select({ _id: 1, key: 1, valuesPreset: 1, title: 1 })
    .lean();

  for (const meta of characteristicMetas) {
    const normalizedValuesPreset = normalizeCharacteristicMetaValuesPreset(
      meta.key,
      meta.valuesPreset || []
    );

    if (JSON.stringify(meta.valuesPreset || []) === JSON.stringify(normalizedValuesPreset)) {
      continue;
    }

    await CharacteristicMeta.updateOne(
      { _id: meta._id },
      {
        $set: {
          valuesPreset: normalizedValuesPreset,
        },
      }
    );
  }

  return {
    createdGroups: createdGroups.length,
    createdOffers: importPlan.groups.reduce((sum, item) => sum + item.offers.length, 0),
    updatedRootTemplates: rootTemplateState.size,
  };
}

function printSummary({ sourceSummary, importSummary, deletionCandidates, defaultWarehouse }) {
  console.log("[migrate-keycrm-products] summary", {
    mode: DRY_RUN ? "dry-run" : "write",
    workbookPath: WORKBOOK_PATH,
    sourceSummary,
    importSummary,
    deletionCandidates: {
      groups: deletionCandidates.matchedGroupsCount,
      offers: deletionCandidates.matchedOffersCount,
      skus: deletionCandidates.sourceSkus.length,
    },
    warehouse: defaultWarehouse
      ? {
          id: String(defaultWarehouse._id),
          code: defaultWarehouse.code,
          isDefault: Boolean(defaultWarehouse.isDefault),
        }
      : null,
  });

  if (VERBOSE) {
    console.log(
      JSON.stringify(
        {
          sampleGroups: importSummary.sampleGroups,
          unknownPropertyNames: importSummary.unknownPropertyNames,
        },
        null,
        2
      )
    );
  }
}

async function main() {
  if (!fs.existsSync(WORKBOOK_PATH)) {
    throw new Error(`Workbook not found: ${WORKBOOK_PATH}`);
  }

  if (!MONGO_URI) {
    throw new Error("Set MONGO_URI or MONGODB_URI");
  }

  console.log("[migrate-keycrm-products] starting", {
    mode: DRY_RUN ? "dry-run" : "write",
    workbookPath: WORKBOOK_PATH,
    mongoUri: MONGO_URI,
  });

  const workbook = xlsx.readFile(WORKBOOK_PATH);
  const products = xlsx.utils.sheet_to_json(workbook.Sheets.Products, { defval: null });
  const offers = xlsx.utils.sheet_to_json(workbook.Sheets.Offers, { defval: null });
  const productCharacteristicsRows = xlsx.utils.sheet_to_json(workbook.Sheets.ProductCharacteristics, { defval: null });

  const productCharacteristicsByProductId = new Map(
    productCharacteristicsRows.map((row) => [String(row.product_id), parseProductCharacteristicsMap(row.characteristics_json)])
  );

  await mongoose.connect(MONGO_URI);

  try {
    const categoriesBySlug = await resolveCategories();
    const defaultWarehouse = await resolveDefaultWarehouse();
    const sourceSummary = buildSourceSummary(products, offers);
    const importPlan = buildImportPlan({
      products,
      offers,
      productCharacteristicsByProductId,
      categoriesBySlug,
    });
    const deletionCandidates = await resolveDeletionCandidates(importPlan);

    const importSummary = {
      ...importPlan.summary,
      sampleGroups: importPlan.groups.slice(0, 5).map((item) => ({
        slug: item.group.slug,
        title: item.group.title.ua,
        categoryIds: item.group.categoryIds.map((value) => String(value)),
        offers: item.offers.length,
        variationAxes: item.group.variationAxes.map((axis) => axis.axisId),
      })),
    };

    printSummary({
      sourceSummary,
      importSummary,
      deletionCandidates,
      defaultWarehouse,
    });

    if (DRY_RUN) {
      return;
    }

    const writeSummary = await writeImport({
      importPlan,
      deletionCandidates,
      defaultWarehouse,
    });

    console.log("[migrate-keycrm-products] completed", writeSummary);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("[migrate-keycrm-products] failed", {
    message: error?.message,
    stack: error?.stack,
  });
  process.exitCode = 1;
});