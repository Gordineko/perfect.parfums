import mongoose from "mongoose";
import dotenv from "dotenv";

import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { CharacteristicMeta } from "../Modules/CatalogModule/Models/CharacteristicMeta.model.js";
import { Warehouse } from "../Modules/CatalogModule/Models/Warehouse.model.js";
import { ReviewModel } from "../Modules/ReviewModule/Models/Review.model.js";

dotenv.config();

const MONGO_URI = "mongodb+srv://keykeyteams:HzmjraG9wuLeuzCC@cluster0.pr9rchp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGO_URI) {
  throw new Error("MONGO_URI or MONGODB_URI is not set");
}

const BRAND = "WOH";
const ROOT_SLUG = "dance-heels";

const CATEGORY_CONFIG = [
  {
    key: "high-heels",
    title: { ua: "High Heels", en: "High Heels" },
    priceMin: 3200,
    priceMax: 5200,
    materials: ["leather", "satin", "synthetic"],
    colors: ["black", "red", "white", "beige"],
    itemsCount: 60,
  },
  {
    key: "training",
    title: { ua: "Training", en: "Training" },
    priceMin: 2600,
    priceMax: 4300,
    materials: ["synthetic", "leather", "microfiber"],
    colors: ["black", "white", "beige"],
    itemsCount: 60,
  },
  {
    key: "professional",
    title: { ua: "Professional", en: "Professional" },
    priceMin: 3900,
    priceMax: 6900,
    materials: ["leather", "premium-suede", "satin"],
    colors: ["black", "red", "beige", "silver"],
    itemsCount: 60,
  },
];

const ACCESSORY_CONFIG = [
  {
    slug: "heel-protectors-clear",
    title: { ua: "Накаблучники прозорі", en: "Clear Heel Protectors" },
    subtitle: { ua: "Додатковий аксесуар для танцювального взуття", en: "Extra accessory for dance shoes" },
    description: {
      ua: "Прозорі накаблучники для кращого зчеплення та захисту каблука під час тренувань і виступів.",
      en: "Clear heel protectors for better grip and heel protection during training and performances.",
    },
    price: 570,
    opt_price: 690,
    imageSeed: "accessory-heel-protectors-clear",
  },
  {
    slug: "heel-protectors-black",
    title: { ua: "Накаблучники чорні", en: "Black Heel Protectors" },
    subtitle: { ua: "Аксесуар для захисту каблука", en: "Accessory for heel protection" },
    description: {
      ua: "Чорні накаблучники для сценічного та тренувального взуття.",
      en: "Black heel protectors for stage and training shoes.",
    },
    price: 590,
    opt_price: 710,
    imageSeed: "accessory-heel-protectors-black",
  },
  {
    slug: "shoe-bag-pro",
    title: { ua: "Сумка для взуття Pro", en: "Pro Shoe Bag" },
    subtitle: { ua: "Фірмова сумка для танцювального взуття", en: "Branded shoe bag for dance shoes" },
    description: {
      ua: "Легка сумка для зберігання та транспортування танцювального взуття.",
      en: "Lightweight bag for storing and transporting dance shoes.",
    },
    price: 790,
    opt_price: 950,
    imageSeed: "accessory-shoe-bag-pro",
  },
  {
    slug: "gel-insole-pads",
    title: { ua: "Гелеві вкладиші", en: "Gel Insole Pads" },
    subtitle: { ua: "Комфорт під час тренувань та виступів", en: "Comfort during training and performances" },
    description: {
      ua: "Гелеві вкладиші для зниження навантаження на стопу.",
      en: "Gel insole pads for reducing foot pressure.",
    },
    price: 430,
    opt_price: 520,
    imageSeed: "accessory-gel-insole-pads",
  },
];

const MODEL_NAMES = [
  "Scarlet Pro Gloss",
  "Scarlet Stage Flex",
  "Scarlet Motion Line",
  "Scarlet Studio Pro",
  "Scarlet Prime Gloss",
  "Scarlet Elite Shape",
  "Scarlet Aura Move",
  "Scarlet Velvet Step",
  "Scarlet Rhythm Pro",
  "Scarlet Balance Line",
];

