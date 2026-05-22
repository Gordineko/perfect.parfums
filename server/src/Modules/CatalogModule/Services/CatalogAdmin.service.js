import mongoose from "mongoose";
import ExcelJS from "exceljs";
import {
  badRequest,
  normalizeLocalizedText,
  normalizeCharacteristic,
  normalizeVariationAxis,
  normalizeCategoryIds,
  normalizeOfferForSave,
  resolveEffectiveVariationAxes,
  resolveTemplateVariationAxisIds,
  buildGroupCharacteristicsFilter,
  parseNumStrict,
  parseBoolNullable
} from "../utils/catalogAdmin.helpers.js";
import {
  validateGroupPayload,
  validateVariationAxes,
  validateCharacteristics,
  validateOfferPayload,
  validateOffersUniqueness,
} from "../utils/catalogAdmin.validation.js";
import { mergeVariationTemplateAxes } from "../utils/variationTemplate.js";
import { syncCharacteristicMetasForRootCategories } from "../utils/variationArtifactsSync.js";

function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseIntStrict(v, param) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) {
    throw badRequest(`Параметр ${param} должен быть integer`, { param });
  }
  return n;
}

function parsePage(page) {
  const n = parseIntStrict(page, "page");
  return Math.max(1, n ?? 1);
}

function parseLimit(limit, fallback = 20, max = 200) {
  const n = parseIntStrict(limit, "limit");
  return Math.min(max, Math.max(1, n ?? fallback));
}

function parseBool(v, param, fallback = false) {
  if (v === undefined || v === null || v === "") return fallback;
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  throw badRequest(`Параметр ${param} должен быть boolean`, { param });
}

function buildAdminListFilter({ q, status, categoryId, char }) {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (categoryId) {
    filter.categoryIds = new mongoose.Types.ObjectId(String(categoryId));
  }

  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), "i");
    filter.$or = [
      { slug: rx },
      { "title.ua": rx },
      { "title.ru": rx },
      { "subtitle.ua": rx },
      { "subtitle.ru": rx },
    ];
  }

  const charFilter = buildGroupCharacteristicsFilter(char);
  if (charFilter.$and?.length) {
    filter.$and = [...(filter.$and || []), ...charFilter.$and];
  }

  return filter;
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function mapGroupExportRow(item) {
  return {
    id: String(item?._id || ""),
    slug: String(item?.slug || ""),
    titleUa: String(item?.title?.ua || ""),
    titleEn: String(item?.title?.en || ""),
    subtitleUa: String(item?.subtitle?.ua || ""),
    subtitleEn: String(item?.subtitle?.en || ""),
    status: String(item?.status || ""),
    imageURL: String(item?.imageURL || ""),
    categoryIds: Array.isArray(item?.categoryIds)
      ? item.categoryIds.map((x) => String(x)).join("|")
      : "",
    variationAxesCount: Array.isArray(item?.variationAxes) ? item.variationAxes.length : 0,
    characteristicsCount: Array.isArray(item?.characteristics) ? item.characteristics.length : 0,
    createdAt: item?.createdAt ? new Date(item.createdAt).toISOString() : "",
    updatedAt: item?.updatedAt ? new Date(item.updatedAt).toISOString() : "",
  };
}

function mapOfferExportRow(item, groupMap = new Map()) {
  const group = groupMap.get(String(item?.groupId || ""));

  return {
    offerId: String(item?._id || ""),
    groupId: String(item?.groupId || ""),
    groupSlug: String(group?.slug || ""),
    groupTitleUa: String(group?.title?.ua || ""),
    groupTitleEn: String(group?.title?.en || ""),
    sku: String(item?.sku || ""),
    price: Number(item?.price || 0),
    opt_price: item?.opt_price === null || item?.opt_price === undefined
      ? ""
      : Number(item.opt_price),
    available: item?.available === undefined ? "" : Boolean(item.available),
    optionKey: String(item?.optionKey || ""),
    optionMap: item?.optionMap ? JSON.stringify(item.optionMap) : "",
    stocks: Array.isArray(item?.stocks) ? JSON.stringify(item.stocks) : "",
    offerCreatedAt: item?.createdAt ? new Date(item.createdAt).toISOString() : "",
    offerUpdatedAt: item?.updatedAt ? new Date(item.updatedAt).toISOString() : "",
  };
}

