import mongoose from "mongoose";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { Warehouse } from "../Modules/CatalogModule/Models/Warehouse.model.js";

const MONGO_URI =
  "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";

const DEFAULT_WAREHOUSE = {
  name: "Основной склад",
  code: "main-warehouse",
  address: "",
  isActive: true,
  isDefault: true,
  notes: "Создан миграцией для инициализации складских остатков",
};

async function ensureDefaultWarehouse() {
  let warehouse = await Warehouse.findOne({ code: DEFAULT_WAREHOUSE.code });

  if (!warehouse) {
    warehouse = await Warehouse.create(DEFAULT_WAREHOUSE);
    console.log(`[WAREHOUSE] created: ${warehouse._id} (${warehouse.name})`);
  } else {
    console.log(`[WAREHOUSE] exists: ${warehouse._id} (${warehouse.name})`);
  }

  return warehouse;
}

async function migrateOffersStocks(warehouseId) {
  const cursor = Offer.find({}, { _id: 1, available: 1, stocks: 1 }).cursor();

  let total = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for await (const offer of cursor) {
    total++;

    try {
      const stocks = Array.isArray(offer.stocks) ? offer.stocks : [];

      const alreadyHasWarehouse = stocks.some(
        (s) => String(s.warehouseId) === String(warehouseId)
      );

      if (alreadyHasWarehouse) {
        skipped++;
        continue;
      }

      // ВАЖНО:
      // Так как в Offer нет отдельного поля количества, мы временно делаем:
      // available=true -> onHand=1
      // available=false -> onHand=0
      //
      // Если у тебя есть реальное поле количества где-то ещё,
      // просто замени эту строку на нужную логику.
      const onHand = offer.available ? 1 : 0;

      await Offer.updateOne(
        { _id: offer._id },
        {
          $push: {
            stocks: {
              warehouseId,
              onHand,
              reserved: 0,
            },
          },
        }
      );

      updated++;
    } catch (err) {
      errors++;
      console.error(`[ERROR] Offer ${offer._id}:`, err.message);
    }
  }

  console.log("\n=== MIGRATION RESULT ===");
  console.log(`Total:   ${total}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors:  ${errors}`);
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("[DB] connected");

    const warehouse = await ensureDefaultWarehouse();
    await migrateOffersStocks(warehouse._id);

    console.log("[DONE]");
    process.exit(0);
  } catch (err) {
    console.error("[FATAL]", err);
    process.exit(1);
  }
}

main();