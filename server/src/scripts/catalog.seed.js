/* eslint-disable no-console */
import mongoose from "mongoose";
import crypto from "crypto";

import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";

// =============================
// CONFIG
// =============================
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";

// =============================
// helpers
// =============================
const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "-");

const title = (ua, ru) => ({ ua, ru });

// function optionKey(optionValues) {
//   // стабильный ключ: 250|"rose"|"bottle"
//   return optionValues
//     .map((v) => (typeof v === "string" ? JSON.stringify(v) : String(v)))
//     .join("|");
// }

function optionKey(optionValues) {
  return optionValues.map(v => String(v)).join("|");
}


function sku(prefix, optionValues) {
  // пример: KPRO-250-ROSE-BTL
  const parts = optionValues.map((v) => String(v).toUpperCase().replace(/[^A-Z0-9]+/g, ""));
  return [prefix, ...parts].join("-").replace(/-+/g, "-");
}

async function upsertCategory({ parentId, slug, titleUA, titleRU, sort = 0 }) {
  const parent = parentId ? await Category.findById(parentId).lean() : null;

  const path = parent ? [...(parent.path || []), slug] : [slug];
  const ancestors = parent ? [...(parent.ancestors || []), parent._id] : [];

  const doc = await Category.findOneAndUpdate(
    { parentId: parentId ?? null, slug },
    {
      $set: {
        parentId: parentId ?? null,
        slug,
        title: title(titleUA, titleRU),
        path,
        ancestors,
        status: "active",
        sort,
      },
    },
    { new: true, upsert: true }
  ).lean();

  return doc;
}

async function upsertGroup({ slug, titleUA, titleRU, categoryIds, imageURL, variationAxes, status = "active" }) {
  const doc = await ProductGroup.findOneAndUpdate(
    { slug },
    {
      $set: {
        slug,
        title: title(titleUA, titleRU),
        categoryIds,
        imageURL,
        variationAxes,
        status,
      },
    },
    { new: true, upsert: true }
  ).lean();

  return doc;
}

async function upsertOffer({ groupId, sku: skuValue, price, available, optionValues = [], img = "" }) {
  const key = optionKey(optionValues);

  const doc = await Offer.findOneAndUpdate(
    { groupId, optionKey: key },
    {
      $set: {
        groupId,
        sku: skuValue,
        price,
        available,
        optionValues,
        optionKey: key,
        img,
      },
    },
    { new: true, upsert: true }
  ).lean();

  return doc;
}

// =============================
// SEED
// =============================
async function seedCategories() {
  // Level 1
  const cosmetics = await upsertCategory({
    parentId: null,
    slug: "cosmetics",
    titleUA: "Косметика",
    titleRU: "Косметика",
    sort: 10,
  });

  const supplements = await upsertCategory({
    parentId: null,
    slug: "supplements",
    titleUA: "БАДи",
    titleRU: "БАДы",
    sort: 20,
  });

  const home = await upsertCategory({
    parentId: null,
    slug: "home",
    titleUA: "Дім",
    titleRU: "Дом",
    sort: 30,
  });

  // Level 2 (под cosmetics)
  const hair = await upsertCategory({
    parentId: cosmetics._id,
    slug: "hair",
    titleUA: "Волосся",
    titleRU: "Волосы",
    sort: 10,
  });

  const face = await upsertCategory({
    parentId: cosmetics._id,
    slug: "face",
    titleUA: "Обличчя",
    titleRU: "Лицо",
    sort: 20,
  });

  // Level 3 (под hair)
  const shampoo = await upsertCategory({
    parentId: hair._id,
    slug: "shampoo",
    titleUA: "Шампуні",
    titleRU: "Шампуни",
    sort: 10,
  });

  const conditioner = await upsertCategory({
    parentId: hair._id,
    slug: "conditioner",
    titleUA: "Кондиціонери",
    titleRU: "Кондиционеры",
    sort: 20,
  });

  // Level 3 (под face)
  const cleansing = await upsertCategory({
    parentId: face._id,
    slug: "cleansing",
    titleUA: "Очищення",
    titleRU: "Очищение",
    sort: 10,
  });

  const serum = await upsertCategory({
    parentId: face._id,
    slug: "serum",
    titleUA: "Сироватки",
    titleRU: "Сыворотки",
    sort: 20,
  });

  // Level 2 (под supplements)
  const vitamins = await upsertCategory({
    parentId: supplements._id,
    slug: "vitamins",
    titleUA: "Вітаміни",
    titleRU: "Витамины",
    sort: 10,
  });

  const minerals = await upsertCategory({
    parentId: supplements._id,
    slug: "minerals",
    titleUA: "Мінерали",
    titleRU: "Минералы",
    sort: 20,
  });

  // Level 3 (под vitamins)
  const vitaminC = await upsertCategory({
    parentId: vitamins._id,
    slug: "vitamin-c",
    titleUA: "Вітамін C",
    titleRU: "Витамин C",
    sort: 10,
  });

  const vitaminD = await upsertCategory({
    parentId: vitamins._id,
    slug: "vitamin-d",
    titleUA: "Вітамін D",
    titleRU: "Витамин D",
    sort: 20,
  });

  // Level 2 (под home)
  const aroma = await upsertCategory({
    parentId: home._id,
    slug: "aroma",
    titleUA: "Арома",
    titleRU: "Арома",
    sort: 10,
  });

  // Level 3 (под aroma)
  const candles = await upsertCategory({
    parentId: aroma._id,
    slug: "candles",
    titleUA: "Свічки",
    titleRU: "Свечи",
    sort: 10,
  });

  const diffusers = await upsertCategory({
    parentId: aroma._id,
    slug: "diffusers",
    titleUA: "Дифузори",
    titleRU: "Диффузоры",
    sort: 20,
  });

  return {
    ids: {
      cosmetics,
      supplements,
      home,
      hair,
      face,
      shampoo,
      conditioner,
      cleansing,
      serum,
      vitamins,
      minerals,
      vitaminC,
      vitaminD,
      aroma,
      candles,
      diffusers,
    },
  };
}

