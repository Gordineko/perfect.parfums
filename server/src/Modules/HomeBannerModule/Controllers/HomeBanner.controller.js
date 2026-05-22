import { IHomeBannerAdminService } from "../../../Common/DI/tokens.js";

export function homeBannerController(router, { container }) {
  router.get("/admin/home-banners", async (req, res, next) => {
    try {
      const service = container.get(IHomeBannerAdminService);
      const data = await service.list({
        page: req.query.page,
        limit: req.query.limit,
        q: req.query.q,
        status: req.query.status,
      });

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/home-banners/:id", async (req, res, next) => {
    try {
      const service = container.get(IHomeBannerAdminService);
      const item = await service.getById(req.params.id);

      if (!item) {
        return res.status(404).json({
          message: "Banner not found",
          code: "NOT_FOUND",
        });
      }

      res.json({ item });
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/home-banners", async (req, res, next) => {
    try {
      const service = container.get(IHomeBannerAdminService);
      const item = await service.create(req.body);

      res.status(201).json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.put("/admin/home-banners/:id", async (req, res, next) => {
    try {
      const service = container.get(IHomeBannerAdminService);
      const item = await service.update(req.params.id, req.body);

      res.json({
        ok: true,
        item,
      });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/admin/home-banners/:id", async (req, res, next) => {
    try {
      const service = container.get(IHomeBannerAdminService);
      const result = await service.remove(req.params.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  // public
  router.get("/home-banners", async (req, res, next) => {
    try {
      const service = container.get(IHomeBannerAdminService);
      const items = await service.listActive();
      res.json({ items });
    } catch (e) {
      next(e);
    }
  });
}