// scripts/migrate-locales-and-characteristics.js
import mongoose from "mongoose";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";           // поправь путь

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";


// Пополняй словарь по мере надобности
const DICT = {
  audience: {
    women: { ua: "Жінки", en: "Women" },
    men: { ua: "Чоловіки", en: "Men" },
    kids: { ua: "Діти", en: "Kids" },
  },
  material: {
    cotton: { ua: "Бавовна", en: "Cotton" },
    synthetic: { ua: "Синтетика", en: "Synthetic" },
  },
  tags: {
    promo: { ua: "Акція", en: "Promo" },
    new: { ua: "Новинка", en: "New" },
    eco: { ua: "Еко", en: "Eco" },
  },
  brand: {
    MST: { ua: "MST", en: "MST" },
    "California Gold Nutrition": {
      ua: "California Gold Nutrition",
      en: "California Gold Nutrition",
    },
  },
};

function labelFor(key, rawValue) {
  const str = String(rawValue);
  const hit = DICT?.[key]?.[str];
  if (hit) return hit;
  return { ua: str, en: str };
}

function toLocalizedScalar(key, raw) {
  return { value: raw, label: labelFor(key, raw) };
}

function toLocalizedMulti(key, rawArr) {
  const arr = Array.isArray(rawArr) ? rawArr : [];
  return arr
    .filter((x) => x !== null && x !== undefined)
    .map((v) => ({ value: v, label: labelFor(key, v) }));
}

function migrateLocalizedText(obj) {
  if (!obj || typeof obj !== "object") return { changed: false };
  let changed = false;

  if (obj.ru && !obj.en) {
    obj.en = obj.ru;
    changed = true;
  }
  if (obj.ru) {
    delete obj.ru;
    changed = true;
  }
  if (!obj.ua && obj.en) {
    obj.ua = obj.en;
    changed = true;
  }
  return { changed };
}

function ensureBrandOnGroup(characteristics) {
  const arr = Array.isArray(characteristics) ? characteristics : [];
  const hasBrand = arr.some((c) => c?.key === "brand");
  if (hasBrand) return { arr, changed: false };

  arr.push({
    key: "brand",
    type: "select",
    unit: null,
    value: "MST", // дефолт: можешь поменять
    values: [],
  });
  return { arr, changed: true };
}

function migrateCharacteristicsArray(characteristics) {
  let changed = false;
  const arr = Array.isArray(characteristics) ? characteristics : [];

  for (const ch of arr) {
    if (!ch || !ch.key) continue;

    // subtitle: делаем локализованным текстом
    if (ch.key === "subtitle" && typeof ch.value === "string") {
      ch.value = { ua: ch.value, en: ch.value };
      changed = true;
      continue;
    }

    // multiselect: values => [{value,label}]
    if (ch.type === "multiselect") {
      if (Array.isArray(ch.values) && ch.values.length && typeof ch.values[0] !== "object") {
        ch.values = toLocalizedMulti(ch.key, ch.values);
        changed = true;
      }
      continue;
    }

    // scalar/select/boolean/number/string: value => {value,label}
    if (ch.value !== null && ch.value !== undefined && typeof ch.value !== "object") {
      ch.value = toLocalizedScalar(ch.key, ch.value);
      changed = true;
    }
  }

  return { arr, changed };
}

async function migrateProductGroups() {
  const cursor = ProductGroup.find({}).cursor();
  let updated = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    let changed = false;

    if (doc.title) changed ||= migrateLocalizedText(doc.title).changed;

    if (!Array.isArray(doc.characteristics)) doc.characteristics = [];

    // ensure brand
    const ensured = ensureBrandOnGroup(doc.characteristics);
    doc.characteristics = ensured.arr;
    changed ||= ensured.changed;

    // migrate characteristics
    const migrated = migrateCharacteristicsArray(doc.characteristics);
    doc.characteristics = migrated.arr;
    changed ||= migrated.changed;

    if (changed) {
      await doc.save();
      updated++;
      if (updated % 200 === 0) console.log(`[PG] updated: ${updated}`);
    }
  }

  console.log(`✅ ProductGroups done. updated: ${updated}`);
}

async function migrateOffers() {
  const cursor = Offer.find({}).cursor();
  let updated = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    let changed = false;

    // 1) гарантируем optionKey
    const hasKey = typeof doc.optionKey === "string" && doc.optionKey.trim().length > 0;

    if (!hasKey) {
      const arr = Array.isArray(doc.optionValues) ? doc.optionValues : [];
      // если нет вариаций — делаем стабильный ключ для single-SKU
      doc.optionKey = arr.length ? arr.map((v) => String(v)).join("|") : "__single__";
      changed = true;
    }

    // 2) миграция characteristics
    if (Array.isArray(doc.characteristics) && doc.characteristics.length) {
      const migrated = migrateCharacteristicsArray(doc.characteristics);
      doc.characteristics = migrated.arr;
      changed ||= migrated.changed;
    }

    if (changed) {
      // важно: без валидации, иначе выстрелят другие required поля
      await doc.save({ validateBeforeSave: false });
      updated++;
      if (updated % 500 === 0) console.log(`[Offer] updated: ${updated}`);
    }
  }

  console.log(`✅ Offers done. updated: ${updated}`);
}

async function run() {
  if (!MONGO_URI) throw new Error("Set MONGO_URI env var");

  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connected");

  await migrateProductGroups();
  await migrateOffers();

  await mongoose.disconnect();
  console.log("✅ All done");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});