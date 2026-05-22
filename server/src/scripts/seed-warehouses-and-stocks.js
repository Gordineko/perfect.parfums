import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Подстрой пути под свой проект
import { Warehouse } from "../Modules/CatalogModule/Models/Warehouse.model.js";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";

const MONGO_URI = "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin"

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not set in .env");
}

function calcAvailableTotal(stocks = []) {
  return (stocks || []).reduce((sum, row) => {
    const onHand = Math.max(0, Number(row?.onHand || 0));
    const reserved = Math.min(onHand, Math.max(0, Number(row?.reserved || 0)));
    return sum + Math.max(0, onHand - reserved);
  }, 0);
}

function buildStocksForOffer(index, warehouseAId, warehouseBId) {
  return [
    {
      warehouseId: warehouseAId,
      onHand: 5 + (index % 5),
      reserved: index % 2,
    },
    {
      warehouseId: warehouseBId,
      onHand: 3 + (index % 4),
      reserved: 0,
    },
  ];
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Mongo connected");

  try {
    console.log("🧹 Clearing warehouses...");
    await Warehouse.deleteMany({});

    console.log("🧹 Clearing offer stocks...");
    await Offer.updateMany(
      {},
      {
        $set: {
          stocks: [],
        },
      }
    );

    console.log("🏗 Creating warehouses...");
    const [warehouseA, warehouseB] = await Warehouse.create([
      {
        code: "KYIV_MAIN",
        title: {
          ua: "Основний склад Київ",
          ru: "Основной склад Киев",
        },
        address: "м. Київ, вул. Центральна, 10",
        sort: 10,
        status: "active",
        isDefault: true,
      },
      {
        code: "LVIV_BACKUP",
        title: {
          ua: "Резервний склад Львів",
          ru: "Резервный склад Львов",
        },
        address: "м. Львів, вул. Складська, 7",
        sort: 20,
        status: "active",
        isDefault: false,
      },
    ]);

    console.log("✅ Warehouses created:");
    console.log(` - ${warehouseA.code}: ${warehouseA._id}`);
    console.log(` - ${warehouseB.code}: ${warehouseB._id}`);

    const offers = await Offer.find({}, { _id: 1 }).lean();
    console.log(`📦 Found offers: ${offers.length}`);

    if (!offers.length) {
      console.log("⚠ No offers found, done");
      return;
    }

    const ops = offers.map((offer, index) => {
      const stocks = buildStocksForOffer(index, warehouseA._id, warehouseB._id);
      const availableTotal = calcAvailableTotal(stocks);

      return {
        updateOne: {
          filter: { _id: offer._id },
          update: {
            $set: {
              stocks,
              available: availableTotal > 0,
            },
          },
        },
      };
    });

    console.log("💾 Writing stocks to offers...");
    const result = await Offer.bulkWrite(ops, { ordered: false });

    console.log("✅ Done");
    console.log({
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });

    const availableOffers = await Offer.countDocuments({ available: true });
    const unavailableOffers = await Offer.countDocuments({ available: false });

    console.log("📊 Summary:");
    console.log(` - available offers: ${availableOffers}`);
    console.log(` - unavailable offers: ${unavailableOffers}`);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Mongo disconnected");
  }
}

run().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});