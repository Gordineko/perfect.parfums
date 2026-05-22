import mongoose from "mongoose";
import {
  badRequest,
  normalizeStocks,
  normalizeOfferForSave,
  resolveEffectiveVariationAxes,
  resolveTemplateVariationAxisIds,
} from "../utils/catalogAdmin.helpers.js";
import {
  validateOfferPayload,
} from "../utils/catalogAdmin.validation.js";

function parseIntStrict(v, param) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) {
    throw badRequest(`Параметр ${param} должен быть integer`, { param });
  }
  return n;
}

function parseBoolNullable(v, param) {
  if (v === undefined || v === null || v === "") return null;
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  throw badRequest(`Параметр ${param} должен быть boolean`, { param });
}

function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeJsonParse(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function buildOfferListFilter({ q, available, sku, opt }) {
  const filter = {};

  const availableBool = parseBoolNullable(available, "available");
  if (availableBool !== null) {
    filter.available = availableBool;
  }

  if (sku && String(sku).trim()) {
    const rx = new RegExp(escapeRegex(String(sku).trim()), "i");
    filter.sku = rx;
  } else if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), "i");
    filter.$or = [{ sku: rx }, { optionKey: rx }];
  }

  const optObj = safeJsonParse(opt, null);

  if (optObj && typeof optObj === "object") {
    for (const [axisId, rawValue] of Object.entries(optObj)) {
      if (rawValue === undefined || rawValue === null || rawValue === "") continue;

      if (Array.isArray(rawValue)) {
        const arr = rawValue.filter((x) => x !== undefined && x !== null && x !== "");
        if (!arr.length) continue;

        filter[`optionMap.${axisId}`] = { $in: arr };
      } else {
        filter[`optionMap.${axisId}`] = rawValue;
      }
    }
  }

  return filter;
}

function buildOfferSelect(compact = false) {
  if (!compact) return null;

  return {
    sku: 1,
    price: 1,
    opt_price: 1,
    available: 1,
    img: 1,
    optionMap: 1,
    optionKey: 1,
    stocks: 1,
    updatedAt: 1,
  };
}

