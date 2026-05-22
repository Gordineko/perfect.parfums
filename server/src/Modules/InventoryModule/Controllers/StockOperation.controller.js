import { IStockOperationService } from "../../../Common/DI/tokens.js";

export function stockOperationController(router, { container }) {
  router.post("/admin/inventory/intake", async (req, res, next) => {
    try {
      const service = container.get(IStockOperationService);
      const data = await service.intake(req.body || {}, req.user || null);
      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/inventory/stocktake", async (req, res, next) => {
    try {
      const service = container.get(IStockOperationService);
      const data = await service.stocktake(req.body || {}, req.user || null);
      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/inventory/transfer", async (req, res, next) => {
    try {
      const service = container.get(IStockOperationService);
      const data = await service.transfer(req.body || {}, req.user || null);
      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/inventory/movements", async (req, res, next) => {
    try {
      const service = container.get(IStockOperationService);
      const data = await service.listMovements(req.query || {});
      res.json(data);
    } catch (e) {
      next(e);
    }
  });
}