// src/scripts/seed-systems-flat.js
import mongoose from "mongoose";

// ✅ Подстрой пути под свою структуру проекта:
import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://structurelab26_db_user:bnS43anwQdWZwsTA@cluster0.oriv823.mongodb.net/?appName=Cluster0";

const oid = (hex) => new mongoose.Types.ObjectId(hex);

function optionKeyFromValues(optionValues = []) {
  // ✅ чтобы НЕ было "\"orange\"|30"
  return optionValues.map((v) => String(v)).join("|");
}

async function upsertCategory(doc) {
  // плоская категория — уникальность по slug
  return Category.findOneAndUpdate(
    { slug: doc.slug },
    { $set: { ...doc } },
    { upsert: true, new: true }
  );
}

async function upsertGroup(doc) {
  return ProductGroup.findOneAndUpdate(
    { slug: doc.slug },
    { $set: { ...doc } },
    { upsert: true, new: true }
  );
}

async function upsertOffer(doc) {
  return Offer.findOneAndUpdate(
    { sku: doc.sku },
    { $set: { ...doc } },
    { upsert: true, new: true }
  );
}

// =====================
// 1) Flat categories
// =====================
const CAT = {
  skin: oid("696f9c4ab7919bf78623d901"),
  hair: oid("696f9c4ab7919bf78623d902"),
  balance: oid("696f9c4ab7919bf78623d903"),
  stress: oid("696f9c4ab7919bf78623d904"),
  gut: oid("696f9c4ab7919bf78623d905"),
  segment: oid("696f9c4ab7919bf78623d906"),
};

const categories = [
  {
    _id: CAT.skin,
    parentId: null,
    slug: "skin-structure",
    title: { ua: "Skin Structure", ru: "Skin Structure" },
    status: "active",
    sort: 10,
    path: ["skin-structure"],
    ancestors: [],
  },
  {
    _id: CAT.hair,
    parentId: null,
    slug: "hair-structure",
    title: { ua: "Hair Structure", ru: "Hair Structure" },
    status: "active",
    sort: 20,
    path: ["hair-structure"],
    ancestors: [],
  },
  {
    _id: CAT.balance,
    parentId: null,
    slug: "balance-structure",
    title: { ua: "Balance Structure", ru: "Balance Structure" },
    status: "active",
    sort: 30,
    path: ["balance-structure"],
    ancestors: [],
  },
  {
    _id: CAT.stress,
    parentId: null,
    slug: "stress-structure",
    title: { ua: "Stress Structure", ru: "Stress Structure" },
    status: "active",
    sort: 40,
    path: ["stress-structure"],
    ancestors: [],
  },
  {
    _id: CAT.gut,
    parentId: null,
    slug: "gut-structure",
    title: { ua: "Gut Structure", ru: "Gut Structure" },
    status: "active",
    sort: 50,
    path: ["gut-structure"],
    ancestors: [],
  },
  {
    _id: CAT.segment,
    parentId: null,
    slug: "women-men-40",
    title: { ua: "Women / Men / 40+", ru: "Women / Men / 40+" },
    status: "active",
    sort: 60,
    path: ["women-men-40"],
    ancestors: [],
  },
];

