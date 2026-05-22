import { ICatalogAdminOffersService } from "../../../Common/DI/tokens.js";
import { invalidateCatalogCache } from "../../../Common/Infrastructure/cache.js";

async function safeInvalidateCatalogCache() {
  try {
    await invalidateCatalogCache();
  } catch (err) {
    console.warn("[cache] catalog invalidation failed:", err?.message || err);
  }
}

export function adminCatalogOffersController(router, { container }) {
  router.get("/admin/catalog/groups/:id/offers", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminOffersService);

      const data = await service.listGroupOffers(req.params.id, {
        page: req.query.page,
        limit: req.query.limit,
        q: req.query.q,
        sku: req.query.sku,
        available: req.query.available,
        compact: req.query.compact,
        opt: req.query.opt,
      });

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/catalog/groups/:id/offers", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminOffersService);
      const item = await service.createOffer(req.params.id, req.body);
      await safeInvalidateCatalogCache();

      res.status(201).json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/admin/catalog/offers/:id", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminOffersService);
      const item = await service.patchOffer(req.params.id, req.body);
      await safeInvalidateCatalogCache();

      res.json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/admin/catalog/offers/:id/availability", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminOffersService);
      const item = await service.patchOfferAvailability(req.params.id, req.body);
      await safeInvalidateCatalogCache();

      res.json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/admin/catalog/offers/:id/price", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminOffersService);
      const item = await service.patchOfferPrice(req.params.id, req.body);
      await safeInvalidateCatalogCache();

      res.json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/admin/catalog/offers/:id/stocks", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminOffersService);
      const item = await service.patchOfferStocks(req.params.id, req.body);
      await safeInvalidateCatalogCache();

      res.json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/admin/catalog/offers/:id", async (req, res, next) => {
    try {
      const service = container.get(ICatalogAdminOffersService);
      const result = await service.deleteOffer(req.params.id);
      await safeInvalidateCatalogCache();

      res.json(result);
    } catch (e) {
      next(e);
    }
  });
}