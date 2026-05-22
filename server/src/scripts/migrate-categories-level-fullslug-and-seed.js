// scripts/migrate-categories-level-fullslug-and-seed.js
import mongoose from "mongoose";

/**
 * ✅ без env: строка подключения внутри
 * (если нужен другой db name — добавь в URI /yourDbName)
 */
const MONGO_URI =
  "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";

const { Schema } = mongoose;

/* =========================
   MODEL (минимально нужный)
========================= */
const LocalizedTitleSchema = new Schema(
  { ua: { type: String, default: "" }, ru: { type: String, default: "" } },
  { _id: false }
);

const CategorySchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    slug: { type: String, required: true, trim: true, index: true },
    title: { type: LocalizedTitleSchema, default: () => ({}) },

    path: { type: [String], default: [], index: true },
    ancestors: { type: [Schema.Types.ObjectId], ref: "Category", default: [], index: true },

    // NEW fields
    level: { type: Number, default: 0, index: true },
    fullSlug: { type: String, default: "", index: true },

    status: { type: String, enum: ["active", "hidden"], default: "active", index: true },
    sort: { type: Number, default: 0, index: true },
  },
  { timestamps: true, collection: "categories" }
);

// индексы (если у тебя они уже есть — Mongo просто проигнорит дубли)
CategorySchema.index({ parentId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ ancestors: 1, status: 1 });
CategorySchema.index({ path: 1, status: 1 });
CategorySchema.index({ fullSlug: 1, status: 1 });
CategorySchema.index({ level: 1, status: 1 });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

/* =========================
   HELPERS
========================= */
const now = () => new Date();

function normalizePathStr(str) {
  return String(str || "").trim().replace(/^\/+|\/+$/g, "");
}

function fullSlugFromPath(pathArr) {
  return Array.isArray(pathArr) ? pathArr.filter(Boolean).join("/") : "";
}

function levelFromAncestors(ancestorsArr) {
  return Array.isArray(ancestorsArr) ? ancestorsArr.length : 0;
}

async function existsByFullSlug(fullSlug) {
  const clean = normalizePathStr(fullSlug);
  if (!clean) return true;
  const found = await Category.findOne({ fullSlug: clean }).select({ _id: 1 }).lean();
  return Boolean(found);
}

/**
 * Создаёт категорию под parent, правильно заполняя ancestors/path/level/fullSlug
 * и не создаёт, если fullSlug уже есть.
 */
async function ensureCategory({ parent, slug, titleUa, titleRu, sort = 10, status = "active" }) {
  const pPath = Array.isArray(parent?.path) ? parent.path : [];
  const pAnc = Array.isArray(parent?.ancestors) ? parent.ancestors : [];
  const parentId = parent?._id ?? null;

  const path = parentId ? [...pPath, slug] : [slug];
  const ancestors = parentId ? [...pAnc, parentId] : [];

  const fullSlug = fullSlugFromPath(path);
  const level = ancestors.length;

  const already = await Category.findOne({ fullSlug }).select({ _id: 1 }).lean();
  if (already) return { created: false, _id: already._id, fullSlug };

  const doc = await Category.create({
    parentId,
    slug,
    title: { ua: titleUa, ru: titleRu },
    path,
    ancestors,
    level,
    fullSlug,
    status,
    sort,
    createdAt: now(),
    updatedAt: now(),
  });

  return { created: true, _id: doc._id, fullSlug };
}

/* =========================
   1) MIGRATE existing categories
========================= */
async function migrateExisting() {
  const cursor = Category.find({}).cursor();

  let scanned = 0;
  let updated = 0;

  for await (const c of cursor) {
    scanned++;

    const nextLevel = levelFromAncestors(c.ancestors);
    const nextFull = fullSlugFromPath(c.path);

    // обновляем только если реально отличается
    if ((c.level ?? 0) !== nextLevel || (c.fullSlug ?? "") !== nextFull) {
      await Category.updateOne(
        { _id: c._id },
        { $set: { level: nextLevel, fullSlug: nextFull, updatedAt: now() } }
      );
      updated++;
    }
  }

  console.log("✅ migrateExisting:", { scanned, updated });
}

/* =========================
   2) SEED: add 2 nested branches
========================= */
async function seedNestedCategories() {
  // ищем root категории, под которые создаём ветки
  const skin = await Category.findOne({ slug: "skin-structure", parentId: null }).lean();
  const hair = await Category.findOne({ slug: "hair-structure", parentId: null }).lean();

  if (!skin || !hair) {
    console.log("⚠️ Roots not found:", {
      skinFound: Boolean(skin),
      hairFound: Boolean(hair),
    });
    console.log("Скрипт миграции выполнен, но сидинг пропущен.");
    return;
  }

  const created = [];

  // === BRANCH 1: skin-structure/cleansing/(foam, cleansing-oil)
  const cleansing = await ensureCategory({
    parent: skin,
    slug: "cleansing",
    titleUa: "Очищення",
    titleRu: "Очищение",
    sort: 10,
  });
  if (cleansing.created) created.push(cleansing.fullSlug);

  const foam = await ensureCategory({
    parent: await Category.findById(cleansing._id).lean(),
    slug: "foam",
    titleUa: "Пінка",
    titleRu: "Пенка",
    sort: 10,
  });
  if (foam.created) created.push(foam.fullSlug);

  const oil = await ensureCategory({
    parent: await Category.findById(cleansing._id).lean(),
    slug: "cleansing-oil",
    titleUa: "Гідрофільна олія",
    titleRu: "Гидрофильное масло",
    sort: 20,
  });
  if (oil.created) created.push(oil.fullSlug);

  // === BRANCH 2: hair-structure/shampoo/(daily, anti-dandruff)
  const shampoo = await ensureCategory({
    parent: hair,
    slug: "shampoo",
    titleUa: "Шампуні",
    titleRu: "Шампуни",
    sort: 10,
  });
  if (shampoo.created) created.push(shampoo.fullSlug);

  const daily = await ensureCategory({
    parent: await Category.findById(shampoo._id).lean(),
    slug: "daily",
    titleUa: "Щоденні",
    titleRu: "Ежедневные",
    sort: 10,
  });
  if (daily.created) created.push(daily.fullSlug);

  const dandruff = await ensureCategory({
    parent: await Category.findById(shampoo._id).lean(),
    slug: "anti-dandruff",
    titleUa: "Від лупи",
    titleRu: "От перхоти",
    sort: 20,
  });
  if (dandruff.created) created.push(dandruff.fullSlug);

  console.log("✅ seedNestedCategories created:", created.length ? created : "nothing new (already exists)");
}

/* =========================
   MAIN
========================= */
async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connected");

  // 1) миграция
  await migrateExisting();

  // 2) сидинг веток
  await seedNestedCategories();

  await mongoose.disconnect();
  console.log("✅ Done");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});