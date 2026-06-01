// CatalogCards.service.js — ПОЛНАЯ ВЕРСИЯ (с обработкой ошибок фильтрации)

import { buildGroupFilter, buildOfferCharMatch } from "./CatalogFilterBuilder.js";
import { resolveFilterCategoryIds } from "../utils/resolveFilterCategoryIds.js";

/* =========================================================
   1) Ошибки / helpers
   ========================================================= */

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

function parseIntStrict(v, param) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) {
    throw badRequest(`Параметр ${param} должен быть integer`, { param });
  }
  return n;
}

function parseIntSafe(v, fallback = 0) {
  const n = parseIntStrict(v, null);
  return n === null ? fallback : n;
}

function parseNumStrict(v, param) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw badRequest(`Параметр ${param} должен быть числом`, { param });
  }
  return n;
}

function parseBoolStrict(v, param, fallback = false) {
  if (v === undefined || v === null || v === "") return fallback;
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  throw badRequest(`Параметр ${param} должен быть boolean`, { param });
}

function parseJsonStrict(raw, paramName) {
  if (raw === undefined || raw === null || raw === "") return null;

  if (typeof raw === "object") return raw;

  try {
    return JSON.parse(String(raw));
  } catch {
    throw badRequest(`Некорректный JSON в параметре ${paramName}`, { param: paramName });
  }
}

function collectAxisIds(groups = []) {
  const seen = new Set();
  const axisIds = [];

  for (const group of groups) {
    const axes = Array.isArray(group?.variationAxes) ? group.variationAxes : [];
    for (const axis of axes) {
      const axisId = axis?.axisId;
      if (!axisId || seen.has(axisId)) continue;
      seen.add(axisId);
      axisIds.push(axisId);
    }
  }

  return axisIds;
}

function hasOwnEntries(value) {
  return Boolean(value) && typeof value === "object" && Object.keys(value).length > 0;
}

/* =========================================================
   2) Сортировка (строго)
   ========================================================= */

const sortMap = {
  updated_desc: { updatedAt: -1, _id: 1 },
  updated_asc: { updatedAt: 1, _id: 1 },
  price_asc: "__PRICE_ASC__",
  price_desc: "__PRICE_DESC__",
  title_asc: { "title.ua": 1, _id: 1 },
  title_desc: { "title.ua": -1, _id: 1 },
  new: { createdAt: -1, _id: 1 },
  popularity: { "popularity.count": -1, _id: 1 },
};

export function parseSort(sortRaw) {
  const key = String(sortRaw || "updated_desc");
  if (!Object.prototype.hasOwnProperty.call(sortMap, key)) {
    throw badRequest(`Invalid sort: ${key}`, { allowed: Object.keys(sortMap) });
  }
  return { key, mongoSort: sortMap[key] };
}

/* =========================================================
   3) Основной сервис
   ========================================================= */

