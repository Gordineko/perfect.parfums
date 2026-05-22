import "dotenv/config";
import mongoose from "mongoose";
import {
  Offer,
  syncOfferDiscountFields,
} from "../Modules/CatalogModule/Models/Offer.model.js";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const CLI_ARGS = new Set(process.argv.slice(2));
const DRY_RUN = CLI_ARGS.has("--write")
  ? false
  : String(process.env.DRY_RUN || "true").toLowerCase() !== "false";
const BATCH_SIZE = Math.max(1, Number(process.env.BATCH_SIZE || 500));

function isSameNumber(left, right) {
  return Number(left ?? 0) === Number(right ?? 0);
}

function isSameString(left, right) {
  return String(left ?? "") === String(right ?? "");
}

function needsUpdate(offer, nextPricing) {
  return (
    !isSameNumber(offer.price, nextPricing.price) ||
    !isSameNumber(offer.discount, nextPricing.discount) ||
    !isSameNumber(offer.discountUAH, nextPricing.discountUAH) ||
    !isSameNumber(offer.effectivePrice, nextPricing.effectivePrice) ||
    !isSameString(offer.discountType, nextPricing.discountType)
  );
}

async function flushOps(ops, stats) {
  if (!ops.length || DRY_RUN) return;

  const result = await Offer.bulkWrite(ops, { ordered: false });
  stats.modified += result.modifiedCount || 0;
}

async function main() {
  if (!MONGO_URI) {
    throw new Error("Set MONGO_URI or MONGODB_URI");
  }

  console.log("[migrate-offers-effective-price] starting", {
    mode: DRY_RUN ? "dry-run" : "write",
    batchSize: BATCH_SIZE,
    mongoUri: MONGO_URI,
  });

  await mongoose.connect(MONGO_URI);

  const stats = {
    scanned: 0,
    matched: 0,
    modified: 0,
  };

  const ops = [];
  const cursor = Offer.find({})
    .select({
      _id: 1,
      price: 1,
      discount: 1,
      discountUAH: 1,
      discountType: 1,
      effectivePrice: 1,
    })
    .lean()
    .cursor();

  for await (const offer of cursor) {
    stats.scanned += 1;

    const nextPricing = syncOfferDiscountFields(offer, offer.discountType);
    if (!needsUpdate(offer, nextPricing)) {
      continue;
    }

    stats.matched += 1;
    ops.push({
      updateOne: {
        filter: { _id: offer._id },
        update: {
          $set: {
            price: nextPricing.price,
            discount: nextPricing.discount,
            discountUAH: nextPricing.discountUAH,
            discountType: nextPricing.discountType,
            effectivePrice: nextPricing.effectivePrice,
          },
        },
      },
    });

    if (ops.length >= BATCH_SIZE) {
      await flushOps(ops, stats);
      ops.length = 0;
    }
  }

  await flushOps(ops, stats);

  console.log("[migrate-offers-effective-price] done", {
    dryRun: DRY_RUN,
    batchSize: BATCH_SIZE,
    scanned: stats.scanned,
    matched: stats.matched,
    modified: DRY_RUN ? 0 : stats.modified,
  });

  if (DRY_RUN) {
    console.log(
      "[migrate-offers-effective-price] dry-run only. Re-run with --write or DRY_RUN=false to apply changes."
    );
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("[migrate-offers-effective-price] failed", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});