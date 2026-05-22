// scripts/migrate-ru-to-en-and-add-product-fields.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in .env");
}

/**
 * Рекурсивно:
 * - меняет ключ ru -> en
 * - не перетирает существующий en
 */
function transformRuToEnDeep(value) {
  if (Array.isArray(value)) {
    return value.map(transformRuToEnDeep);
  }

  if (value && typeof value === "object" && !(value instanceof Date) && !(value instanceof mongoose.Types.ObjectId)) {
    const result = {};

    for (const [key, val] of Object.entries(value)) {
      const transformedVal = transformRuToEnDeep(val);

      if (key === "ru") {
        // если en уже будет/есть — ru не перезаписывает en
        if (result.en === undefined) {
          result.en = transformedVal;
        }
      } else {
        result[key] = transformedVal;
      }
    }

    return result;
  }

  return value;
}

function ensureLocalizedField(existingValue, fallbackUa, fallbackEn) {
  if (
    existingValue &&
    typeof existingValue === "object" &&
    !Array.isArray(existingValue)
  ) {
    return {
      ua: existingValue.ua ?? fallbackUa,
      en: existingValue.en ?? existingValue.ru ?? fallbackEn,
    };
  }

  return {
    ua: fallbackUa,
    en: fallbackEn,
  };
}

async function migrateCollection(collectionName, productCollectionName) {
  const collection = mongoose.connection.db.collection(collectionName);

  console.log(`\n--- Migrating collection: ${collectionName} ---`);

  const cursor = collection.find({});
  const bulkOps = [];
  let scanned = 0;
  let changed = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    scanned++;

    const original = doc;
    const transformed = transformRuToEnDeep(doc);

    let needsUpdate = JSON.stringify(original) !== JSON.stringify(transformed);

    // Доп. поля только для коллекции товаров
    if (collectionName === productCollectionName) {
      const defaultSubtitleUa = "Ніжний догляд для щоденного використання";
      const defaultSubtitleEn = "Gentle care for everyday use";

      const defaultDescriptionUa =
        "Якісний товар для щоденного використання. Підходить для регулярного догляду та має приємні властивості для комфортного застосування.";

      const defaultDescriptionEn =
        "Quality product for everyday use. Suitable for regular care and designed for comfortable daily application.";

      transformed.subtitle = ensureLocalizedField(
        transformed.subtitle,
        defaultSubtitleUa,
        defaultSubtitleEn
      );

      transformed.description = ensureLocalizedField(
        transformed.description,
        defaultDescriptionUa,
        defaultDescriptionEn
      );

      transformed.updatedAt = new Date();
      needsUpdate = true;
    }

    if (needsUpdate) {
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: transformed,
          },
        },
      });
      changed++;
    }

    if (bulkOps.length >= 200) {
      await collection.bulkWrite(bulkOps, { ordered: false });
      console.log(`Processed ${scanned}, updated ${changed}`);
      bulkOps.length = 0;
    }
  }

  if (bulkOps.length) {
    await collection.bulkWrite(bulkOps, { ordered: false });
  }

  console.log(`Done: ${collectionName}. Scanned: ${scanned}, Updated: ${changed}`);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Mongo connected");

  // Укажи тут реальное имя коллекции товаров
  // Чаще всего это "productgroups" или "products"
  const productCollectionName = "productgroups";

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  console.log("Collections found:", collectionNames);

  for (const collectionName of collectionNames) {
    // системные можно пропустить
    if (collectionName.startsWith("system.")) continue;

    await migrateCollection(collectionName, productCollectionName);
  }

  await mongoose.disconnect();
  console.log("\nMigration finished");
}

run().catch(async (err) => {
  console.error("Migration failed:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});