export function createCatalogCardsService({
  productGroupRepo,
  offerRepo,
  categoryRepo,
}) {
  return {
    async buildCatalogCards(params = {}) {
      // ===== строгая валидация query =====
      const pageRaw = parseIntStrict(params.page, "page");
      const limitRaw = parseIntStrict(params.limit, "limit");

      const safePage = Math.max(1, pageRaw ?? 1);
      const safeLimit = Math.min(200, Math.max(1, limitRaw ?? 24));
      const skip = (safePage - 1) * safeLimit;

      const onlyAvailableRaw = params.onlyAvailable;
      const priceMin = parseNumStrict(params.priceMin, "priceMin");
      const priceMax = parseNumStrict(params.priceMax, "priceMax");

      if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
        throw badRequest("priceMin не может быть больше priceMax");
      }

      const charObj = parseJsonStrict(params.char, "char");
      const offerCharObj = parseJsonStrict(params.offerChar, "offerChar");
      const optObj = parseJsonStrict(params.opt, "opt");

      const hasOfferLevelFilteringInput =
        Boolean(offerCharObj && typeof offerCharObj === "object" && Object.keys(offerCharObj).length) ||
        Boolean(optObj && typeof optObj === "object" && Object.keys(optObj).length);

      const onlyAvailableDefault = hasOfferLevelFilteringInput ? true : false;
      const onlyAvailable = parseBoolStrict(
        onlyAvailableRaw,
        "onlyAvailable",
        onlyAvailableDefault
      );

      const isPopular = parseBoolStrict(params.isPopular, "isPopular", false);
      const isSale = parseBoolStrict(params.isSale, "isSale", false);
      const isNew = parseBoolStrict(params.isNew, "isNew", false);


      const status = params.status || "active";
      const categoryId = params.categoryId || null;
      const categoryInclude = params.categoryInclude || "branch";

      const categoryIds = await resolveFilterCategoryIds({
        categoryRepo,
        categoryId,
        categoryInclude,
        categoryIdsParam: params.categoryIds ?? null,
      });

      // ===== group filter =====
      const groupFilter = buildGroupFilter({
        status,
        categoryIds,
        q: params.q,
        charRaw: charObj,
        isPopular,
        isNew,
        isSale,
      });

      const offerCharMatch = buildOfferCharMatch(offerCharObj);
      const hasOfferCharFiltering = hasOwnEntries(offerCharMatch);

      const enabledPreview =
        params.preview !== undefined
          ? parseBoolStrict(params.preview, "preview", true)
          : true;

      const depth = Math.max(
        0,
        Math.min(20, parseIntStrict(params.depth, "depth") ?? 2)
      );

      const maxValuesPerAxis = Math.max(
        1,
        Math.min(
          50,
          parseIntStrict(params.maxValuesPerAxis, "maxValuesPerAxis") ?? 6
        )
      );

      const includeOffers = params.includeOffers || "none";
      const maxOffersPerGroup =
        parseIntStrict(params.maxOffersPerGroup, "maxOffersPerGroup") ?? 80;

      const { key: sortKey, mongoSort } = parseSort(params.sort);

      const hasOfferFiltering =
        Boolean(offerCharObj) ||
        Boolean(optObj) ||
        onlyAvailable ||
        priceMin != null ||
        priceMax != null;

      let finalGroupFilter = groupFilter;
      let optAxisFilter = null;

      if (hasOfferFiltering) {
        const baseGroups = await productGroupRepo.findIdsWithAxes(groupFilter);
        const baseGroupIds = baseGroups.map((g) => g._id);

        if (!baseGroupIds.length) {
          return {
            items: [],
            meta: { page: safePage, limit: safeLimit, total: 0, pages: 0 },
          };
        }

        if (optObj && typeof optObj === "object") {
          const axisIds = new Set(collectAxisIds(baseGroups));
          const map = {};

          for (const [axisId, val] of Object.entries(optObj)) {
            if (axisIds.has(axisId)) map[axisId] = val;
          }

          optAxisFilter = Object.keys(map).length ? map : null;
        }

        const matchedGroupIds = await offerRepo.getMatchedGroupIdsByOfferFilters(
          {
            baseGroupIds,
            onlyAvailable,
            priceMin,
            priceMax,
            optAxisFilter,
            offerCharMatch,
          }
        );

        finalGroupFilter = {
          $and: [
            groupFilter,
            { _id: { $in: matchedGroupIds.length ? matchedGroupIds : [] } },
          ],
        };
      }

      let groups, total;

      if (sortKey === "price_asc" || sortKey === "price_desc") {
        // Сортировка по цене: пагинируем через офферы (без денормализации на ProductGroup)
        const sortDir = sortKey === "price_asc" ? 1 : -1;

        const allGroupIds = await productGroupRepo.findIds(finalGroupFilter);

        if (!allGroupIds.length) {
          return {
            items: [],
            meta: { page: safePage, limit: safeLimit, total: 0, pages: 0 },
          };
        }

        const pricePageResult = await offerRepo.paginateByMinPrice({
          groupIds: allGroupIds,
          sortDir,
          skip,
          limit: safeLimit,
          onlyAvailable,
          priceMin,
          priceMax,
          offerCharMatch,
          optAxisFilter,
        });

        total = pricePageResult.total;

        if (!pricePageResult.sortedGroupIds.length) {
          return {
            items: [],
            meta: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
          };
        }

        groups = await productGroupRepo.findByIds(pricePageResult.sortedGroupIds);

        // Восстанавливаем порядок, заданный агрегацией по цене
        const orderMap = new Map(
          pricePageResult.sortedGroupIds.map((id, i) => [String(id), i])
        );
        groups.sort(
          (a, b) => (orderMap.get(String(a._id)) ?? 0) - (orderMap.get(String(b._id)) ?? 0)
        );
      } else {
        const pageRes = await productGroupRepo.findPage(finalGroupFilter, {
          skip,
          limit: safeLimit,
          sort: mongoSort || { updatedAt: -1, _id: 1 },
        });
        groups = pageRes.items;
        total = pageRes.total;
      }

      if (!groups.length) {
        return {
          items: [],
          meta: {
            page: safePage,
            limit: safeLimit,
            total,
            pages: Math.ceil(total / safeLimit),
          },
        };
      }

      const groupIds = groups.map((g) => g._id);

      const offerAgg = await offerRepo.aggregateCatalogInfo({
        groupIds,
        enabledPreview,
        depth,
        maxValuesPerAxis,
        includeOffers,
        maxOffersPerGroup,
        onlyAvailable,
        priceMin,
        priceMax,
        optAxisFilter,
        offerCharMatch,
        preferMatchedOfferImage: hasOfferCharFiltering || Boolean(optAxisFilter),
      });

      const aggByGroupId = new Map();
      for (const a of offerAgg) {
        aggByGroupId.set(String(a._id), a);
      }

      // ===== подтягиваем категории =====
      const categoryIdsSet = new Set();

      for (const g of groups) {
        const rawCategoryIds = Array.isArray(g.categoryIds)
          ? g.categoryIds
          : g.categoryId
            ? [g.categoryId]
            : [];

        for (const id of rawCategoryIds) {
          if (id) categoryIdsSet.add(String(id));
        }
      }

      const categoryIdsArr = Array.from(categoryIdsSet);

      const categoriesRaw = categoryIdsArr.length
        ? await categoryRepo.listByIds(categoryIdsArr)
        : [];

      const categoryMap = new Map();

      for (const c of categoriesRaw) {
        categoryMap.set(String(c._id), {
          _id: c._id,
          title: c.title ?? null,
          slug: c.slug ?? null,
          fullSlug: c.fullSlug ?? null,
        });
      }

      const includeCharacteristics = parseBoolStrict(
        params.includeCharacteristics,
        "includeCharacteristics",
        false
      );

      const items = groups.map((g) => {
        const a = aggByGroupId.get(String(g._id));
        const groupAxes = Array.isArray(g.variationAxes) ? g.variationAxes : [];
        const previewAxes = Array.isArray(a?.variantPreviewAxes)
          ? a.variantPreviewAxes.map((previewAxis) => {
              const axisIndex = Number(previewAxis?.axisIndex);
              const axisMeta = Number.isInteger(axisIndex) && axisIndex >= 0
                ? groupAxes[axisIndex]
                : null;

              return {
                axisIndex,
                axisId: axisMeta?.axisId ?? null,
                title: axisMeta?.title ?? null,
                type: axisMeta?.type ?? null,
                unit: axisMeta?.unit ?? null,
                values: Array.isArray(previewAxis?.values)
                  ? previewAxis.values
                  : [],
              };
            })
          : [];

        const categories = (g.categoryIds || [])
          .map((id) => categoryMap.get(String(id)))
          .filter(Boolean);

        return {
          groupId: g._id,
          slug: g.slug,
          status: g.status,
          title: g.title,
          imageURL: a?.matchedImageURL || g.imageURL,
          categoryIds: g.categoryIds,
          categories,
          subtitle: g.subtitle,

          pricing: {
            min: a?.minPrice ?? null,
            max: a?.maxPrice ?? null,
            currency: "UAH",
          },

          availability: {
            hasAvailable: Boolean(a?.hasAvailable),
            variantsCount: a?.variantsCount ?? 0,
            totalStock: a?.totalStock ?? 0,
          },

          ratingSummary: {
            average: Number(g?.ratingSummary?.average || 0),
            count: Number(g?.ratingSummary?.count || 0),
          },

          variantPreview: {
            depth,
            axes: previewAxes,
          },

          offers: includeOffers === "none" ? [] : a?.offers ?? [],

          ui: {
            variationAxes: groupAxes,
          },

          ...(includeCharacteristics && {
            characteristics: Array.isArray(g.characteristics)
              ? g.characteristics
              : [],
          }),
        };
      });

      return {
        items,
        meta: {
          page: safePage,
          limit: safeLimit,
          total,
          pages: Math.ceil(total / safeLimit),
        },
      };
    },
  };
}