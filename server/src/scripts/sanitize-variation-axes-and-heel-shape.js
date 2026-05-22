import "dotenv/config";
import mongoose from "mongoose";

import { Offer } from "../Modules/CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";
import { makeOptionKey, makeOptionMapFromAxes } from "../Modules/CatalogModule/utils/options.js";

const SCRIPT_NAME = "sanitize-variation-axes-and-heel-shape";
const CLI_ARGS = new Set(process.argv.slice(2));
const WRITE =
  CLI_ARGS.has("--write") ||
  String(process.env.npm_config_write || "").toLowerCase() === "true";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin";

const INSOLE_AXIS_ID = "A2";
const HEEL_SHAPE_AXIS_ID = "A3";
const BAD_HEEL_SHAPE_VALUE = "pidbor-sm";

function json(value) {
  return JSON.stringify(value ?? null);
}

function normalizeToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isInsoleAxis(axis = {}) {
  const axisId = String(axis?.axisId || "").trim();
  if (axisId === INSOLE_AXIS_ID) return true;

  const ua = normalizeToken(axis?.title?.ua);
  const en = normalizeToken(axis?.title?.en);
  return ua === "розмір устілки" || en === "insole size";
}

function cleanupHeelShapePreset(valuesPreset = []) {
  const source = Array.isArray(valuesPreset) ? valuesPreset : [];
  return source.filter((item) => {
    const raw =
      item && typeof item === "object"
        ? item.value ?? item.label?.ua ?? item.label?.en
        : item;
    return normalizeToken(raw) !== BAD_HEEL_SHAPE_VALUE;
  });
}

function cleanupGroupCharacteristics(characteristics = []) {
  let changed = false;
  const next = (Array.isArray(characteristics) ? characteristics : []).filter((item) => {
    const key = String(item?.key || "").trim();
    if (key !== "heelType") return true;

    const raw =
      item?.value && typeof item.value === "object"
        ? item.value.value ?? item.value.label?.ua ?? item.value.label?.en
        : item?.value;

    const keep = normalizeToken(raw) !== BAD_HEEL_SHAPE_VALUE;
    if (!keep) changed = true;
    return keep;
  });

  return { next, changed };
}

function cleanupOfferCharacteristics(characteristics = []) {
  let changed = false;
  const next = (Array.isArray(characteristics) ? characteristics : []).filter((item) => {
    const key = String(item?.key || "").trim();
    if (key !== "heelType") return true;

    const raw =
      item?.value && typeof item.value === "object"
        ? item.value.value ?? item.value.label?.ua ?? item.value.label?.en
        : item?.value;

    const keep = normalizeToken(raw) !== BAD_HEEL_SHAPE_VALUE;
    if (!keep) changed = true;
    return keep;
  });

  return { next, changed };
}

function safeOptionMapForOffer(offer, oldAxes = []) {
  if (offer?.optionMap && typeof offer.optionMap === "object") {
    return { ...offer.optionMap };
  }

  return makeOptionMapFromAxes({
    axes: oldAxes,
    optionValues: Array.isArray(offer?.optionValues) ? offer.optionValues : [],
  });
}

function buildOptionValuesFromMap(variationAxes = [], optionMap = {}) {
  return variationAxes.map((axis) => {
    const axisId = axis?.axisId;
    if (!axisId) return null;
    const value = optionMap?.[axisId];
    return value === undefined ? null : value;
  });
}

function arraysEqual(left = [], right = []) {
  return json(left || []) === json(right || []);
}