async function seedProducts({ ids }) {
  // =============================
  // 0 axes (single offer)
  // =============================
  const groupSoap = await upsertGroup({
    slug: "hand-soap-neutral",
    titleUA: "Рідке мило Neutral",
    titleRU: "Жидкое мыло Neutral",
    categoryIds: [ids.home._id],
    imageURL: "https://cdn.site/demo/soap/cover.webp",
    variationAxes: [],
  });

  await upsertOffer({
    groupId: groupSoap._id,
    sku: "SOAP-NEUTRAL-500",
    price: 190,
    available: true,
    optionValues: [],
    img: "https://cdn.site/demo/soap/offer.webp",
  });

  // =============================
  // 1 axis (color)
  // =============================
  const groupCandle = await upsertGroup({
    slug: "candle-minimal",
    titleUA: "Свічка Minimal",
    titleRU: "Свеча Minimal",
    categoryIds: [ids.candles._id],
    imageURL: "https://cdn.site/demo/candle/cover.webp",
    variationAxes: [
      { axisId: "A1", title: title("Колір", "Цвет"), type: "select", valuesPreset: ["white", "black", "beige"] },
    ],
  });

  for (const color of ["white", "black", "beige"]) {
    await upsertOffer({
      groupId: groupCandle._id,
      sku: sku("CNDL", [color]),
      price: 260 + (color === "black" ? 20 : 0),
      available: true,
      optionValues: [color],
      img: `https://cdn.site/demo/candle/${color}.webp`,
    });
  }

  // =============================
  // 2 axes (color + size)
  // =============================
  const groupVitC = await upsertGroup({
    slug: "vitamin-c-liposomal",
    titleUA: "Вітамін C Ліпосомальний",
    titleRU: "Витамин C Липосомальный",
    categoryIds: [ids.vitaminC._id],
    imageURL: "https://cdn.site/demo/vitc/cover.webp",
    variationAxes: [
      { axisId: "A1", title: title("Смак", "Вкус"), type: "select", valuesPreset: ["orange", "berry"] },
      { axisId: "A2", title: title("Кількість", "Количество"), type: "number", unit: "caps", valuesPreset: [30, 60] },
    ],
  });

  const tastes = ["orange", "berry"];
  const counts = [30, 60];

  for (const t of tastes) {
    for (const c of counts) {
      await upsertOffer({
        groupId: groupVitC._id,
        sku: sku("VITC", [t, c]),
        price: c === 60 ? 790 : 490,
        available: true,
        optionValues: [t, c],
        img: `https://cdn.site/demo/vitc/${t}-${c}.webp`,
      });
    }
  }

  // =============================
  // 3 axes (volume + aroma + format) — как твой пример
  // =============================
  const groupShampoo = await upsertGroup({
    slug: "shampoo-keratin-pro",
    titleUA: "Шампунь Keratin Pro",
    titleRU: "Шампунь Keratin Pro",
    categoryIds: [ids.shampoo._id],
    imageURL: "https://cdn.site/demo/shampoo/cover.webp",
    variationAxes: [
      { axisId: "A1", title: title("Обʼєм", "Объём"), type: "number", unit: "ml", valuesPreset: [250, 500] },
      { axisId: "A2", title: title("Аромат", "Аромат"), type: "select", valuesPreset: ["rose", "mint", "citrus"] },
      { axisId: "A3", title: title("Формат", "Формат"), type: "select", valuesPreset: ["bottle", "refill"] },
    ],
  });

  const volumes = [250, 500];
  const aromas = ["rose", "mint", "citrus"];
  const formats = ["bottle", "refill"];

  for (const v of volumes) {
    for (const a of aromas) {
      for (const f of formats) {
        const base = 390;
        const volAdd = v === 500 ? 220 : 0;
        const refillDiscount = f === "refill" ? -30 : 0;

        await upsertOffer({
          groupId: groupShampoo._id,
          sku: sku("KPRO", [v, a, f]),
          price: base + volAdd + refillDiscount,
          available: !(a === "citrus" && f === "refill"), // пару вариантов сделаем недоступными
          optionValues: [v, a, f],
          img: `https://cdn.site/demo/shampoo/${v}-${a}-${f}.webp`,
        });
      }
    }
  }

  return { groups: [groupSoap, groupCandle, groupVitC, groupShampoo] };
}

async function main() {
  console.log("Connecting:", MONGO_URI);
  await mongoose.connect(MONGO_URI);

  console.log("Seeding categories...");
  const cats = await seedCategories();

  console.log("Seeding products & offers...");
  const prod = await seedProducts(cats);

  console.log("✅ Done");
  console.log("Groups:", prod.groups.map((g) => g.slug));

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
