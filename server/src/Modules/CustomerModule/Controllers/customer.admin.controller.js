import { ICustomerAdminService } from "../../../Common/DI/tokens.js";

export function customerAdminController(router, { container }) {
  router.get("/admin/customers", async (req, res, next) => {
    try {
      const service = container.get(ICustomerAdminService);

      const data = await service.listCustomers({
        q: req.query.q,
        page: req.query.page,
        limit: req.query.limit,
      });

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/customers/export.csv", async (req, res, next) => {
    try {
      const service = container.get(ICustomerAdminService);

      const csv = await service.exportCustomersCsv({
        q: req.query.q,
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="customers.csv"');
      res.send(csv);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/customers/:id", async (req, res, next) => {
    try {
      const service = container.get(ICustomerAdminService);

      const data = await service.getCustomerProfile(req.params.id, {
        page: req.query.page,
        limit: req.query.limit,
      });

      if (!data) {
        return res.status(404).json({
          message: "Customer not found",
          code: "NOT_FOUND",
        });
      }

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/customers/:id/orders", async (req, res, next) => {
    try {
      const service = container.get(ICustomerAdminService);

      const data = await service.getCustomerOrders(req.params.id, {
        page: req.query.page,
        limit: req.query.limit,
      });

      if (!data) {
        return res.status(404).json({
          message: "Customer not found",
          code: "NOT_FOUND",
        });
      }

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/customers/:id/orders/export.csv", async (req, res, next) => {
    try {
      const service = container.get(ICustomerAdminService);

      const csv = await service.exportCustomerOrdersCsv(req.params.id);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="customer-orders.csv"');
      res.send(csv);
    } catch (e) {
      next(e);
    }
  });

  router.patch("/admin/customers/:id", async (req, res, next) => {
    try {
      const service = container.get(ICustomerAdminService);

      const data = await service.updateCustomer(
        req.params.id,
        req.body || {},
        req.user || null
      );

      if (!data) {
        return res.status(404).json({
          message: "Customer not found",
          code: "NOT_FOUND",
        });
      }

      res.json({ item: data });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/admin/customers/:id/status", async (req, res, next) => {
    try {
      const service = container.get(ICustomerAdminService);

      const data = await service.updateCustomerStatus(
        req.params.id,
        req.body?.status,
        req.user || null
      );

      if (!data) {
        return res.status(404).json({
          message: "Customer not found",
          code: "NOT_FOUND",
        });
      }

      res.json({ item: data });
    } catch (e) {
      next(e);
    }
  });
}