function buildNextVariationAxes(oldAxes = []) {
  const source = Array.isArray(oldAxes) ? oldAxes : [];
  let removedA2 = 0;
  let removedPidborPreset = 0;

  const next = [];
  for (const axis of source) {
    if (isInsoleAxis(axis)) {
      removedA2 += 1;
      continue;
    }

    if (String(axis?.axisId || "").trim() === HEEL_SHAPE_AXIS_ID) {
      const cleanedPreset = cleanupHeelShapePreset(axis?.valuesPreset || []);
      removedPidborPreset += Math.max(0, (axis?.valuesPreset || []).length - cleanedPreset.length);
      next.push({
        ...axis,
        valuesPreset: cleanedPreset,
      });
      continue;
    }

    next.push(axis);
  }

  return {
    next,
    removedA2,
    removedPidborPreset,
  };
}

async function run() {
  if (!MONGO_URI) {
    throw new Error("Set MONGO_URI or MONGODB_URI");
  }

  console.log(`[${SCRIPT_NAME}] starting`, {
    mode: WRITE ? "write" : "dry-run",
    mongoUri: MONGO_URI,
    removeAxisId: INSOLE_AXIS_ID,
    removeHeelShapeValue: BAD_HEEL_SHAPE_VALUE,
  });

  await mongoose.connect(MONGO_URI);

  const groupCursor = ProductGroup.find({}).select({ _id: 1, slug: 1, variationAxes: 1, characteristics: 1 }).cursor();

  const stats = {
    scannedGroups: 0,
    changedGroups: 0,
    skippedGroupsByCollision: 0,
    removedA2Axes: 0,
    removedPidborPresetItems: 0,
    changedGroupCharacteristics: 0,
    scannedOffers: 0,
    changedOffers: 0,
    changedOfferOptionMap: 0,
    changedOfferOptionValues: 0,
    changedOfferOptionKey: 0,
    removedPidborFromOfferOptionMap: 0,
    removedPidborOfferCharacteristics: 0,
    sampleChangedSlugs: [],
    sampleCollisionSlugs: [],
  };

  for (let group = await groupCursor.next(); group != null; group = await groupCursor.next()) {
    stats.scannedGroups += 1;

    const oldAxes = Array.isArray(group.variationAxes) ? group.variationAxes : [];
    const { next: newAxes, removedA2, removedPidborPreset } = buildNextVariationAxes(oldAxes);
    const groupChars = cleanupGroupCharacteristics(group.characteristics || []);

    const axesChanged = !arraysEqual(oldAxes, newAxes);
    const groupCharsChanged = groupChars.changed;

    if (!axesChanged && !groupCharsChanged) {
      continue;
    }

    const offers = await Offer.find({ groupId: group._id })
      .select({ _id: 1, optionMap: 1, optionValues: 1, optionKey: 1, characteristics: 1 })
      .lean();

    stats.scannedOffers += offers.length;

    const preparedOffers = [];
    const seenKeys = new Set();
    let hasCollision = false;

    for (const offer of offers) {
      const oldOptionMap = safeOptionMapForOffer(offer, oldAxes);
      const nextOptionMap = { ...oldOptionMap };

      if (Object.prototype.hasOwnProperty.call(nextOptionMap, INSOLE_AXIS_ID)) {
        delete nextOptionMap[INSOLE_AXIS_ID];
      }

      if (normalizeToken(nextOptionMap[HEEL_SHAPE_AXIS_ID]) === BAD_HEEL_SHAPE_VALUE) {
        delete nextOptionMap[HEEL_SHAPE_AXIS_ID];
      }

      const nextOptionValues = buildOptionValuesFromMap(newAxes, nextOptionMap);
      const nextOptionKey = makeOptionKey(nextOptionValues);

      if (seenKeys.has(nextOptionKey)) {
        hasCollision = true;
      }
      seenKeys.add(nextOptionKey);

      const offerChars = cleanupOfferCharacteristics(offer.characteristics || []);

      const optionMapChanged = json(offer.optionMap || {}) !== json(nextOptionMap);
      const optionValuesChanged = !arraysEqual(offer.optionValues || [], nextOptionValues);
      const optionKeyChanged = String(offer.optionKey || "") !== nextOptionKey;
      const offerCharsChanged = offerChars.changed;

      preparedOffers.push({
        _id: offer._id,
        nextOptionMap,
        nextOptionValues,
        nextOptionKey,
        nextCharacteristics: offerChars.next,
        optionMapChanged,
        optionValuesChanged,
        optionKeyChanged,
        offerCharsChanged,
        removedPidborFromOptionMap:
          normalizeToken(oldOptionMap?.[HEEL_SHAPE_AXIS_ID]) === BAD_HEEL_SHAPE_VALUE,
      });
    }

    const hasOfferKeyRewrites = preparedOffers.some(
      (prepared) =>
        prepared.optionMapChanged ||
        prepared.optionValuesChanged ||
        prepared.optionKeyChanged
    );

    if (hasCollision && hasOfferKeyRewrites) {
      stats.skippedGroupsByCollision += 1;
      if (stats.sampleCollisionSlugs.length < 20) {
        stats.sampleCollisionSlugs.push(group.slug);
      }
      continue;
    }

    stats.changedGroups += 1;
    stats.removedA2Axes += removedA2;
    stats.removedPidborPresetItems += removedPidborPreset;
    if (groupCharsChanged) stats.changedGroupCharacteristics += 1;
    if (stats.sampleChangedSlugs.length < 20) {
      stats.sampleChangedSlugs.push(group.slug);
    }

    for (const prepared of preparedOffers) {
      if (
        !prepared.optionMapChanged &&
        !prepared.optionValuesChanged &&
        !prepared.optionKeyChanged &&
        !prepared.offerCharsChanged
      ) {
        continue;
      }

      stats.changedOffers += 1;
      if (prepared.optionMapChanged) stats.changedOfferOptionMap += 1;
      if (prepared.optionValuesChanged) stats.changedOfferOptionValues += 1;
      if (prepared.optionKeyChanged) stats.changedOfferOptionKey += 1;
      if (prepared.offerCharsChanged) stats.removedPidborOfferCharacteristics += 1;
      if (prepared.removedPidborFromOptionMap) stats.removedPidborFromOfferOptionMap += 1;

      if (WRITE) {
        await Offer.updateOne(
          { _id: prepared._id },
          {
            $set: {
              optionMap: prepared.nextOptionMap,
              optionValues: prepared.nextOptionValues,
              optionKey: prepared.nextOptionKey,
              characteristics: prepared.nextCharacteristics,
            },
          }
        );
      }
    }

    if (WRITE) {
      await ProductGroup.updateOne(
        { _id: group._id },
        {
          $set: {
            variationAxes: newAxes,
            characteristics: groupChars.next,
          },
        }
      );

      // Дополнительная страховка: гарантированно удаляем pidbor-sm
      // из пресетов оси A3, даже если в данных есть нестандартные формы.
      await ProductGroup.updateOne(
        { _id: group._id },
        {
          $pull: {
            "variationAxes.$[a3].valuesPreset": {
              value: BAD_HEEL_SHAPE_VALUE,
            },
          },
        },
        {
          arrayFilters: [{ "a3.axisId": HEEL_SHAPE_AXIS_ID }],
        }
      );

      await ProductGroup.updateOne(
        { _id: group._id },
        {
          $pull: {
            "variationAxes.$[a3].valuesPreset": BAD_HEEL_SHAPE_VALUE,
          },
        },
        {
          arrayFilters: [{ "a3.axisId": HEEL_SHAPE_AXIS_ID }],
        }
      );
    }
  }

  console.log(`\n=== ${SCRIPT_NAME} summary ===`);
  console.log(
    JSON.stringify(
      {
        mode: WRITE ? "write" : "dry-run",
        ...stats,
      },
      null,
      2
    )
  );

  if (!WRITE) {
    console.log(`[${SCRIPT_NAME}] dry-run only. Re-run with --write to apply changes.`);
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(`[${SCRIPT_NAME}] failed`, error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});