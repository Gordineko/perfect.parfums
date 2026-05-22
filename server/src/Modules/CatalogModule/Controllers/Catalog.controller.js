// ==============================
// 10) Контроллеры — ПОЛНАЯ ВЕРСИЯ (фрагменты)
// (добавили offerChar в /cards и /facets)
// ==============================

import { ICatalogFacade } from "../../../Common/DI/tokens.js";
import { buildCacheKey, getOrSetCache } from "../../../Common/Infrastructure/cache.js";

const CARDS_CACHE_TTL_SECONDS = 120;
const FACETS_CACHE_TTL_SECONDS = 90;
const GROUP_CACHE_TTL_SECONDS = 120;

export function catalogController(router, { container }) {
  router.get("/cards", async (req, res, next) => {
  try {
    const facade = container.get(ICatalogFacade);


    const params = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,

      isPopular: req.query.isPopular,
      isSale: req.query.isSale,
      isNew: req.query.isNew,

      categoryId: req.query.categoryId,
      categoryInclude: req.query.categoryInclude,
      categoryIds: req.query.categoryIds,

      q: req.query.q,
      sort: req.query.sort,

      onlyAvailable: req.query.onlyAvailable,
      priceMin: req.query.priceMin,
      priceMax: req.query.priceMax,

      char: req.query.char,
      offerChar: req.query.offerChar,
      opt: req.query.opt,

      includeOffers: req.query.includeOffers || "none",
      maxOffersPerGroup: req.query.maxOffersPerGroup,

      variantPreview: {
        enabled: req.query.preview !== "0" && req.query.preview !== "false",
        depth: req.query.depth ?? 2,
        maxValuesPerAxis: req.query.maxValuesPerAxis ?? 6,
      },

      includeCharacteristics: req.query.includeCharacteristics,
    };

    const cacheKey = buildCacheKey("catalog:cards", params);

    const data = await getOrSetCache(cacheKey, CARDS_CACHE_TTL_SECONDS, () =>
      facade.buildCatalogCards(params)
    );

    res.json(data);
  } catch (e) {
    next(e);
  }
});

  router.get("/facets", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);

      const params = {
        status: req.query.status,
        categoryId: req.query.categoryId,
        categoryInclude: req.query.categoryInclude,
        categoryIds: req.query.categoryIds,
        q: req.query.q,

        onlyAvailable: req.query.onlyAvailable,
        priceMin: req.query.priceMin,
        priceMax: req.query.priceMax,

        char: req.query.char,           // group-level
        offerChar: req.query.offerChar, // offer-level

        opt: req.query.opt,
        sticky: req.query.sticky,
      };

      const cacheKey = buildCacheKey("catalog:facets", params);
      const facets = await getOrSetCache(cacheKey, FACETS_CACHE_TTL_SECONDS, () =>
        facade.getFacets(params)
      );

      res.json({ facets });
    } catch (e) {
      next(e);
    }
  });

  router.get("/groups/:slug", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const params = { slug: req.params.slug };
      const cacheKey = buildCacheKey("catalog:group", params);

      const item = await getOrSetCache(cacheKey, GROUP_CACHE_TTL_SECONDS, () =>
        facade.getGroupBySlug(params)
      );
      if (!item) return res.status(404).json({ message: "ProductGroup not found", code: "NOT_FOUND" });
      res.json({ item });
    } catch (e) {
      next(e);
    }
  });
}