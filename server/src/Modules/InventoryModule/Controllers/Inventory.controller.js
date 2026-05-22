import { IInventoryService } from "../../../Common/DI/tokens.js";

export function inventoryController(router, { container }) {
  router.get("/admin/inventory", async (req, res, next) => {
    try {
      const service = container.get(IInventoryService);
      const data = await service.listStocks(req.query || {});
      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/inventory/offers/search", async (req, res, next) => {
    try {
      const service = container.get(IInventoryService);
      const items = await service.searchOffers(req.query || {});
      res.json({ items });
    } catch (e) {
      next(e);
    }
  });
}