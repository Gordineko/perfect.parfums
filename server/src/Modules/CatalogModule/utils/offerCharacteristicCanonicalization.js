import { resolveCanonicalPresetForKey } from "./variationCharacteristics.js";

function normalizeAliasToken(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()'"`’]/g, " ")
    .replace(/[\/_.,;:+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const COLOR_ALIAS_GROUPS = [
  {
    canonical: "black",
    aliases: [
      "black", "чорний", "черный", "chornyi", "chornyy", "chorni", "chernyy", "chernye",
      "lakovyy-chornyy", "лаковий чорний", "лаковый черный",
      "chornyy-pyton", "чорний питон", "черный питон",
      "chornyy-chervoni-vstavky", "чорний червоні вставки", "черный красные вставки"
    ],
  },
  {
    canonical: "white",
    aliases: ["white", "білий", "белый", "bilyi", "bilyy", "bili", "bilii", "belyy", "belye"],
  },
  {
    canonical: "red",
    aliases: ["red", "червоний", "красный", "chervonyi", "chervonyy", "chervoni", "krasnyy", "krasnye"],
  },
  {
    canonical: "beige",
    aliases: [
      "beige", "бежевий", "бежевый", "bezhevyi", "bezhevyy", "bezhevi", "bezhevye",
      "temno-bezhevyy", "темно бежевый", "темно бежевий",
      "svitlo-bezhevyy", "світло бежевий", "светло бежевый",
      "pisochnyy", "пісочний", "песочный",
      "persyk", "персик", "peach",
      "molochnyy", "молочний", "молочный",
      "bezhevo-rozhevi", "бежево рожеві", "бежево розовые"
    ],
  },
  {
    canonical: "silver",
    aliases: [
      "silver", "срібний", "серебряный", "sribnyi", "sribnyy", "sribni", "serebryanyy", "serebryanye",
      "sriblo", "срібло", "серебро",
      "sriblo-matovyy", "срібло матовий", "серебро матовый"
    ],
  },
  {
    canonical: "pink",
    aliases: [
      "pink", "рожевий", "розовый", "rozhevyi", "rozhevyy", "rozhevi", "rozovyy", "rozovye",
      "svitlo-rozhevyy", "світло рожевий", "светло розовый",
      "nizhno-rozhevyy", "ніжно рожевий", "нежно розовый",
      "rozhevyy-matovyy", "рожевий матовий", "розовый матовый",
      "rozhevyy-pyton", "рожевий питон", "розовый питон",
      "malynovyy", "малиновий", "малиновый"
    ],
  },
  {
    canonical: "gold",
    aliases: ["gold", "золотий", "золотой", "zolotyy", "zolotye", "zoloto"],
  },
  {
    canonical: "transparent",
    aliases: [
      "transparent", "прозорий", "прозрачный", "prozoryy", "prozoryi", "prozrachnyy",
      "prozoryy-u-rozhevomu-konverti", "прозорий у рожевому конверті", "прозрачный в розовом конверте"
    ],
  },
  {
    canonical: "grey",
    aliases: [
      "grey", "gray", "сірий", "серый", "siryy", "siiryy", "serye",
      "bilo-siryy", "біло сірий", "бело серый",
      "holubo-siryy", "голубо сірий", "голубо серый"
    ],
  },
  {
    canonical: "bordovyy",
    aliases: [
      "bordovyy", "бордовий", "бордовый", "бордовые", "bordovye",
      "marsala", "марсала",
      "bordo", "бордо",
      "burhundi", "бургунді", "бургунди",
      "burhundi-piton", "бургунді пітон", "бургунди питон",
      "vyshnevyy", "вишневий", "вишневый"
    ],
  },
  {
    canonical: "blue",
    aliases: [
      "blue", "голубий", "голубой", "holubyy", "holuboi",
      "syniy", "синій", "синий",
      "temno-syniy", "темно синій", "темно синий",
      "blakytnyy", "блакитний", "голубой",
      "svitlo-blakytnyy", "світло блакитний", "светло голубой",
      "nizhno-blakytnyy", "ніжно блакитний", "нежно голубой",
      "nezhno-holubye", "нежно голубые",
      "elektryk", "електрик", "электрик"
    ],
  },
  {
    canonical: "green",
    aliases: [
      "green", "зелений", "зеленый", "zelenyy",
      "smarahdovyy", "смарагдовий", "изумрудный",
      "sneyk-zelenye", "змеиный зеленый"
    ],
  },
  {
    canonical: "byryuza",
    aliases: ["byryuza", "бірюза", "бирюза", "turquoise"],
  },
  {
    canonical: "yellow",
    aliases: [
      "yellow", "жовтий", "желтый", "zhovtyy",
      "lymonnyy", "лимонний", "лимонный",
      "lymonno-zhovtyy", "лимонно жовтий", "лимонно желтый"
    ],
  },
  {
    canonical: "orange",
    aliases: ["orange", "оранжевий", "оранжевый", "oranzhevyy"],
  },
  {
    canonical: "brown",
    aliases: [
      "brown", "коричневий", "коричневый", "korychnevyy",
      "shokolad", "шоколад", "шоколадный", "shokoladnyy",
      "temno-shokoladnyy", "темно шоколадний", "темно шоколадный",
      "shokoladnyy-pyton", "шоколадний питон", "шоколадный питон",
      "karamel", "карамель",
      "mokko", "мокко",
      "zmiya", "змія", "змея"
    ],
  },
  {
    canonical: "purple",
    aliases: ["purple", "ліловий", "лиловый", "lilovyy"],
  },
];

const COLOR_ALIAS_MAP = new Map();
for (const group of COLOR_ALIAS_GROUPS) {
  for (const alias of group.aliases) {
    COLOR_ALIAS_MAP.set(normalizeAliasToken(alias), group);
  }
}

function resolveColorAliasGroup(value) {
  return COLOR_ALIAS_MAP.get(normalizeAliasToken(value)) || null;
}

const SOLE_COLOR_VARIANTS = [
  {
    matchers: ["беж", "bezh"],
    ua: "Бежева",
    ru: "Бежевая",
  },
  {
    matchers: ["чорн", "черн", "chorn"],
    ua: "Чорна",
    ru: "Черная",
  },
  {
    matchers: ["червон", "chervon"],
    ua: "Червона",
    ru: "Красная",
  },
];

const SOLE_TEXTURE_VARIANTS = [
  {
    matchers: ["ребрист", "rebryst"],
    ua: "ребриста",
    ru: "ребристая",
  },
  {
    matchers: ["гладк", "hladk"],
    ua: "гладка",
    ru: "гладкая",
  },
  {
    matchers: ["замшев", "zamshev"],
    ua: "замшева",
    ru: "замшевая",
  },
];

function capitalize(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function addUniqueString(target, value) {
  const text = String(value ?? "").trim();
  if (!text) return;
  target.add(text);
}

function detectSoleVariantPart(source, variants, field) {
  const normalized = normalizeAliasToken(source);
  if (!normalized) return null;

  return variants.find((variant) =>
    variant.matchers.some((matcher) => normalized.includes(matcher))
  )?.[field] ?? null;
}

function buildSoleTypeAliases(rawValue) {
  const canonical = resolveCanonicalPresetForKey("soleType", rawValue);
  const aliases = new Set();
  const rawText =
    rawValue && typeof rawValue === "object"
      ? rawValue.value || rawValue.label?.ua || rawValue.label?.en
      : rawValue;

  addUniqueString(aliases, rawText);
  addUniqueString(aliases, canonical?.value);
  addUniqueString(aliases, canonical?.label?.ua);
  addUniqueString(aliases, canonical?.label?.en);

  const source = canonical?.label?.ua || canonical?.value || rawText;
  const uaColor = detectSoleVariantPart(source, SOLE_COLOR_VARIANTS, "ua");
  const ruColor = detectSoleVariantPart(source, SOLE_COLOR_VARIANTS, "ru");
  const uaTexture = detectSoleVariantPart(source, SOLE_TEXTURE_VARIANTS, "ua");
  const ruTexture = detectSoleVariantPart(source, SOLE_TEXTURE_VARIANTS, "ru");

  if (uaColor && uaTexture) {
    addUniqueString(aliases, `${uaColor} ${uaTexture}`);
    addUniqueString(aliases, `${capitalize(uaTexture)} ${uaColor.toLowerCase()}`);
  }

  if (ruColor && ruTexture) {
    addUniqueString(aliases, `${ruColor} ${ruTexture}`);
    addUniqueString(aliases, `${capitalize(ruTexture)} ${ruColor.toLowerCase()}`);
  }

  if (uaColor && !uaTexture) addUniqueString(aliases, uaColor);
  if (ruColor && !ruTexture) addUniqueString(aliases, ruColor);
  if (!uaColor && uaTexture) addUniqueString(aliases, capitalize(uaTexture));
  if (!ruColor && ruTexture) addUniqueString(aliases, capitalize(ruTexture));

  return [...aliases];
}

export function canonicalizeOfferCharacteristicValue(key, value) {
  if (key === "soleType") {
    const preset = resolveCanonicalPresetForKey(key, value);
    return preset?.value ?? value;
  }

  return value;
}

export function expandOfferCharacteristicFilterValues(key, rawValue) {
  if (key === "soleType") {
    return buildSoleTypeAliases(rawValue);
  }

  if (key !== "color") {
    return [rawValue];
  }

  const aliases = new Set();
  const rawText =
    rawValue && typeof rawValue === "object"
      ? rawValue.value || rawValue.label?.ua || rawValue.label?.en
      : rawValue;

  addUniqueString(aliases, rawText);

  // Для color используем строгий фильтр без семейной экспансии,
  // чтобы, например, "Жовтий" не матчился на "Лимонний".
  const canonical = resolveCanonicalPresetForKey("color", rawValue);
  addUniqueString(aliases, canonical?.value);
  addUniqueString(aliases, canonical?.label?.ua);
  addUniqueString(aliases, canonical?.label?.en);

  return [...aliases];
}

export function mergeOfferCharacteristicBuckets(key, buckets = []) {
  if (key !== "soleType") return buckets;

  const merged = new Map();

  for (const bucket of buckets || []) {
    const canonicalValue = canonicalizeOfferCharacteristicValue(key, bucket?.value);
    if (canonicalValue == null) continue;

    const current = merged.get(canonicalValue) || { value: canonicalValue, count: 0 };
    current.count += Number(bucket?.count || 0);
    merged.set(canonicalValue, current);
  }

  return [...merged.values()];
}