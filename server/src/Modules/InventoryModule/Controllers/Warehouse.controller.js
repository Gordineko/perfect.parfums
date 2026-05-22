import { IWarehouseService } from "../../../Common/DI/tokens.js";

export function warehouseController(router, { container }) {
  router.get("/admin/warehouses", async (req, res, next) => {
    try {
      const service = container.get(IWarehouseService);
      const data = await service.list(req.query || {});
      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/warehouses/active", async (req, res, next) => {
    try {
      const service = container.get(IWarehouseService);
      const items = await service.listActive();
      res.json({ items });
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/warehouses", async (req, res, next) => {
    try {
      const service = container.get(IWarehouseService);
      const item = await service.create(req.body || {});
      res.status(201).json({ item });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/admin/warehouses/:id", async (req, res, next) => {
    try {
      const service = container.get(IWarehouseService);
      const item = await service.update(req.params.id, req.body || {});
      res.json({ item });
    } catch (e) {
      next(e);
    }
  });
}