export function createCatalogAdminService({
  productGroupWriteRepo,
  offerWriteRepo,
  categoryRepo,
  characteristicMetaRepo,
}) {
  async function buildVariationTemplateSyncs(categoryIds = [], variationAxes = []) {
    if (!categoryRepo || !Array.isArray(categoryIds) || !categoryIds.length) {
      return [];
    }

    if (!Array.isArray(variationAxes) || !variationAxes.length) {
      return [];
    }

    const rootCategoriesById = new Map();

    for (const categoryId of categoryIds) {
      const selectedCategory = await categoryRepo.getById(categoryId);
      if (!selectedCategory) {
        throw badRequest("Category not found", { categoryId: String(categoryId) });
      }

      const rootCategoryId = selectedCategory.parentId && Array.isArray(selectedCategory.ancestors)
        ? selectedCategory.ancestors[0]
        : selectedCategory._id;

      const rootKey = String(rootCategoryId);
      if (rootCategoriesById.has(rootKey)) {
        continue;
      }

      const rootCategory =
        String(rootCategoryId) === String(selectedCategory._id)
          ? selectedCategory
          : await categoryRepo.getById(rootCategoryId);

      if (!rootCategory) {
        throw badRequest("Root category not found", { categoryId: String(categoryId) });
      }

      rootCategoriesById.set(rootKey, rootCategory);
    }

    return Array.from(rootCategoriesById.values()).map((rootCategory) => ({
      rootCategoryId: rootCategory._id,
      previousVariationTemplate: rootCategory.variationTemplate || [],
      nextVariationTemplate: mergeVariationTemplateAxes(
        rootCategory.variationTemplate || [],
        variationAxes
      ),
    }));
  }

  return {
    async listGroups(params = {}) {
      const page = parsePage(params.page);
      const limit = parseLimit(params.limit, 20, 200);
      const skip = (page - 1) * limit;

      const available = parseBoolNullable(params.available, "available");
      const priceMin = parseNumStrict(params.priceMin, "priceMin");
      const priceMax = parseNumStrict(params.priceMax, "priceMax");

      if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
        throw badRequest("priceMin не может быть больше priceMax");
      }

      const groupFilter = buildAdminListFilter({
        q: params.q,
        status: params.status,
        categoryId: params.categoryId,
        char: params.char,
      });

      const hasOfferFilters =
        available !== null ||
        priceMin !== null ||
        priceMax !== null ||
        params.opt !== undefined ||
        params.offerChar !== undefined;

      let finalFilter = groupFilter;

      if (hasOfferFilters) {
        const matchedGroupIds = await offerWriteRepo.findGroupIdsByAdminFilters({
          available,
          priceMin,
          priceMax,
          opt: params.opt,
          offerChar: params.offerChar,
        });

        finalFilter = {
          $and: [
            groupFilter,
            { _id: { $in: matchedGroupIds.length ? matchedGroupIds : [] } },
          ],
        };
      }

      const { items, total } = await productGroupWriteRepo.findAdminPage(finalFilter, {
        skip,
        limit,
        sort: { updatedAt: -1, _id: 1 },
      });

      return {
        items,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async exportGroupsCsv(params = {}) {
      const available = parseBoolNullable(params.available, "available");
      const priceMin = parseNumStrict(params.priceMin, "priceMin");
      const priceMax = parseNumStrict(params.priceMax, "priceMax");

      if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
        throw badRequest("priceMin не может быть больше priceMax");
      }

      const groupFilter = buildAdminListFilter({
        q: params.q,
        status: params.status,
        categoryId: params.categoryId,
        char: params.char,
      });

      const hasOfferFilters =
        available !== null ||
        priceMin !== null ||
        priceMax !== null ||
        params.opt !== undefined ||
        params.offerChar !== undefined;

      let finalFilter = groupFilter;

      if (hasOfferFilters) {
        const matchedGroupIds = await offerWriteRepo.findGroupIdsByAdminFilters({
          available,
          priceMin,
          priceMax,
          opt: params.opt,
          offerChar: params.offerChar,
        });

        finalFilter = {
          $and: [
            groupFilter,
            { _id: { $in: matchedGroupIds.length ? matchedGroupIds : [] } },
          ],
        };
      }

      const { items } = await productGroupWriteRepo.findAdminPage(finalFilter, {
        skip: 0,
        limit: 10000,
        sort: { updatedAt: -1, _id: 1 },
      });

      const groupIds = items.map((x) => x._id);
      const offers = await offerWriteRepo.listByGroupIds(groupIds, {
        available,
        priceMin,
        priceMax,
        opt: params.opt,
        offerChar: params.offerChar,
      });

      const groupMap = new Map(items.map((x) => [String(x._id), x]));
      const offersByGroup = new Map();
      for (const offer of offers) {
        const gid = String(offer.groupId);
        if (!offersByGroup.has(gid)) offersByGroup.set(gid, []);
        offersByGroup.get(gid).push(offer);
      }

      const rows = [];
      for (const group of items) {
        const groupRow = mapGroupExportRow(group);
        const groupOffers = offersByGroup.get(String(group._id)) || [];

        if (!groupOffers.length) {
          rows.push({
            ...groupRow,
            offerId: "",
            sku: "",
            price: "",
            opt_price: "",
            available: "",
            optionKey: "",
            optionMap: "",
            stocks: "",
            offerCreatedAt: "",
            offerUpdatedAt: "",
          });
          continue;
        }

        for (const offer of groupOffers) {
          rows.push({
            ...groupRow,
            ...mapOfferExportRow(offer, groupMap),
          });
        }
      }

      const headers = [
        "id",
        "slug",
        "titleUa",
        "titleEn",
        "subtitleUa",
        "subtitleEn",
        "status",
        "imageURL",
        "categoryIds",
        "variationAxesCount",
        "characteristicsCount",
        "createdAt",
        "updatedAt",
        "offerId",
        "sku",
        "price",
        "opt_price",
        "available",
        "optionKey",
        "optionMap",
        "stocks",
        "offerCreatedAt",
        "offerUpdatedAt",
      ];

      const lines = [headers.join(",")];
      for (const row of rows) {
        lines.push(headers.map((key) => escapeCsv(row[key])).join(","));
      }

      return lines.join("\n");
    },

    async exportGroupsXlsx(params = {}) {
      const available = parseBoolNullable(params.available, "available");
      const priceMin = parseNumStrict(params.priceMin, "priceMin");
      const priceMax = parseNumStrict(params.priceMax, "priceMax");

      if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
        throw badRequest("priceMin не может быть больше priceMax");
      }

      const groupFilter = buildAdminListFilter({
        q: params.q,
        status: params.status,
        categoryId: params.categoryId,
        char: params.char,
      });

      const hasOfferFilters =
        available !== null ||
        priceMin !== null ||
        priceMax !== null ||
        params.opt !== undefined ||
        params.offerChar !== undefined;

      let finalFilter = groupFilter;

      if (hasOfferFilters) {
        const matchedGroupIds = await offerWriteRepo.findGroupIdsByAdminFilters({
          available,
          priceMin,
          priceMax,
          opt: params.opt,
          offerChar: params.offerChar,
        });

        finalFilter = {
          $and: [
            groupFilter,
            { _id: { $in: matchedGroupIds.length ? matchedGroupIds : [] } },
          ],
        };
      }

      const { items } = await productGroupWriteRepo.findAdminPage(finalFilter, {
        skip: 0,
        limit: 10000,
        sort: { updatedAt: -1, _id: 1 },
      });

      const groupRows = items.map(mapGroupExportRow);
      const groupIds = items.map((x) => x._id);
      const offers = await offerWriteRepo.listByGroupIds(groupIds, {
        available,
        priceMin,
        priceMax,
        opt: params.opt,
        offerChar: params.offerChar,
      });

      const groupMap = new Map(items.map((x) => [String(x._id), x]));
      const offerRows = offers.map((offer) => mapOfferExportRow(offer, groupMap));

      const workbook = new ExcelJS.Workbook();
      const groupsSheet = workbook.addWorksheet("groups");

      groupsSheet.columns = [
        { header: "id", key: "id", width: 30 },
        { header: "slug", key: "slug", width: 34 },
        { header: "titleUa", key: "titleUa", width: 28 },
        { header: "titleEn", key: "titleEn", width: 28 },
        { header: "subtitleUa", key: "subtitleUa", width: 34 },
        { header: "subtitleEn", key: "subtitleEn", width: 34 },
        { header: "status", key: "status", width: 12 },
        { header: "imageURL", key: "imageURL", width: 44 },
        { header: "categoryIds", key: "categoryIds", width: 40 },
        { header: "variationAxesCount", key: "variationAxesCount", width: 18 },
        { header: "characteristicsCount", key: "characteristicsCount", width: 18 },
        { header: "createdAt", key: "createdAt", width: 28 },
        { header: "updatedAt", key: "updatedAt", width: 28 },
      ];

      groupsSheet.addRows(groupRows);

      const offersSheet = workbook.addWorksheet("offers");
      offersSheet.columns = [
        { header: "offerId", key: "offerId", width: 30 },
        { header: "groupId", key: "groupId", width: 30 },
        { header: "groupSlug", key: "groupSlug", width: 34 },
        { header: "groupTitleUa", key: "groupTitleUa", width: 28 },
        { header: "groupTitleEn", key: "groupTitleEn", width: 28 },
        { header: "sku", key: "sku", width: 28 },
        { header: "price", key: "price", width: 12 },
        { header: "opt_price", key: "opt_price", width: 12 },
        { header: "available", key: "available", width: 12 },
        { header: "optionKey", key: "optionKey", width: 32 },
        { header: "optionMap", key: "optionMap", width: 40 },
        { header: "stocks", key: "stocks", width: 40 },
        { header: "offerCreatedAt", key: "offerCreatedAt", width: 28 },
        { header: "offerUpdatedAt", key: "offerUpdatedAt", width: 28 },
      ];

      offersSheet.addRows(offerRows);

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    },

    async getGroupForAdmin(groupId, params = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(groupId))) {
        throw badRequest("Invalid groupId");
      }

      const includeOffers = parseBool(params.includeOffers, "includeOffers", false);
      const offersPage = parsePage(params.offersPage);
      const offersLimit = parseLimit(params.offersLimit, 50, 200);
      const offersSkip = (offersPage - 1) * offersLimit;

      const group = await productGroupWriteRepo.findById(groupId);
      if (!group) return null;

      if (!includeOffers) {
        return {
          ...group,
          offers: [],
          offersMeta: {
            page: offersPage,
            limit: offersLimit,
            total: 0,
            pages: 0,
            included: false,
          },
        };
      }

      const { items, total } = await offerWriteRepo.findPageByGroup(
        groupId,
        {},
        {
          skip: offersSkip,
          limit: offersLimit,
          sort: { available: -1, _id: 1 },
        }
      );

      return {
        ...group,
        offers: items,
        offersMeta: {
          page: offersPage,
          limit: offersLimit,
          total,
          pages: Math.ceil(total / offersLimit),
          included: true,
        },
      };
    },

    async createGroup(payload = {}) {
      validateGroupPayload(payload);

      const categoryIds = normalizeCategoryIds(payload.categoryIds || []);
      const variationAxes = (payload.variationAxes || []).map(normalizeVariationAxis);
      validateVariationAxes(variationAxes);
      const effectiveVariationAxes = await resolveEffectiveVariationAxes({
        categoryIds,
        variationAxes,
        categoryRepo,
      });
      const optionalAxisIds = await resolveTemplateVariationAxisIds({
        categoryIds,
        categoryRepo,
      });

      const groupCharacteristics = Array.isArray(payload.characteristics)
        ? payload.characteristics.map(normalizeCharacteristic)
        : [];
      validateCharacteristics(groupCharacteristics, "characteristics");

      const normalizedOffers = (payload.offers || []).map((rawOffer, index) => {
        validateOfferPayload(rawOffer, index, effectiveVariationAxes, {
          optionalAxisIds,
        });
        return normalizeOfferForSave(rawOffer, effectiveVariationAxes);
      });

      validateOffersUniqueness(normalizedOffers);

      const existingBySlug = await productGroupWriteRepo.findBySlug(
        String(payload.slug).trim()
      );
      if (existingBySlug) {
        throw badRequest("Slug already exists", { slug: payload.slug });
      }

      for (const offer of normalizedOffers) {
        const existingSku = await offerWriteRepo.findBySku(offer.sku);
        if (existingSku) {
          throw badRequest(`SKU already exists: ${offer.sku}`, { sku: offer.sku });
        }
      }

      const variationTemplateSyncs = await buildVariationTemplateSyncs(categoryIds, variationAxes);
      const appliedTemplateSyncs = [];

      const createdGroup = await productGroupWriteRepo.create({
        slug: String(payload.slug).trim(),
        title: normalizeLocalizedText(payload.title),
        subtitle: normalizeLocalizedText(payload.subtitle),
        description: normalizeLocalizedText(payload.description),
        categoryIds,
        imageURL: String(payload.imageURL || ""),
        variationAxes,
        characteristics: groupCharacteristics,
        status: payload.status || "active",
      });

      try {
        await offerWriteRepo.bulkUpsert(createdGroup._id, normalizedOffers);

        for (const templateSync of variationTemplateSyncs) {
          await categoryRepo.updateById(templateSync.rootCategoryId, {
            variationTemplate: templateSync.nextVariationTemplate,
          });
          appliedTemplateSyncs.push(templateSync);
        }

        if (characteristicMetaRepo && appliedTemplateSyncs.length) {
          const rootCategories = await Promise.all(
            appliedTemplateSyncs.map((templateSync) => categoryRepo.getById(templateSync.rootCategoryId))
          );
          await syncCharacteristicMetasForRootCategories(
            rootCategories.filter(Boolean),
            characteristicMetaRepo
          );
        }
      } catch (e) {
        for (const templateSync of appliedTemplateSyncs.reverse()) {
          try {
            await categoryRepo.updateById(templateSync.rootCategoryId, {
              variationTemplate: templateSync.previousVariationTemplate,
            });
          } catch {}
        }

        await productGroupWriteRepo.deleteById(createdGroup._id);
        throw e;
      }

      return {
        ...createdGroup,
        offersMeta: {
          page: 1,
          limit: 50,
          total: normalizedOffers.length,
          pages: Math.ceil(normalizedOffers.length / 50),
          included: false,
        },
      };
    },

    async updateGroup(groupId, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(groupId))) {
        throw badRequest("Invalid groupId");
      }

      validateGroupPayload(payload);

      const current = await productGroupWriteRepo.findById(groupId);
      if (!current) {
        throw badRequest("Group not found");
      }

      const categoryIds = normalizeCategoryIds(payload.categoryIds || []);
      const variationAxes = (payload.variationAxes || []).map(normalizeVariationAxis);
      validateVariationAxes(variationAxes);
      const effectiveVariationAxes = await resolveEffectiveVariationAxes({
        categoryIds,
        variationAxes,
        categoryRepo,
      });
      const optionalAxisIds = await resolveTemplateVariationAxisIds({
        categoryIds,
        categoryRepo,
      });

      const groupCharacteristics = Array.isArray(payload.characteristics)
        ? payload.characteristics.map(normalizeCharacteristic)
        : [];
      validateCharacteristics(groupCharacteristics, "characteristics");

      const normalizedOffers = (payload.offers || []).map((rawOffer, index) => {
        validateOfferPayload(rawOffer, index, effectiveVariationAxes, {
          optionalAxisIds,
        });
        return normalizeOfferForSave(rawOffer, effectiveVariationAxes);
      });

      validateOffersUniqueness(normalizedOffers);

      const existingBySlug = await productGroupWriteRepo.findBySlug(
        String(payload.slug).trim()
      );

      if (existingBySlug && String(existingBySlug._id) !== String(groupId)) {
        throw badRequest("Slug already exists", { slug: payload.slug });
      }

      for (const offer of normalizedOffers) {
        const existingSku = await offerWriteRepo.findBySku(offer.sku);

        if (
          existingSku &&
          String(existingSku.groupId) !== String(groupId) &&
          String(existingSku._id) !== String(offer._id || "")
        ) {
          throw badRequest(`SKU already exists: ${offer.sku}`, { sku: offer.sku });
        }
      }

      const previousGroupSnapshot = {
        slug: current.slug,
        title: current.title,
        subtitle: current.subtitle,
        description: current.description,
        categoryIds: current.categoryIds,
        imageURL: current.imageURL,
        variationAxes: current.variationAxes,
        characteristics: current.characteristics,
        status: current.status,
      };

      const previousOffers = await offerWriteRepo.listByGroup(groupId);
      const variationTemplateSyncs = await buildVariationTemplateSyncs(categoryIds, variationAxes);
      const appliedTemplateSyncs = [];

      const updatedGroup = await productGroupWriteRepo.updateById(groupId, {
        slug: String(payload.slug).trim(),
        title: normalizeLocalizedText(payload.title),
        subtitle: normalizeLocalizedText(payload.subtitle),
        description: normalizeLocalizedText(payload.description),
        categoryIds,
        imageURL: String(payload.imageURL || ""),
        variationAxes,
        characteristics: groupCharacteristics,
        status: payload.status || "active",
      });

      try {
        const incomingIds = new Set(
          normalizedOffers
            .filter((x) => x._id)
            .map((x) => String(x._id))
        );

        const toDeleteIds = previousOffers
          .filter((x) => !incomingIds.has(String(x._id)))
          .map((x) => x._id);

        await offerWriteRepo.bulkUpsert(groupId, normalizedOffers);
        await offerWriteRepo.deleteManyByIds(toDeleteIds);

        for (const templateSync of variationTemplateSyncs) {
          await categoryRepo.updateById(templateSync.rootCategoryId, {
            variationTemplate: templateSync.nextVariationTemplate,
          });
          appliedTemplateSyncs.push(templateSync);
        }

        if (characteristicMetaRepo && appliedTemplateSyncs.length) {
          const rootCategories = await Promise.all(
            appliedTemplateSyncs.map((templateSync) => categoryRepo.getById(templateSync.rootCategoryId))
          );
          await syncCharacteristicMetasForRootCategories(
            rootCategories.filter(Boolean),
            characteristicMetaRepo
          );
        }
      } catch (e) {
        await productGroupWriteRepo.updateById(groupId, previousGroupSnapshot);

        await offerWriteRepo.deleteByGroupId(groupId);
        if (previousOffers.length) {
          await offerWriteRepo.bulkUpsert(
            groupId,
            previousOffers.map((offer) => ({
              ...offer,
              _id: offer._id,
            }))
          );
        }

        for (const templateSync of appliedTemplateSyncs.reverse()) {
          try {
            await categoryRepo.updateById(templateSync.rootCategoryId, {
              variationTemplate: templateSync.previousVariationTemplate,
            });
          } catch {}
        }

        throw e;
      }

      return {
        ...updatedGroup,
        offersMeta: {
          page: 1,
          limit: 50,
          total: normalizedOffers.length,
          pages: Math.ceil(normalizedOffers.length / 50),
          included: false,
        },
      };
    },

    async patchGroup(groupId, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(groupId))) {
        throw badRequest("Invalid groupId");
      }

      const current = await productGroupWriteRepo.findById(groupId);
      if (!current) {
        throw badRequest("Group not found");
      }

      const patch = {};

      if (payload.slug !== undefined) {
        const slug = String(payload.slug || "").trim();
        if (!slug) throw badRequest("slug cannot be empty");

        const existingBySlug = await productGroupWriteRepo.findBySlug(slug);
        if (existingBySlug && String(existingBySlug._id) !== String(groupId)) {
          throw badRequest("Slug already exists", { slug });
        }

        patch.slug = slug;
      }

      if (payload.title !== undefined) {
        patch.title = normalizeLocalizedText(payload.title);
      }

      if (payload.subtitle !== undefined) {
        patch.subtitle = normalizeLocalizedText(payload.subtitle);
      }

      if (payload.description !== undefined) {
        patch.description = normalizeLocalizedText(payload.description);
      }

      if (payload.status !== undefined) {
        patch.status = payload.status;
      }

      if (payload.imageURL !== undefined) {
        patch.imageURL = String(payload.imageURL || "");
      }

      if (payload.categoryIds !== undefined) {
        patch.categoryIds = normalizeCategoryIds(payload.categoryIds || []);
      }

      if (payload.characteristics !== undefined) {
        const groupCharacteristics = Array.isArray(payload.characteristics)
          ? payload.characteristics.map(normalizeCharacteristic)
          : [];
        validateCharacteristics(groupCharacteristics, "characteristics");
        patch.characteristics = groupCharacteristics;
      }

      if (payload.variationAxes !== undefined) {
        throw badRequest("variationAxes cannot be changed via PATCH group; use full PUT");
      }

      if (payload.offers !== undefined) {
        throw badRequest("offers cannot be changed via PATCH group; use offer endpoints or full PUT");
      }

      if (!Object.keys(patch).length) {
        throw badRequest("Nothing to update");
      }

      return productGroupWriteRepo.updateById(groupId, patch);
    },

    async deleteGroup(groupId) {
      if (!mongoose.Types.ObjectId.isValid(String(groupId))) {
        throw badRequest("Invalid groupId");
      }

      const current = await productGroupWriteRepo.findById(groupId);
      if (!current) {
        throw badRequest("Group not found");
      }

      await offerWriteRepo.deleteByGroupId(groupId);
      await productGroupWriteRepo.deleteById(groupId);

      return { ok: true };
    },

    async getGroupFilters(params = {}) {
      const available = parseBoolNullable(params.available, "available");
      const priceMin = parseNumStrict(params.priceMin, "priceMin");
      const priceMax = parseNumStrict(params.priceMax, "priceMax");

      const groupFilter = buildAdminListFilter({
        q: params.q,
        status: params.status,
        categoryId: params.categoryId,
        char: params.char,
      });

      const groups = await productGroupWriteRepo.findIdsWithAxes(groupFilter);
      const groupIds = groups.map((g) => g._id);

      if (!groupIds.length) {
        return {
          filters: {
            axes: [],
            groupCharacteristics: [],
            offerCharacteristics: [],
            price: { min: null, max: null }
          }
        };
      }

      const offerFilter = {
        groupId: { $in: groupIds },
      };

      if (available !== null) {
        offerFilter.available = available;
      }

      if (priceMin != null || priceMax != null) {
        offerFilter.price = {};
        if (priceMin != null) offerFilter.price.$gte = priceMin;
        if (priceMax != null) offerFilter.price.$lte = priceMax;
      }

      const [axes, price, offerChars] = await Promise.all([
        offerWriteRepo.aggregateAxes(groupIds),
        offerWriteRepo.aggregatePrice(groupIds),
        offerWriteRepo.aggregateOfferCharacteristicBuckets({
          offerBaseMatch: offerFilter,
          allowedKeys: null
        })
      ]);

      const groupChars = await productGroupWriteRepo.aggregateGroupCharacteristicBuckets(groupIds);

      return {
        filters: {
          axes,
          groupCharacteristics: groupChars,
          offerCharacteristics: offerChars,
          price
        }
      };
    }
  };
}