export function createCatalogAdminOffersService({
  productGroupWriteRepo,
  offerWriteRepo,
  categoryRepo,
}) {
  return {
    async listGroupOffers(groupId, params = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(groupId))) {
        throw badRequest("Invalid groupId");
      }

      const group = await productGroupWriteRepo.findById(groupId);
      if (!group) throw badRequest("Group not found");
      const effectiveVariationAxes = await resolveEffectiveVariationAxes({
        categoryIds: group.categoryIds || [],
        variationAxes: group.variationAxes || [],
        categoryRepo,
      });

      const page = Math.max(1, parseIntStrict(params.page, "page") ?? 1);
      const limit = Math.min(200, Math.max(1, parseIntStrict(params.limit, "limit") ?? 50));
      const skip = (page - 1) * limit;

      const compact =
        params.compact === "1" ||
        params.compact === "true" ||
        params.compact === true;

      const filter = buildOfferListFilter({
        q: params.q,
        available: params.available,
        sku: params.sku,
        opt: params.opt,
      });

      const { items, total } = await offerWriteRepo.findPageByGroup(groupId, filter, {
        skip,
        limit,
        sort: { available: -1, _id: 1 },
        select: buildOfferSelect(compact),
      });

      return {
        variationAxes: effectiveVariationAxes,
        appliedFilters: {
          q: params.q ?? null,
          sku: params.sku ?? null,
          available: params.available ?? null,
          opt: safeJsonParse(params.opt, null),
        },
        items,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async createOffer(groupId, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(groupId))) {
        throw badRequest("Invalid groupId");
      }

      const group = await productGroupWriteRepo.findById(groupId);
      if (!group) throw badRequest("Group not found");
      const effectiveVariationAxes = await resolveEffectiveVariationAxes({
        categoryIds: group.categoryIds || [],
        variationAxes: group.variationAxes || [],
        categoryRepo,
      });
      const optionalAxisIds = await resolveTemplateVariationAxisIds({
        categoryIds: group.categoryIds || [],
        categoryRepo,
      });

      validateOfferPayload(payload, 0, effectiveVariationAxes, {
        optionalAxisIds,
      });

      const normalized = normalizeOfferForSave(payload, effectiveVariationAxes);

      const existingSku = await offerWriteRepo.findBySku(normalized.sku);
      if (existingSku) {
        throw badRequest(`SKU already exists: ${normalized.sku}`);
      }

      const existingOffers = await offerWriteRepo.listByGroup(groupId);
      const sameOptionKey = existingOffers.find(
        (x) => String(x.optionKey) === String(normalized.optionKey)
      );
      if (sameOptionKey) {
        throw badRequest(`Variant combination already exists: ${normalized.optionKey}`);
      }

      return offerWriteRepo.create({
        groupId,
        sku: normalized.sku,
        price: normalized.price,
        opt_price: normalized.opt_price,
        available: normalized.available,
        img: normalized.img,
        optionMap: normalized.optionMap,
        optionValues: normalized.optionValues,
        optionKey: normalized.optionKey,
        characteristics: normalized.characteristics,
        stocks: normalized.stocks,
      });
    },

    async patchOffer(offerId, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
        throw badRequest("Invalid offerId");
      }

      const current = await offerWriteRepo.findById(offerId);
      if (!current) throw badRequest("Offer not found");

      const group = await productGroupWriteRepo.findById(current.groupId);
      if (!group) throw badRequest("Group not found");
      const effectiveVariationAxes = await resolveEffectiveVariationAxes({
        categoryIds: group.categoryIds || [],
        variationAxes: group.variationAxes || [],
        categoryRepo,
      });
      const optionalAxisIds = await resolveTemplateVariationAxisIds({
        categoryIds: group.categoryIds || [],
        categoryRepo,
      });

      const nextRaw = {
        ...current,
        ...payload,
        _id: current._id,
      };

      validateOfferPayload(nextRaw, 0, effectiveVariationAxes, {
        optionalAxisIds,
      });

      const normalized = normalizeOfferForSave(nextRaw, effectiveVariationAxes);

      const existingSku = await offerWriteRepo.findBySku(normalized.sku);
      if (existingSku && String(existingSku._id) !== String(current._id)) {
        throw badRequest(`SKU already exists: ${normalized.sku}`);
      }

      const existingOffers = await offerWriteRepo.listByGroup(current.groupId);
      const sameOptionKey = existingOffers.find(
        (x) =>
          String(x._id) !== String(current._id) &&
          String(x.optionKey) === String(normalized.optionKey)
      );
      if (sameOptionKey) {
        throw badRequest(`Variant combination already exists: ${normalized.optionKey}`);
      }

      return offerWriteRepo.updateById(offerId, {
        sku: normalized.sku,
        price: normalized.price,
        opt_price: normalized.opt_price,
        available: normalized.available,
        img: normalized.img,
        optionMap: normalized.optionMap,
        optionValues: normalized.optionValues,
        optionKey: normalized.optionKey,
        characteristics: normalized.characteristics,
        stocks: normalized.stocks,
      });
    },

    async patchOfferAvailability(offerId, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
        throw badRequest("Invalid offerId");
      }

      const current = await offerWriteRepo.findById(offerId);
      if (!current) throw badRequest("Offer not found");

      if (typeof payload.available !== "boolean") {
        throw badRequest("available must be boolean");
      }

      return offerWriteRepo.updateById(offerId, {
        available: payload.available,
      });
    },

    async patchOfferPrice(offerId, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
        throw badRequest("Invalid offerId");
      }

      const current = await offerWriteRepo.findById(offerId);
      if (!current) throw badRequest("Offer not found");

      const patch = {};

      if (payload.price !== undefined) {
        const price = Number(payload.price);
        if (!Number.isFinite(price) || price < 0) {
          throw badRequest("price must be a valid number >= 0");
        }
        patch.price = price;
      }

      if (payload.opt_price !== undefined) {
        if (payload.opt_price === null || payload.opt_price === "") {
          patch.opt_price = null;
        } else {
          const optPrice = Number(payload.opt_price);
          if (!Number.isFinite(optPrice) || optPrice < 0) {
            throw badRequest("opt_price must be null or a valid number >= 0");
          }
          patch.opt_price = optPrice;
        }
      }

      if (!Object.keys(patch).length) {
        throw badRequest("Nothing to update");
      }

      return offerWriteRepo.updateById(offerId, patch);
    },

    async patchOfferStocks(offerId, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
        throw badRequest("Invalid offerId");
      }

      const current = await offerWriteRepo.findById(offerId);
      if (!current) throw badRequest("Offer not found");

      if (!Array.isArray(payload.stocks)) {
        throw badRequest("stocks must be array");
      }

      return offerWriteRepo.updateById(offerId, {
        stocks: normalizeStocks(payload.stocks),
      });
    },

    async deleteOffer(offerId) {
      if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
        throw badRequest("Invalid offerId");
      }

      const current = await offerWriteRepo.findById(offerId);
      if (!current) throw badRequest("Offer not found");

      await offerWriteRepo.deleteById(offerId);

      return { ok: true };
    },
  };
}