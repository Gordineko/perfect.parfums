// scripts/seed-to-atlas.js
import fs from "fs";
import mongoose from "mongoose";

/**
 * НАСТРОЙКИ (без env)
 */
const MONGO_URI =
  "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";

// куда читаем
const GROUPS_FILE = "../../backups/test.productgroups.json";
const OFFERS_FILE = "../../backups/test.offers.json";

// сколько копий размножить (1 = как есть, 50 = x50 и т.д.)
const COPIES = 50;

// добавлять ли Offer.characteristics (чтобы тестить offerChar)
const WITH_OFFER_CHARS = true;

// слегка “размазать” цены/наличие, чтобы тестить all кейсы
const SHUFFLE = true;

// чистить ли коллекции перед заливкой (ОЧЕНЬ ОСТОРОЖНО)
const WIPE_BEFORE_IMPORT = false;

// названия коллекций (по умолчанию mongoose lowercased plural)
// если у тебя другие — поменяй
const COL_GROUPS = "productgroups";
const COL_OFFERS = "offers";

/* =========================
   HELPERS
========================= */
const { Schema } = mongoose;

function oid() {
  return new mongoose.Types.ObjectId();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// дампы часто в формате {"$oid": "..."} / {"$date": "..."}
function normalizeMongoExtended(v) {
  if (Array.isArray(v)) return v.map(normalizeMongoExtended);
  if (!v || typeof v !== "object") return v;

  if (v.$oid) return new mongoose.Types.ObjectId(String(v.$oid));
  if (v.$date) return new Date(String(v.$date));

  const out = {};
  for (const [k, val] of Object.entries(v)) out[k] = normalizeMongoExtended(val);
  return out;
}

function s(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function slugify(str) {
  return s(str)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function maybe(prob = 0.5) {
  return Math.random() < prob;
}

function buildOfferCharacteristics(group, offer) {
  const axes = Array.isArray(group?.variationAxes) ? group.variationAxes : [];
  const optionValues = Array.isArray(offer?.optionValues) ? offer.optionValues : [];

  // простая логика:
  // A1 -> color/taste (select), A2 -> count (number)
  const out = [];

  // color
  out.push({
    key: "color",
    type: "select",
    unit: null,
    value: optionValues[0] ?? null,
    values: [],
  });

  // count
  if (axes[1]?.type === "number") {
    out.push({
      key: "count",
      type: "number",
      unit: axes[1]?.unit ?? null,
      value: optionValues[1] ?? null,
      values: [],
    });
  }

  // multiselect tags (для sticky multiselect)
  out.push({
    key: "tags",
    type: "multiselect",
    unit: null,
    value: null,
    values: ["eco", "promo", "new"].filter(() => maybe(0.45)),
  });

  return out;
}

function mutateForCoverage(groups, offers) {
  // 1) часть групп без offers (чтобы проверить пустые)
  const offersByGroup = new Map();
  for (const o of offers) {
    const gid = String(o.groupId);
    if (!offersByGroup.has(gid)) offersByGroup.set(gid, []);
    offersByGroup.get(gid).push(o);
  }

  const groupIds = groups.map((g) => String(g._id));
  const toEmpty = groupIds.filter(() => maybe(0.08)); // 8%
  for (const gid of toEmpty) offersByGroup.set(gid, []);

  // 2) размазать цены/наличие
  for (const [gid, list] of offersByGroup.entries()) {
    for (const o of list) {
      if (SHUFFLE) {
        o.available = maybe(0.75);

        const base = Number(o.price || 100);
        const mult = randInt(60, 160) / 100; // 0.6..1.6
        o.price = Math.max(10, Math.round(base * mult));

        if (maybe(0.2)) o.opt_price = Math.round(o.price * 0.85);
      } else {
        if (maybe(0.2)) o.available = false;
      }
    }
  }

  const nextOffers = [];
  for (const g of groups) {
    const gid = String(g._id);
    nextOffers.push(...(offersByGroup.get(gid) || []));
  }

  return { groups, offers: nextOffers };
}

function cloneDataset(baseGroups, baseOffers, copies) {
  const outGroups = [];
  const outOffers = [];

  for (let i = 0; i < copies; i++) {
    const suffix = `t${String(i + 1).padStart(3, "0")}`;
    const groupIdMap = new Map(); // old -> new

    // clone groups
    for (const g of baseGroups) {
      const newId = oid();
      groupIdMap.set(String(g._id), newId);

      const titleUa = g.title?.ua || g.slug || "product";
      const titleRu = g.title?.ru || g.slug || "product";

      const newSlug = `${slugify(g.slug || titleUa)}-${suffix}`;

      const ng = {
        ...g,
        _id: newId,
        slug: newSlug,
        title: {
          ua: titleUa ? `${titleUa} (${suffix})` : `(${suffix})`,
          ru: titleRu ? `${titleRu} (${suffix})` : `(${suffix})`,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // добавим групповые характеристики, чтобы было больше тестов по char
      const chars = Array.isArray(ng.characteristics) ? ng.characteristics.slice() : [];
      if (!chars.find((c) => c.key === "material")) {
        chars.push({
          key: "material",
          type: "select",
          unit: null,
          value: maybe(0.5) ? "cotton" : "synthetic",
          values: [],
        });
      }
      if (!chars.find((c) => c.key === "isNew")) {
        chars.push({
          key: "isNew",
          type: "boolean",
          unit: null,
          value: maybe(0.5),
          values: [],
        });
      }
      if (!chars.find((c) => c.key === "audience")) {
        chars.push({
          key: "audience",
          type: "multiselect",
          unit: null,
          value: null,
          values: ["women", "men", "kids"].filter(() => maybe(0.4)),
        });
      }
      ng.characteristics = chars;

      outGroups.push(ng);
    }

    // clone offers
    for (const o of baseOffers) {
      const newGid = groupIdMap.get(String(o.groupId));
      if (!newGid) continue;

      const newOfferId = oid();
      const baseSku = s(o.sku || "SKU");
      const newSku = `${baseSku}-${suffix}`;

      const optionValues = Array.isArray(o.optionValues) ? o.optionValues.slice() : [];
      const optionKey = optionValues.length ? optionValues.map(String).join("|") : (o.optionKey || "");

      const no = {
        ...o,
        _id: newOfferId,
        groupId: newGid,
        sku: newSku,
        optionValues,
        optionKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      outOffers.push(no);
    }
  }

  const mutated = mutateForCoverage(outGroups, outOffers);

  if (WITH_OFFER_CHARS) {
    const groupById = new Map(mutated.groups.map((g) => [String(g._id), g]));
    for (const o of mutated.offers) {
      const g = groupById.get(String(o.groupId));
      if (!g) continue;
      o.characteristics = buildOfferCharacteristics(g, o);
    }
  }

  return mutated;
}

async function insertManySafe(col, docs, batchSize = 2000) {
  let inserted = 0;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    try {
      await col.insertMany(batch, { ordered: false });
      inserted += batch.length;
      console.log(`✅ inserted ${inserted}/${docs.length} into ${col.collectionName}`);
    } catch (e) {
      // при ordered:false часть вставится, часть упадёт (например дубликаты)
      console.warn(`⚠️ insertMany warning in ${col.collectionName}:`, e?.message || e);
    }
  }
}

/* =========================
   MAIN
========================= */
async function main() {
  const baseGroupsRaw = readJson(GROUPS_FILE).map(normalizeMongoExtended);
  const baseOffersRaw = readJson(OFFERS_FILE).map(normalizeMongoExtended);

  console.log("Base loaded:", { groups: baseGroupsRaw.length, offers: baseOffersRaw.length });

  const { groups, offers } = cloneDataset(baseGroupsRaw, baseOffersRaw, COPIES);

  console.log("Prepared:", { groups: groups.length, offers: offers.length });

  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connected");

  const db = mongoose.connection.db;
  const groupsCol = db.collection(COL_GROUPS);
  const offersCol = db.collection(COL_OFFERS);

  if (WIPE_BEFORE_IMPORT) {
    console.log("⚠️ WIPE enabled: clearing collections...");
    await groupsCol.deleteMany({});
    await offersCol.deleteMany({});
    console.log("✅ Collections wiped");
  }

  await insertManySafe(groupsCol, groups, 2000);
  await insertManySafe(offersCol, offers, 5000);

  console.log("✅ Done");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});