// =====================
// 2) ProductGroups
// =====================
const groups = [
  // Hyaluronic Acid Complex (Skin)
  {
    _id: oid("696f9c4bb7919bf78623d892"),
    slug: "hyaluronic-acid-complex",
    title: { ua: "Hyaluronic Acid Complex", ru: "Hyaluronic Acid Complex" },
    imageURL: "https://cdn.site/demo/shampoo/cover.webp",
    categoryIds: [CAT.skin],
    status: "active",
    variationAxes: [],
    characteristics: [
      { key: "brand", type: "select", unit: null, value: "California Gold Nutrition", values: [] },
      { key: "subtitle", type: "string", unit: null, value: "Глибоке зволоження, 60 капс.", values: [] },
    ],
  },

  // Collagen Peptides + C (Skin) — на карточке скидка -10%
  {
    _id: oid("696f9c4bb7919bf78623d891"),
    slug: "collagen-peptides-plus-c",
    title: { ua: "Collagen Peptides + C", ru: "Collagen Peptides + C" },
    imageURL: "https://cdn.site/demo/collagen/cover.webp",
    categoryIds: [CAT.skin],
    status: "active",
    variationAxes: [
      {
        axisId: "A1",
        title: { ua: "Порцій", ru: "Порций" },
        type: "number",
        unit: "serv",
        valuesPreset: [30],
      },
    ],
    characteristics: [
      { key: "brand", type: "select", unit: null, value: "MST", values: [] },
      { key: "subtitle", type: "string", unit: null, value: "Морський колаген, 30 порцій", values: [] },
      { key: "discount", type: "number", unit: "%", value: 10, values: [] },
    ],
  },

  // Hair Growth Activator (Hair)
  {
    _id: oid("696f9c4bb7919bf78623d890"),
    slug: "hair-growth-activator",
    title: { ua: "Hair Growth Activator", ru: "Hair Growth Activator" },
    imageURL: "https://cdn.site/demo/hair/cover.webp",
    categoryIds: [CAT.hair],
    status: "active",
    variationAxes: [],
    characteristics: [
      { key: "subtitle", type: "string", unit: null, value: "Біотин та мінерали, 90 капс.", values: [] },
    ],
  },

  // Immune Defence Shield (Gut)
  {
    _id: oid("696f9c4bb7919bf78623d88f"),
    slug: "immune-defence-shield",
    title: { ua: "Immune Defence Shield", ru: "Immune Defence Shield" },
    imageURL: "https://cdn.site/demo/immune/cover.webp",
    categoryIds: [CAT.gut],
    status: "active",
    variationAxes: [],
    characteristics: [
      { key: "subtitle", type: "string", unit: null, value: "Вітамін D3 + Цинк + C, 60 капс.", values: [] },
    ],
  },

  // Vitamin C Liposomal (на твоём реальном JSON есть вариации: вкус + количество)
  {
    _id: oid("696f9c4bb7919bf78623d88d"),
    slug: "vitamin-c-liposomal",
    title: { ua: "Вітамін C Ліпосомальний", ru: "Витамин C Липосомальный" },
    imageURL: "https://cdn.site/demo/vitc/cover.webp",
    categoryIds: [CAT.gut],
    status: "active",
    variationAxes: [
      { axisId: "A1", title: { ua: "Смак", ru: "Вкус" }, type: "select", unit: null, valuesPreset: ["orange", "berry"] },
      { axisId: "A2", title: { ua: "Кількість", ru: "Количество" }, type: "number", unit: "caps", valuesPreset: [30, 60] },
    ],
    characteristics: [
      { key: "subtitle", type: "string", unit: null, value: "Ліпосомальний вітамін C", values: [] },
    ],
  },

  // Candle Minimal (Stress)
  {
    _id: oid("696f9c4bb7919bf78623d889"),
    slug: "candle-minimal",
    title: { ua: "Свічка Minimal", ru: "Свеча Minimal" },
    imageURL: "https://cdn.site/demo/candle/cover.webp",
    categoryIds: [CAT.stress],
    status: "active",
    variationAxes: [
      { axisId: "A1", title: { ua: "Колір", ru: "Цвет" }, type: "select", unit: null, valuesPreset: ["black", "white", "beige"] },
    ],
    characteristics: [
      { key: "subtitle", type: "string", unit: null, value: "Аромасвічка", values: [] },
    ],
  },

  // Hand Soap Neutral (Skin)
  {
    _id: oid("696f9c4bb7919bf78623d887"),
    slug: "hand-soap-neutral",
    title: { ua: "Рідке мило Neutral", ru: "Жидкое мыло Neutral" },
    imageURL: "https://cdn.site/demo/soap/cover.webp",
    categoryIds: [CAT.skin],
    status: "active",
    variationAxes: [],
    characteristics: [
      { key: "subtitle", type: "string", unit: null, value: "Делікатний догляд для рук", values: [] },
    ],
  },
];

