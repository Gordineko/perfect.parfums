/**
 * Dry-run по умолчанию; --write применяет изменения.
 *
 * Что делает:
 *  - проходит по всем ProductGroup, для каждой берёт effectiveVariationAxes
 *    (с учётом variationTemplate корневой категории);
 *  - для каждого оффера группы добавляет в optionMap отсутствующие ключи
 *    осей как null;
 *  - не трогает optionKey, optionValues, characteristics, stocks, images.
 *
 * Использование:
 *   node src/scripts/migrate-offers-fill-missing-axes.js
 *   node src/scripts/migrate-offers-fill-missing-axes.js --write
 *
 * MONGO_URI берётся из env, иначе используется дефолт.
 */

import mongoose from "mongoose";
import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { Category } from "../Modules/CatalogModule/Models/Category.model.js";
import {
  resolveEffectiveVariationAxes,
  buildOptionKey,
  buildOptionValuesFromMap,
} from "../Modules/CatalogModule/utils/catalogAdmin.helpers.js";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/test?authSource=admin";

const WRITE = process.argv.includes("--write");

const categoryRepo = {
  async getById(id) {
    if (!id) return null;
    return Category.findById(id).lean();
  },
};

const hasValue = (v) => v !== undefined && v !== null && v !== "";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log(`mode: ${WRITE ? "WRITE" : "DRY-RUN"}`);

  const groups = await ProductGroup.find({})
    .select({ _id: 1, variationAxes: 1, categoryIds: 1 })
    .lean();

  let totalOffers = 0;
  let offersToUpdate = 0;
  let optionKeyDrift = 0;
  let lenMismatch = 0;
  const bulkOps = [];

  for (const group of groups) {
    const effectiveAxes = await resolveEffectiveVariationAxes({
      categoryIds: group.categoryIds || [],
      variationAxes: group.variationAxes || [],
      categoryRepo,
    });
    const axisIds = effectiveAxes.map((a) => a.axisId);
    if (!axisIds.length) continue;

    const offers = await Offer.find({ groupId: group._id })
      .select({ _id: 1, optionMap: 1, optionValues: 1, optionKey: 1 })
      .lean();

    for (const offer of offers) {
      totalOffers += 1;
      const optionMap =
        offer.optionMap && typeof offer.optionMap === "object" ? offer.optionMap : {};

      const missing = axisIds.filter((id) => !(id in optionMap));
      if (!missing.length) {
        // sanity-check optionKey drift
        const expectedValues = buildOptionValuesFromMap(effectiveAxes, optionMap);
        const expectedKey = buildOptionKey(expectedValues);
        if (
          Array.isArray(offer.optionValues) &&
          offer.optionValues.length !== effectiveAxes.length
        ) {
          lenMismatch += 1;
        }
        if (offer.optionKey && offer.optionKey !== expectedKey) optionKeyDrift += 1;
        continue;
      }

      const expectedValues = buildOptionValuesFromMap(effectiveAxes, {
        ...optionMap,
        ...Object.fromEntries(missing.map((id) => [id, null])),
      });
      const expectedKey = buildOptionKey(expectedValues);
      if (offer.optionKey && offer.optionKey !== expectedKey) optionKeyDrift += 1;
      if (
        Array.isArray(offer.optionValues) &&
        offer.optionValues.length !== effectiveAxes.length
      ) {
        lenMismatch += 1;
      }

      offersToUpdate += 1;

      if (WRITE) {
        const set = {};
        for (const id of missing) set[`optionMap.${id}`] = null;
        bulkOps.push({
          updateOne: {
            filter: { _id: offer._id },
            update: { $set: set },
          },
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        groups: groups.length,
        totalOffers,
        offersToUpdate,
        optionKeyDrift,
        lenMismatch,
      },
      null,
      2
    )
  );

  if (WRITE && bulkOps.length) {
    const res = await Offer.bulkWrite(bulkOps, { ordered: false });
    console.log("bulkModified:", res.modifiedCount);
  }

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
