import mongoose from "mongoose";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { makeOptionKey, makeOptionMapFromAxes } from "../Modules/CatalogModule/utils/options.js";

const MONGODB_URI = "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";

async function main() {
  if (!MONGODB_URI) throw new Error("Set MONGODB_URI");

  await mongoose.connect(MONGODB_URI);

  // грузим группы в память (id -> axes)
  const groups = await ProductGroup.find({}).select({ _id: 1, variationAxes: 1 }).lean();
  const axesByGroup = new Map(groups.map((g) => [String(g._id), g.variationAxes || []]));

  const cursor = Offer.find({}).cursor();

  let updated = 0;
  for await (const offer of cursor) {
    const axes = axesByGroup.get(String(offer.groupId)) || [];
    const optionValues = Array.isArray(offer.optionValues) ? offer.optionValues : [];

    const nextOptionKey = makeOptionKey(optionValues);
    const nextOptionMap = makeOptionMapFromAxes({ axes, optionValues });

    const need =
      offer.optionKey !== nextOptionKey ||
      JSON.stringify(offer.optionMap || {}) !== JSON.stringify(nextOptionMap);

    if (!need) continue;

    offer.optionKey = nextOptionKey;
    offer.optionMap = nextOptionMap;

    await offer.save();
    updated++;
  }

  console.log("✅ migrated offers:", updated);

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