// =====================
// 3) Offers (SKU)
// =====================
const offers = [
  // Hyaluronic (1 sku) — цена 3450
  {
    _id: oid("696f9c4bb7919bf78623d8a1"),
    groupId: oid("696f9c4bb7919bf78623d892"),
    sku: "HYA-COMPLEX-60",
    price: 3450,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/shampoo/cover.webp",
    optionValues: [],
  },

  // Collagen (30 порций) — 1341 (старая 1490)
  {
    _id: oid("696f9c4bb7919bf78623d8a2"),
    groupId: oid("696f9c4bb7919bf78623d891"),
    sku: "COLLAGEN-C-30",
    price: 1341,
    opt_price: 1490,
    available: true,
    img: "https://cdn.site/demo/collagen/30.webp",
    optionValues: [30],
  },

  // Hair Growth Activator — 2100
  {
    _id: oid("696f9c4bb7919bf78623d8a4"),
    groupId: oid("696f9c4bb7919bf78623d890"),
    sku: "HAIR-GROWTH-90",
    price: 2100,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/hair/90.webp",
    optionValues: [],
  },

  // Immune Defence — 698
  {
    _id: oid("696f9c4bb7919bf78623d8a6"),
    groupId: oid("696f9c4bb7919bf78623d88f"),
    sku: "IMMUNE-SHIELD-60",
    price: 698,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/immune/60.webp",
    optionValues: [],
  },

  // Vitamin C Liposomal variants (taste + caps)
  {
    _id: oid("696f9aeab7919bf78623d860"), // как у тебя в примере
    groupId: oid("696f9c4bb7919bf78623d88d"),
    sku: "VITC-ORANGE-30",
    price: 490,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/vitc/orange-30.webp",
    optionValues: ["orange", 30],
  },
  {
    _id: oid("696f9c4bb7919bf78623d8b1"),
    groupId: oid("696f9c4bb7919bf78623d88d"),
    sku: "VITC-ORANGE-60",
    price: 790,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/vitc/orange-60.webp",
    optionValues: ["orange", 60],
  },
  {
    _id: oid("696f9c4bb7919bf78623d8b2"),
    groupId: oid("696f9c4bb7919bf78623d88d"),
    sku: "VITC-BERRY-30",
    price: 520,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/vitc/berry-30.webp",
    optionValues: ["berry", 30],
  },
  {
    _id: oid("696f9c4bb7919bf78623d8b3"),
    groupId: oid("696f9c4bb7919bf78623d88d"),
    sku: "VITC-BERRY-60",
    price: 820,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/vitc/berry-60.webp",
    optionValues: ["berry", 60],
  },

  // Candle colors
  {
    _id: oid("696f9c4bb7919bf78623d8a8"),
    groupId: oid("696f9c4bb7919bf78623d889"),
    sku: "CANDLE-MINIMAL-BLACK",
    price: 280,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/candle/black.webp",
    optionValues: ["black"],
  },
  {
    _id: oid("696f9c4bb7919bf78623d8aa"),
    groupId: oid("696f9c4bb7919bf78623d889"),
    sku: "CANDLE-MINIMAL-WHITE",
    price: 260,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/candle/white.webp",
    optionValues: ["white"],
  },
  {
    _id: oid("696f9c4bb7919bf78623d8a9"),
    groupId: oid("696f9c4bb7919bf78623d889"),
    sku: "CANDLE-MINIMAL-BEIGE",
    price: 270,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/candle/beige.webp",
    optionValues: ["beige"],
  },

  // Soap (single)
  {
    _id: oid("696f9c4bb7919bf78623d8ab"),
    groupId: oid("696f9c4bb7919bf78623d887"),
    sku: "SOAP-NEUTRAL-1",
    price: 190,
    opt_price: null,
    available: true,
    img: "https://cdn.site/demo/soap/cover.webp",
    optionValues: [],
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI, {
    dbName: process.env.MONGODB_DBNAME || undefined,
  });

  // 1) categories
  for (const c of categories) {
    await upsertCategory(c);
  }

  // 2) groups
  for (const g of groups) {
    await upsertGroup(g);
  }

  // 3) offers + optionKey
  for (const o of offers) {
    const optionKey = optionKeyFromValues(o.optionValues);
    await upsertOffer({ ...o, optionKey });
  }

  console.log("✅ Seed done:", {
    categories: categories.length,
    groups: groups.length,
    offers: offers.length,
  });

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("❌ Seed error:", e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