const INSOLE_SIZES = [23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5];

const HEEL_TYPE_META = {
  straight: { ua: "Прямий", en: "Straight" },
  flare: { ua: "Чарка", en: "Flare" },
  triangle: { ua: "Трикутник", en: "Triangle" },
};

const SOLE_TYPE_META = {
  suede: { ua: "Замшевий", en: "Suede" },
  standard: { ua: "Звичайний", en: "Standard" },
  split: { ua: "Роздільний", en: "Split" },
};

const COLOR_META = {
  black: { ua: "Чорний", en: "Black" },
  red: { ua: "Червоний", en: "Red" },
  white: { ua: "Білий", en: "White" },
  beige: { ua: "Бежевий", en: "Beige" },
  silver: { ua: "Срібний", en: "Silver" },
};

const MATERIAL_META = {
  leather: { ua: "Натуральна шкіра", en: "Leather" },
  satin: { ua: "Сатин", en: "Satin" },
  synthetic: { ua: "Синтетика", en: "Synthetic" },
  microfiber: { ua: "Мікрофібра", en: "Microfiber" },
  "premium-suede": { ua: "Преміальна замша", en: "Premium Suede" },
};

function localized(ua, en = ua) {
  return { ua, en };
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample(arr, count) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < count) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function makeSelectCharacteristic(key, rawValue, label, unit = null) {
  return {
    key,
    type: "select",
    unit,
    value: { value: rawValue, label },
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
      value: !!boolValue,
      label: localized(String(!!boolValue), String(!!boolValue)),
    },
    values: [],
  };
}

function makeNumberCharacteristic(key, value, unit = null) {
  return {
    key,
    type: "number",
    unit,
    value,
    values: [],
  };
}

function getImage(seed, w = 900, h = 1200) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

function buildGallery(seedBase, title) {
  return [
    {
      url: getImage(`${seedBase}-1`),
      alt: localized(title.ua, title.en),
      sort: 0,
      isMain: true,
    },
    {
      url: getImage(`${seedBase}-2`),
      alt: localized(`${title.ua} фото 2`, `${title.en} photo 2`),
      sort: 1,
      isMain: false,
    },
    {
      url: getImage(`${seedBase}-3`),
      alt: localized(`${title.ua} фото 3`, `${title.en} photo 3`),
      sort: 2,
      isMain: false,
    },
    {
      url: getImage(`${seedBase}-4`),
      alt: localized(`${title.ua} фото 4`, `${title.en} photo 4`),
      sort: 3,
      isMain: false,
    },
  ];
}

function buildSizeChart(seedBase) {
  return {
    imageUrl: getImage(`${seedBase}-size-chart`, 1000, 700),
    title: localized("Розмірна сітка", "Size chart"),
    description: localized(
      "Допоміжна таблиця для підбору правильного розміру стельки.",
      "Guide for choosing the correct insole size."
    ),
  };
}

