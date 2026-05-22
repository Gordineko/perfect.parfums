import { ICatalogAdminService } from "../../../Common/DI/tokens.js";
import { ICatalogFacade } from "../../../Common/DI/tokens.js";
import { invalidateCatalogCache } from "../../../Common/Infrastructure/cache.js";

async function safeInvalidateCatalogCache() {
  try {
    await invalidateCatalogCache();
  } catch (err) {
    console.warn("[cache] catalog invalidation failed:", err?.message || err);
  }
}

export function adminCatalogController(router, { container }) {
  router.get("/admin/catalog/groups/export.csv", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminService);

      const csv = await service.exportGroupsCsv({
        q: req.query.q,
        status: req.query.status,
        categoryId: req.query.categoryId,
        char: req.query.char,
        offerChar: req.query.offerChar,
        opt: req.query.opt,
        available: req.query.available ?? req.query.onlyAvailable,
        priceMin: req.query.priceMin,
        priceMax: req.query.priceMax,
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="products.csv"');
      res.send(csv);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/catalog/groups/export.xlsx", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminService);

      const xlsx = await service.exportGroupsXlsx({
        q: req.query.q,
        status: req.query.status,
        categoryId: req.query.categoryId,
        char: req.query.char,
        offerChar: req.query.offerChar,
        opt: req.query.opt,
        available: req.query.available ?? req.query.onlyAvailable,
        priceMin: req.query.priceMin,
        priceMax: req.query.priceMax,
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", 'attachment; filename="products.xlsx"');
      res.send(xlsx);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/catalog/groups", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);

      console.log("QUERY PARAMS:", req.query);

      const params = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,

        categoryId: req.query.categoryId,
        categoryInclude: req.query.categoryInclude,

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

        preview: req.query.preview,
        depth: req.query.depth,
        maxValuesPerAxis: req.query.maxValuesPerAxis,

        includeCharacteristics: req.query.includeCharacteristics,
      };

      console.log("BUILD PARAMS:", params);

      const data = await facade.buildCatalogCards(params);

      console.dir(data, { depth: null });

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/catalog/groups/filters", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminService);

      const data = await service.getGroupFilters({
        categoryId: req.query.categoryId,
        status: req.query.status,
        char: req.query.char,
        opt: req.query.opt,
        offerChar: req.query.offerChar,
        available: req.query.available,
        priceMin: req.query.priceMin,
        priceMax: req.query.priceMax,
      });

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/catalog/groups/:id", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminService);

      const item = await service.getGroupForAdmin(req.params.id, {
        includeOffers: req.query.includeOffers,
        offersPage: req.query.offersPage,
        offersLimit: req.query.offersLimit,
      });

      if (!item) {
        return res.status(404).json({
          message: "ProductGroup not found",
          code: "NOT_FOUND",
        });
      }

      res.json({ item });
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/catalog/groups", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminService);
      const item = await service.createGroup(req.body);
      await safeInvalidateCatalogCache();

      res.status(201).json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.put("/admin/catalog/groups/:id", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminService);
      const item = await service.updateGroup(req.params.id, req.body);
      await safeInvalidateCatalogCache();

      res.json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/admin/catalog/groups/:id", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminService);
      const item = await service.patchGroup(req.params.id, req.body);
      await safeInvalidateCatalogCache();

      res.json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/admin/catalog/groups/:id", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminService);
      const result = await service.deleteGroup(req.params.id);
      await safeInvalidateCatalogCache();

      res.json(result);
    } catch (e) {
      next(e);
    }
  });


}