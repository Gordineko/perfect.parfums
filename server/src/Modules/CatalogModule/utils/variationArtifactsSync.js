import mongoose from "mongoose";

import { normalizeOfferForSave } from "./catalogAdmin.helpers.js";
import {
  buildCharacteristicMetaFromVariationAxis,
  getVariationAxisBinding,
  mergeCharacteristicPresets,
  normalizeCharacteristicKey,
  normalizeLocalizedLabel,
  normalizeVariationAxesDefinitions,
} from "./variationCharacteristics.js";
import { mergeVariationTemplateAxes } from "./variationTemplate.js";

function getRootCategoryId(category) {
  if (!category) return null;
  if (!category.parentId) return category._id;
  return Array.isArray(category.ancestors) && category.ancestors.length
    ? category.ancestors[0]
    : category._id;
}

function sameSerialized(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export async function syncCharacteristicMetasForRootCategories(rootCategories = [], characteristicMetaRepo) {
  if (!characteristicMetaRepo || !rootCategories.length) {
    return { upsertedKeys: [], deletedKeys: [] };
  }

  const nextMetaByKey = new Map();

  for (const rootCategory of rootCategories) {
    for (const axis of normalizeVariationAxesDefinitions(rootCategory?.variationTemplate || [])) {
      const binding = getVariationAxisBinding(axis.axisId);
      const metaKey = normalizeCharacteristicKey(binding?.metaKey || axis.axisId);
      const previousMeta = nextMetaByKey.get(metaKey) || null;
      nextMetaByKey.set(metaKey, buildCharacteristicMetaFromVariationAxis(axis, previousMeta));
    }
  }

  const docs = [...nextMetaByKey.values()];
  if (!docs.length) {
    return { upsertedKeys: [], deletedKeys: [] };
  }

  const existing = await characteristicMetaRepo.findByKeys(docs.map((doc) => doc.key));
  const existingByKey = new Map(existing.map((item) => [item.key, item]));
  const finalDocs = docs.map((doc) => {
    const existingMeta = existingByKey.get(doc.key);

    return {
      ...doc,
      title: normalizeLocalizedLabel(doc.title, existingMeta?.title?.ua || doc.key),
      type: doc.type || existingMeta?.type || "string",
      unit: doc.unit ?? existingMeta?.unit ?? null,
      valuesPreset: mergeCharacteristicPresets(
        existingMeta?.valuesPreset || [],
        doc.valuesPreset || [],
        doc.key
      ),
      scope: doc.scope || existingMeta?.scope || "offer",
      filterable: existingMeta?.filterable ?? doc.filterable ?? true,
      searchable: existingMeta?.searchable ?? doc.searchable ?? false,
      sort: existingMeta?.sort ?? doc.sort ?? 0,
      status: existingMeta?.status || doc.status || "active",
    };
  });

  await characteristicMetaRepo.bulkUpsert(finalDocs);
  return {
    upsertedKeys: finalDocs.map((doc) => doc.key),
    deletedKeys: [],
  };
}

export async function syncVariationArtifactsForCategoryIds({
  categoryIds = [],
  categoryRepo,
  productGroupWriteRepo,
  offerWriteRepo,
  characteristicMetaRepo,
} = {}) {
  if (!categoryRepo || !productGroupWriteRepo || !Array.isArray(categoryIds) || !categoryIds.length) {
    return {
      updatedGroups: 0,
      updatedOffers: 0,
      upsertedMetaKeys: [],
    };
  }

  const affectedCategoryIdSet = new Set();
  const categoryCache = new Map();
  const rootCategoryCache = new Map();

  async function loadCategory(id) {
    const key = String(id);
    if (!categoryCache.has(key)) {
      categoryCache.set(key, await categoryRepo.getById(id));
    }
    return categoryCache.get(key);
  }

  async function loadRootCategory(category) {
    const rootCategoryId = getRootCategoryId(category);
    const key = String(rootCategoryId || "");
    if (!key) return null;

    if (!rootCategoryCache.has(key)) {
      const rootCategory =
        String(rootCategoryId) === String(category?._id)
          ? category
          : await categoryRepo.getById(rootCategoryId);
      rootCategoryCache.set(key, rootCategory || null);
    }

    return rootCategoryCache.get(key);
  }

  for (const categoryId of categoryIds) {
    const descendantIds = await categoryRepo.getDescendantIds(categoryId, {
      includeSelf: true,
      status: null,
    });

    for (const descendantId of descendantIds) {
      affectedCategoryIdSet.add(String(descendantId));
      const category = await loadCategory(descendantId);
      if (category) {
        const rootCategory = await loadRootCategory(category);
        if (rootCategory) {
          rootCategoryCache.set(String(rootCategory._id), rootCategory);
        }
      }
    }
  }

  const affectedCategoryIds = [...affectedCategoryIdSet].map(
    (value) => new mongoose.Types.ObjectId(value)
  );

  const groups = await productGroupWriteRepo.findByCategoryIds(affectedCategoryIds);
  const groupAxesById = new Map();
  let updatedGroups = 0;

  for (const group of groups) {
    let nextVariationAxes = [];

    for (const categoryId of group.categoryIds || []) {
      const category = await loadCategory(categoryId);
      if (!category) continue;

      const rootCategory = await loadRootCategory(category);
      if (!rootCategory) continue;

      nextVariationAxes = mergeVariationTemplateAxes(
        nextVariationAxes,
        normalizeVariationAxesDefinitions(rootCategory.variationTemplate || [])
      );
    }

    nextVariationAxes = normalizeVariationAxesDefinitions(
      mergeVariationTemplateAxes(nextVariationAxes, group.variationAxes || [])
    );
    groupAxesById.set(String(group._id), nextVariationAxes);

    if (sameSerialized(group.variationAxes || [], nextVariationAxes)) {
      continue;
    }

    await productGroupWriteRepo.updateById(group._id, {
      variationAxes: nextVariationAxes,
    });
    updatedGroups += 1;
  }

  const offers = offerWriteRepo && groups.length
    ? await offerWriteRepo.listByGroupIds(groups.map((group) => group._id))
    : [];
  let updatedOffers = 0;

  for (const offer of offers) {
    const variationAxes = groupAxesById.get(String(offer.groupId)) || [];
    const normalizedOffer = normalizeOfferForSave(offer, variationAxes);

    if (
      sameSerialized(offer.optionMap || {}, normalizedOffer.optionMap || {}) &&
      sameSerialized(offer.optionValues || [], normalizedOffer.optionValues || []) &&
      String(offer.optionKey || "") === String(normalizedOffer.optionKey || "") &&
      sameSerialized(offer.characteristics || [], normalizedOffer.characteristics || [])
    ) {
      continue;
    }

    await offerWriteRepo.updateById(offer._id, {
      optionMap: normalizedOffer.optionMap,
      optionValues: normalizedOffer.optionValues,
      optionKey: normalizedOffer.optionKey,
      characteristics: normalizedOffer.characteristics,
    });
    updatedOffers += 1;
  }

  const metaSync = await syncCharacteristicMetasForRootCategories(
    [...rootCategoryCache.values()].filter(Boolean),
    characteristicMetaRepo
  );

  return {
    updatedGroups,
    updatedOffers,
    upsertedMetaKeys: metaSync.upsertedKeys,
  };
}