function buildContentSections({ title, heelHeight, materialLabel }) {
  return [
    {
      key: "description",
      title: localized("ОПИС МОДЕЛІ", "MODEL DESCRIPTION"),
      content: localized(
        `Професійні туфлі для High Heels ${title.ua} з покращеною підтримкою гомілки та стабільною посадкою. Створені для тренувань, виступів і сценічної роботи.`,
        `${title.en} professional High Heels shoes with improved ankle support and stable fit. Designed for training, performance and stage work.`
      ),
      sort: 10,
    },
    {
      key: "specs",
      title: localized("ХАРАКТЕРИСТИКА МОДЕЛІ", "MODEL SPECS"),
      content: localized(
        `Висота підборів ${heelHeight} см; Матеріал: ${materialLabel.ua}; Підошва адаптована для контрольованого ковзання та впевненого балансу.`,
        `Heel height ${heelHeight} cm; Material: ${materialLabel.en}; Sole is adapted for controlled sliding and stable balance.`
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

function buildGroupCharacteristics({ materialKey, categoryTitle, isNew, isSale }) {
  return [
    makeStringCharacteristic(
      "subtitle",
      `Модель для ${categoryTitle.ua.toLowerCase()} та сценічних виступів`,
      `Model for ${categoryTitle.en.toLowerCase()} and stage performance`
    ),
    makeSelectCharacteristic(
      "material",
      materialKey,
      localized(MATERIAL_META[materialKey].ua, MATERIAL_META[materialKey].en)
    ),
    makeBooleanCharacteristic("isNew", isNew),
    makeBooleanCharacteristic("isSale", isSale),
    makeMultiCharacteristic("audience", [
      { value: "women", label: localized("Жінки", "Women") },
    ]),
    makeSelectCharacteristic("brand", BRAND, localized(BRAND, BRAND)),
  ];
}

function buildAccessoryCharacteristics() {
  return [
    makeSelectCharacteristic("brand", BRAND, localized(BRAND, BRAND)),
    makeSelectCharacteristic(
      "material",
      "synthetic",
      localized("Синтетика", "Synthetic")
    ),
    makeMultiCharacteristic("audience", [
      { value: "women", label: localized("Жінки", "Women") },
    ]),
    makeBooleanCharacteristic("isAccessory", true),
  ];
}

function buildVariationAxes() {
  return [
    {
      axisId: "A1",
      title: localized("Колір", "Color"),
      type: "select",
      unit: null,
      valuesPreset: Object.keys(COLOR_META).map((key) => ({
        value: key,
        label: localized(COLOR_META[key].ua, COLOR_META[key].en),
      })),
    },
    {
      axisId: "A2",
      title: localized("Розмір стельки", "Insole size"),
      type: "number",
      unit: "cm",
      valuesPreset: INSOLE_SIZES,
    },
    {
      axisId: "A3",
      title: localized("Тип каблука", "Heel type"),
      type: "select",
      unit: null,
      valuesPreset: Object.keys(HEEL_TYPE_META).map((key) => ({
        value: key,
        label: localized(HEEL_TYPE_META[key].ua, HEEL_TYPE_META[key].en),
      })),
    },
    {
      axisId: "A4",
      title: localized("Довжина каблука", "Heel height"),
      type: "number",
      unit: "cm",
      valuesPreset: [7, 9, 10, 11],
    },
    {
      axisId: "A5",
      title: localized("Тип підошви", "Sole type"),
      type: "select",
      unit: null,
      valuesPreset: Object.keys(SOLE_TYPE_META).map((key) => ({
        value: key,
        label: localized(SOLE_TYPE_META[key].ua, SOLE_TYPE_META[key].en),
      })),
    },
  ];
}

function getAllowedSizesByColor(color) {
  if (color === "white") return INSOLE_SIZES.filter((x) => x <= 25.5);
  if (color === "silver") return INSOLE_SIZES.filter((x) => x >= 23.5 && x <= 26.0);
  return [...INSOLE_SIZES];
}

function getAllowedHeelTypes(size, categoryKey) {
  if (categoryKey === "training") {
    if (size <= 23.5) return ["straight"];
    return ["straight", "flare"];
  }

  if (categoryKey === "high-heels") {
    if (size <= 23.5) return ["flare"];
    return ["straight", "flare", "triangle"];
  }

  if (categoryKey === "professional") {
    if (size <= 23.5) return ["flare", "triangle"];
    return ["straight", "flare", "triangle"];
  }

  return ["straight", "flare"];
}

function getAllowedHeelHeights(heelType, categoryKey) {
  const map = {
    training: {
      straight: [7],
      flare: [7, 9],
      triangle: [],
    },
    "high-heels": {
      straight: [7, 9],
      flare: [9],
      triangle: [11],
    },
    professional: {
      straight: [9, 10],
      flare: [9, 10],
      triangle: [11],
    },
  };

  return map[categoryKey]?.[heelType] || [];
}

function getAllowedSoleTypes(heelHeight) {
  if (heelHeight >= 10) return ["suede", "standard"];
  return ["suede", "standard", "split"];
}

function buildOfferCharacteristics({ color, heelType, heelHeight, soleType, isNew }) {
  const tags = [];
  if (isNew) tags.push({ value: "new", label: localized("Новинка", "New") });
  if (heelHeight >= 10) tags.push({ value: "stage", label: localized("Сцена", "Stage") });

  return [
    makeSelectCharacteristic("color", color, localized(COLOR_META[color].ua, COLOR_META[color].en)),
    makeSelectCharacteristic(
      "heelType",
      heelType,
      localized(HEEL_TYPE_META[heelType].ua, HEEL_TYPE_META[heelType].en)
    ),
    makeNumberCharacteristic("heelHeight", heelHeight, "cm"),
    makeSelectCharacteristic(
      "soleType",
      soleType,
      localized(SOLE_TYPE_META[soleType].ua, SOLE_TYPE_META[soleType].en)
    ),
    makeMultiCharacteristic("tags", tags),
  ];
}

function buildAccessoryOfferCharacteristics() {
  return [
    makeSelectCharacteristic("color", "transparent", localized("Прозорий", "Transparent")),
  ];
}

function buildOptionKey(optionMap) {
  return `A1:${optionMap.A1}|A2:${optionMap.A2}|A3:${optionMap.A3}|A4:${optionMap.A4}|A5:${optionMap.A5}`;
}

function generateOfferCombos(categoryKey, colors) {
  const combos = [];
  const pickedColors = sample(colors, Math.min(colors.length, rand(2, 4)));

  for (const color of pickedColors) {
    const sizes = sample(getAllowedSizesByColor(color), rand(2, 4));

    for (const size of sizes) {
      const heelTypes = getAllowedHeelTypes(size, categoryKey);
      if (!heelTypes.length) continue;

      const heelType = pick(heelTypes);
      const heights = getAllowedHeelHeights(heelType, categoryKey);
      if (!heights.length) continue;

      const heelHeight = pick(heights);
      const soleType = pick(getAllowedSoleTypes(heelHeight));

      combos.push({ color, size, heelType, heelHeight, soleType });
    }
  }

  const map = new Map();
  for (const combo of combos) {
    const key = `${combo.color}|${combo.size}|${combo.heelType}|${combo.heelHeight}|${combo.soleType}`;
    if (!map.has(key)) map.set(key, combo);
  }

  return [...map.values()];
}

async function ensureWarehouse(code, name, isDefault = false) {
  return Warehouse.findOneAndUpdate(
    { code },
    {
      $set: {
        code,
        name,
        address: `${name}, test address`,
        isActive: true,
        isDefault,
      },
    },
    { upsert: true, new: true }
  );
}

async function ensureCategory({ parentId = null, slug, title, path, ancestors, sort = 0 }) {
  return Category.findOneAndUpdate(
    { parentId, slug },
    {
      $set: {
        parentId,
        slug,
        title,
        description: localized("", ""),
        path,
        ancestors,
        sort,
        status: "active",
      },
    },
    { upsert: true, new: true }
  );
}

async function seedCharacteristicMeta() {
  const docs = [
    {
      key: "subtitle",
      title: localized("Підзаголовок", "Subtitle"),
      type: "string",
      unit: null,
      valuesPreset: [],
      scope: "group",
      filterable: false,
      searchable: true,
      sort: 1,
      status: "active",
    },
    {
      key: "material",
      title: localized("Матеріал", "Material"),
      type: "select",
      unit: null,
      valuesPreset: Object.entries(MATERIAL_META).map(([value, meta]) => ({
        value,
        label: localized(meta.ua, meta.en),
      })),
      scope: "group",
      filterable: true,
      searchable: true,
      sort: 10,
      status: "active",
    },
    {
      key: "brand",
      title: localized("Бренд", "Brand"),
      type: "select",
      unit: null,
      valuesPreset: [{ value: BRAND, label: localized(BRAND, BRAND) }],
      scope: "group",
      filterable: true,
      searchable: true,
      sort: 20,
      status: "active",
    },
    {
      key: "isNew",
      title: localized("Новинка", "Is new"),
      type: "boolean",
      unit: null,
      valuesPreset: [],
      scope: "group",
      filterable: true,
      searchable: false,
      sort: 30,
      status: "active",
    },
    {
      key: "isSale",
      title: localized("Акція", "Sale"),
      type: "boolean",
      unit: null,
      valuesPreset: [],
      scope: "group",
      filterable: true,
      searchable: false,
      sort: 40,
      status: "active",
    },
    {
      key: "isAccessory",
      title: localized("Аксесуар", "Accessory"),
      type: "boolean",
      unit: null,
      valuesPreset: [],
      scope: "group",
      filterable: true,
      searchable: false,
      sort: 45,
      status: "active",
    },
    {
      key: "color",
      title: localized("Колір", "Color"),
      type: "select",
      unit: null,
      valuesPreset: [
        ...Object.entries(COLOR_META).map(([value, meta]) => ({
          value,
          label: localized(meta.ua, meta.en),
        })),
        { value: "transparent", label: localized("Прозорий", "Transparent") },
      ],
      scope: "offer",
      filterable: true,
      searchable: false,
      sort: 50,
      status: "active",
    },
    {
      key: "heelType",
      title: localized("Тип каблука", "Heel type"),
      type: "select",
      unit: null,
      valuesPreset: Object.entries(HEEL_TYPE_META).map(([value, meta]) => ({
        value,
        label: localized(meta.ua, meta.en),
      })),
      scope: "offer",
      filterable: true,
      searchable: false,
      sort: 60,
      status: "active",
    },
    {
      key: "heelHeight",
      title: localized("Довжина каблука", "Heel height"),
      type: "number",
      unit: "cm",
      valuesPreset: [7, 9, 10, 11],
      scope: "offer",
      filterable: true,
      searchable: false,
      sort: 70,
      status: "active",
    },
    {
      key: "soleType",
      title: localized("Тип підошви", "Sole type"),
      type: "select",
      unit: null,
      valuesPreset: Object.entries(SOLE_TYPE_META).map(([value, meta]) => ({
        value,
        label: localized(meta.ua, meta.en),
      })),
      scope: "offer",
      filterable: true,
      searchable: false,
      sort: 80,
      status: "active",
    },
    {
      key: "tags",
      title: localized("Теги", "Tags"),
      type: "multiselect",
      unit: null,
      valuesPreset: [
        { value: "new", label: localized("Новинка", "New") },
        { value: "stage", label: localized("Сцена", "Stage") },
      ],
      scope: "offer",
      filterable: true,
      searchable: false,
      sort: 90,
      status: "active",
    },
  ];

  for (const doc of docs) {
    await CharacteristicMeta.findOneAndUpdate(
      { key: doc.key },
      { $set: doc },
      { upsert: true, new: true }
    );
  }
}

async function seedCategories() {
  const root = await ensureCategory({
    slug: ROOT_SLUG,
    title: localized("Танцювальні хилси", "Dance Heels"),
    path: [ROOT_SLUG],
    ancestors: [],
    sort: 1,
  });

  const women = await ensureCategory({
    parentId: root._id,
    slug: "women",
    title: localized("Жіноче взуття", "Women Shoes"),
    path: [ROOT_SLUG, "women"],
    ancestors: [root._id],
    sort: 10,
  });

  const sale = await ensureCategory({
    parentId: root._id,
    slug: "sale",
    title: localized("Знижки", "Sale"),
    path: [ROOT_SLUG, "sale"],
    ancestors: [root._id],
    sort: 20,
  });

  const accessories = await ensureCategory({
    parentId: root._id,
    slug: "accessories",
    title: localized("Аксесуари", "Accessories"),
    path: [ROOT_SLUG, "accessories"],
    ancestors: [root._id],
    sort: 30,
  });

  const leafCategories = {};
  let sort = 100;

  for (const cfg of CATEGORY_CONFIG) {
    leafCategories[cfg.key] = await ensureCategory({
      parentId: women._id,
      slug: cfg.key,
      title: cfg.title,
      path: [ROOT_SLUG, "women", cfg.key],
      ancestors: [root._id, women._id],
      sort: sort++,
    });
  }

  return { root, women, sale, accessories, leafCategories };
}

function calcBasePrice(cfg, index) {
  const spread = cfg.priceMax - cfg.priceMin;
  return cfg.priceMin + ((index * 97) % spread);
}

function calcOfferPrice(basePrice, heelHeight, materialKey, soleType) {
  let price = basePrice;
  if (heelHeight >= 9) price += 180;
  if (heelHeight >= 10) price += 120;
  if (materialKey === "premium-suede") price += 300;
  if (materialKey === "leather") price += 220;
  if (materialKey === "satin") price += 120;
  if (soleType === "suede") price += 90;
  return Math.round(price / 10) * 10;
}

function buildReviewsText(index) {
  const variants = [
    {
      author: "Марія",
      text: "Найкраща пара для тренувань. Підбори відчуваються як продовження стопи.",
    },
    {
      author: "Анна",
      text: "Дуже гарні, але на вузьку ногу. Якість шкіри вражає — мʼяка і приємна до тіла.",
    },
    {
      author: "Вікторія",
      text: "Взяла для виступів. Взула і забула про дискомфорт. Глянцеве покриття виглядає дуже дорого.",
    },
    {
      author: "Олена",
      text: "Сидять щільно, крок стабільний, на сцені дуже впевнено.",
    },
    {
      author: "Дарина",
      text: "Дуже комфортні, гарно тримають ногу і виглядають ефектно.",
    },
  ];

  return variants[index % variants.length];
}

async function clearExistingSeedData() {
  const categorySlugs = [
    ROOT_SLUG,
    "women",
    "sale",
    "accessories",
    ...CATEGORY_CONFIG.map((x) => x.key),
  ];

  const categories = await Category.find({ slug: { $in: categorySlugs } }).select("_id");
  const categoryIds = categories.map((x) => x._id);

  const seedGroups = await ProductGroup.find({
    $or: [
      { slug: new RegExp("^(high-heels|training|professional)-", "i") },
      { slug: { $in: ACCESSORY_CONFIG.map((x) => x.slug) } },
      { categoryIds: { $in: categoryIds } },
    ],
  }).select("_id slug");

  const groupIds = seedGroups.map((x) => x._id);

  if (groupIds.length) {
    await Offer.deleteMany({ groupId: { $in: groupIds } });
    await ReviewModel.deleteMany({ product: { $in: groupIds } });
    await ProductGroup.deleteMany({ _id: { $in: groupIds } });
  }
}

async function createAccessoryProductGroups(accessoriesCategoryId, warehouseId) {
  const result = [];

  for (const item of ACCESSORY_CONFIG) {
    const gallery = buildGallery(item.slug, item.title);

    const group = await ProductGroup.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          slug: item.slug,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          categoryIds: [accessoriesCategoryId],
          imageURL: getImage(item.imageSeed),
          gallery,
          sizeChart: {
            imageUrl: "",
            title: localized("", ""),
            description: localized("", ""),
          },
          contentSections: [
            {
              key: "description",
              title: localized("ОПИС", "DESCRIPTION"),
              content: item.description,
              sort: 10,
            },
            {
              key: "shipping",
              title: localized("ОПЛАТА І ДОСТАВКА", "PAYMENT & SHIPPING"),
              content: localized(
                "Відправка Новою Поштою по всій Україні. Аксесуар можна додати до основного замовлення.",
                "Nova Poshta shipping across Ukraine. This accessory can be added to the main order."
              ),
              sort: 20,
            },
          ],
          variationAxes: [],
          characteristics: buildAccessoryCharacteristics(),
          accessories: [],
          relatedProductIds: [],
          reviews: [],
          ratingSummary: { average: 0, count: 0 },
          status: "active",
        },
      },
      { upsert: true, new: true }
    );

    await Offer.deleteMany({ groupId: group._id });

    await Offer.create({
      groupId: group._id,
      sku: `ACC-${item.slug.toUpperCase().replace(/-/g, "_")}`,
      price: item.price,
      opt_price: item.opt_price,
      available: true,
      img: getImage(item.imageSeed),
      optionValues: [],
      optionKey: "default",
      optionMap: {},
      stocks: [
        {
          warehouseId,
          onHand: rand(10, 30),
          reserved: 0,
        },
      ],
      characteristics: buildAccessoryOfferCharacteristics(),
    });

    result.push(group);
  }

  return result;
}

async function createReviewsForGroup(productGroupId, count = 3) {
  const reviewIds = [];
  let total = 0;

  for (let i = 0; i < count; i++) {
    const reviewSeed = buildReviewsText(i);
    const rating = i === 1 ? 4 : 5;

    const review = await ReviewModel.create({
      name: reviewSeed.author,
      product: productGroupId,
      photoUrl: "",
      text: reviewSeed.text,
      rating,
      status: "published",
      position: i,
      isVisibleProduct: true,
      isVisibleMainPage: i < 2,
    });

    reviewIds.push(review._id);
    total += rating;
  }

  return {
    reviewIds,
    ratingSummary: {
      average: Number((total / count).toFixed(1)),
      count,
    },
  };
}

function buildAccessoryLinks(accessoryGroups) {
  const picked = sample(accessoryGroups, Math.min(2, accessoryGroups.length));

  return picked.map((group, index) => ({
    productGroupId: group._id,
    title: group.title,
    subtitle: localized("Додаткові аксесуари", "Additional accessories"),
    imageUrl: group.imageURL,
    price: 0,
    selectedByDefault: index === 0,
  }));
}

async function createGroupWithOffers({
  cfg,
  categoryDoc,
  saleCategoryId,
  warehouses,
  index,
  accessoryGroups,
}) {
  const modelName = MODEL_NAMES[index % MODEL_NAMES.length];
  const title = localized(
    `${modelName.toUpperCase()} ${String(index + 1).padStart(3, "0")}`,
    `${modelName.toUpperCase()} ${String(index + 1).padStart(3, "0")}`
  );

  const slug = slugify(`${cfg.key}-${modelName}-${index + 1}`);

  const materialKey = pick(cfg.materials);
  const isNew = Math.random() < 0.35;
  const isSale = Math.random() < 0.28;

  const combos = generateOfferCombos(cfg.key, cfg.colors);
  const previewCombo = combos[0] || {
    color: "black",
    size: 23.5,
    heelType: "flare",
    heelHeight: 9,
    soleType: "standard",
  };

  let group = await ProductGroup.findOne({ slug });
  if (group) {
    await Offer.deleteMany({ groupId: group._id });
    await ReviewModel.deleteMany({ product: group._id });
  }

  group = await ProductGroup.findOneAndUpdate(
    { slug },
    {
      $set: {
        slug,
        title,
        subtitle: localized(
          "Професійні танцювальні хилси для тренувань та виступів",
          "Professional dance heels for training and stage work"
        ),
        description: localized(
          `Танцювальні хилси ${title.ua}. Створені для стабільної роботи стопи, акцентної лінії ноги та комфортного балансу під час руху.`,
          `Dance heels ${title.en}. Designed for stable footwork, a beautiful leg line and comfortable balance in motion.`
        ),
        categoryIds: isSale ? [categoryDoc._id, saleCategoryId] : [categoryDoc._id],
        imageURL: getImage(`${slug}-main`),
        gallery: buildGallery(slug, title),
        sizeChart: buildSizeChart(slug),
        contentSections: buildContentSections({
          title,
          heelHeight: previewCombo.heelHeight,
          materialLabel: MATERIAL_META[materialKey],
        }),
        variationAxes: buildVariationAxes(),
        characteristics: buildGroupCharacteristics({
          materialKey,
          categoryTitle: cfg.title,
          isNew,
          isSale,
        }),
        accessories: buildAccessoryLinks(accessoryGroups),
        relatedProductIds: [],
        reviews: [],
        ratingSummary: { average: 0, count: 0 },
        status: "active",
      },
    },
    { upsert: true, new: true }
  );

  const offerDocs = combos.map((combo, offerIndex) => {
    const basePrice = calcBasePrice(cfg, index);
    const price = calcOfferPrice(basePrice, combo.heelHeight, materialKey, combo.soleType);

    const optionMap = {
      A1: combo.color,
      A2: combo.size,
      A3: combo.heelType,
      A4: combo.heelHeight,
      A5: combo.soleType,
    };

    return {
      groupId: group._id,
      sku: `${cfg.key.toUpperCase().replace(/-/g, "")}-${String(index + 1).padStart(3, "0")}-${String(offerIndex + 1).padStart(2, "0")}`,
      price,
      opt_price: Math.round(price * 1.18),
      available: Math.random() > 0.1,
      img: group.imageURL,
      optionValues: [
        combo.color,
        combo.size,
        combo.heelType,
        combo.heelHeight,
        combo.soleType,
      ],
      optionKey: buildOptionKey(optionMap),
      optionMap,
      stocks: warehouses.map((wh, idx) => ({
        warehouseId: wh._id,
        onHand: idx === 0 ? rand(2, 14) : rand(0, 4),
        reserved: rand(0, 2),
      })),
      characteristics: buildOfferCharacteristics({
        color: combo.color,
        heelType: combo.heelType,
        heelHeight: combo.heelHeight,
        soleType: combo.soleType,
        isNew,
      }),
    };
  });

  if (offerDocs.length) {
    await Offer.insertMany(offerDocs, { ordered: false });
  }

  const { reviewIds, ratingSummary } = await createReviewsForGroup(group._id, rand(3, 5));

  group.reviews = reviewIds;
  group.ratingSummary = ratingSummary;
  await group.save();

  return group;
}

async function fillRecommendations() {
  const groups = await ProductGroup.find({
    status: "active",
    slug: { $regex: /^(high-heels|training|professional)-/i },
  }).sort({ createdAt: 1 });

  const byCategory = new Map();

  for (const group of groups) {
    const key = String(group.categoryIds?.[0] || "");
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(group);
  }

  for (const group of groups) {
    const key = String(group.categoryIds?.[0] || "");
    const pool = (byCategory.get(key) || []).filter(
      (item) => String(item._id) !== String(group._id)
    );

    const related = sample(pool, Math.min(6, pool.length)).map((item) => item._id);

    await ProductGroup.updateOne(
      { _id: group._id },
      { $set: { relatedProductIds: related } }
    );
  }
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Mongo connected");

  const warehouseMain = await ensureWarehouse("MAIN", "Основний склад", true);
  const warehouseStudio = await ensureWarehouse("SHOWROOM", "Шоурум", false);
  const warehouses = [warehouseMain, warehouseStudio];

  await seedCharacteristicMeta();

  const categories = await seedCategories();

  await clearExistingSeedData();

  const accessoryGroups = await createAccessoryProductGroups(
    categories.accessories._id,
    warehouseMain._id
  );

  console.log(`Accessories created: ${accessoryGroups.length}`);

  for (const cfg of CATEGORY_CONFIG) {
    console.log(`Seeding category: ${cfg.key}`);

    for (let i = 0; i < cfg.itemsCount; i++) {
      await createGroupWithOffers({
        cfg,
        categoryDoc: categories.leafCategories[cfg.key],
        saleCategoryId: categories.sale._id,
        warehouses,
        index: i,
        accessoryGroups,
      });

      if ((i + 1) % 10 === 0) {
        console.log(`  ${i + 1}/${cfg.itemsCount}`);
      }
    }
  }

  await fillRecommendations();

  const groupsCount = await ProductGroup.countDocuments();
  const offersCount = await Offer.countDocuments();
  const reviewsCount = await ReviewModel.countDocuments();

  console.log("Seed completed");
  console.log(`Product groups total: ${groupsCount}`);
  console.log(`Offers total: ${offersCount}`);
  console.log(`Reviews total: ${reviewsCount}`);

  await mongoose.disconnect();
  console.log("Mongo disconnected");
}

run().catch(async (err) => {
  console.error("Seed error:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});