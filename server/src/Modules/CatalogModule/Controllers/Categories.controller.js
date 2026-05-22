import { ICatalogFacade } from "../../../Common/DI/tokens.js";
import { buildCacheKey, getOrSetCache } from "../../../Common/Infrastructure/cache.js";

const CATEGORIES_CACHE_TTL_SECONDS = 180;

export function categoriesController(router, { container }) {
  router.get("/categories/tree", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const params = { status };
      const cacheKey = buildCacheKey("catalog:categories:tree", params);
      const tree = await getOrSetCache(cacheKey, CATEGORIES_CACHE_TTL_SECONDS, () =>
        facade.getCategoryTree(params)
      );
      res.json({ items: tree });
    } catch (e) {
      next(e);
    }
  });

  router.get("/categories/children", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const parentId = req.query.parentId || null;
      const params = { parentId, status };
      const cacheKey = buildCacheKey("catalog:categories:children", params);

      const items = await getOrSetCache(
        cacheKey,
        CATEGORIES_CACHE_TTL_SECONDS,
        () => facade.getCategoryChildren(params)
      );
      res.json({ items });
    } catch (e) {
      next(e);
    }
  });

  router.get("/categories/breadcrumbs", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const categoryId = req.query.categoryId;
      if (!categoryId) return res.status(400).json({ message: "categoryId is required" });
      const params = { categoryId };
      const cacheKey = buildCacheKey("catalog:categories:breadcrumbs", params);

      const items = await getOrSetCache(
        cacheKey,
        CATEGORIES_CACHE_TTL_SECONDS,
        () => facade.getCategoryBreadcrumbs(params)
      );
      res.json({ items });
    } catch (e) {
      next(e);
    }
  });

  // ✅ NEW: найти категорию по path как строке: skin-structure/cleansing/foam
  router.get("/categories/by-path", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const pathStr = req.query.path;

      if (!pathStr) return res.status(400).json({ message: "path is required" });
      const params = { path: pathStr, status };
      const cacheKey = buildCacheKey("catalog:categories:by-path", params);

      const item = await getOrSetCache(cacheKey, CATEGORIES_CACHE_TTL_SECONDS, () =>
        facade.getCategoryByPath(params)
      );
      if (!item) return res.status(404).json({ message: "Category not found" });

      res.json({ item });
    } catch (e) {
      next(e);
    }
  });

  // ✅ NEW: то же самое, просто явное имя параметра
  router.get("/categories/by-fullslug", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const fullSlug = req.query.fullSlug;

      if (!fullSlug) return res.status(400).json({ message: "fullSlug is required" });
      const params = { fullSlug, status };
      const cacheKey = buildCacheKey("catalog:categories:by-fullslug", params);

      const item = await getOrSetCache(cacheKey, CATEGORIES_CACHE_TTL_SECONDS, () =>
        facade.getCategoryByFullSlug(params)
      );
      if (!item) return res.status(404).json({ message: "Category not found" });

      res.json({ item });
    } catch (e) {
      next(e);
    }
  });

  // ✅ NEW: получить поддерево по path (узел + вложенные children)
  router.get("/categories/subtree", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const pathStr = req.query.path;

      if (!pathStr) return res.status(400).json({ message: "path is required" });
      const params = { path: pathStr, status };
      const cacheKey = buildCacheKey("catalog:categories:subtree", params);

      const item = await getOrSetCache(cacheKey, CATEGORIES_CACHE_TTL_SECONDS, () =>
        facade.getCategorySubtreeByPath(params)
      );
      if (!item) return res.status(404).json({ message: "Category not found" });

      res.json({ item });
    } catch (e) {
      next(e);
    }
  });
}