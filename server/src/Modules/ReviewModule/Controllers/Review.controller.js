// Controllers/Review.controller.js
import { reviewService } from "../Services/Review.service.js";

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function reviewController(router) {
  router.get("/public/main", async (req, res, next) => {
    try {
      const result = await reviewService.getPublicMain(req.query || {});
      res.json({ ok: true, data: result.items });
    } catch (e) {
      next(e);
    }
  });

  router.get("/public/product/:productId", async (req, res, next) => {
    try {
      const result = await reviewService.getPublicProduct(req.params.productId, req.query || {});
      res.json({ ok: true, data: result.items });
    } catch (e) {
      next(e);
    }
  });

  router.get("/search", async (req, res, next) => {
    try {
      const data = await reviewService.search(req.query || {});
      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  // ADMIN: LIST
  router.get("/", async (req, res, next) => {
    try {
      const data = await reviewService.getReviewsList(req.query || {});
      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  // ADMIN: GET BY ID
  router.get("/:id", async (req, res, next) => {
    try {
      const doc = await reviewService.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (e) {
      next(e);
    }
  });

  // ADMIN: CREATE
  router.post("/", async (req, res, next) => {
    try {
      const body = req.body || {};

      const payload = {
        name: String(body.name).trim(),
        product: body.product || null, // сюда кидаешь ObjectId ProductGroup
        photoUrl: String(body.photoUrl || ""),
        text: String(body.text).trim(),
        rating: body.rating != null ? Number(body.rating) : undefined,
        status: body.status || "draft",
        position: Number(body.position || 0),
        isVisibleProduct:
          body.isVisibleProduct !== undefined
            ? !!body.isVisibleProduct
            : true,
        isVisibleMainPage:
          body.isVisibleMainPage !== undefined
            ? !!body.isVisibleMainPage
            : false,
      };

      const created = await reviewService.create(payload);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  // ADMIN: CANCEL
  router.post("/:id/cancel", async (req, res, next) => {
    try {
      const cancelled = await reviewService.cancelById(req.params.id);
      if (!cancelled) return res.status(404).json({ message: "Not found" });
      res.json(cancelled);
    } catch (e) {
      next(e);
    }
  });

  // ADMIN: PATCH (partial update)
  router.patch("/:id", async (req, res, next) => {
    try {
      const b = req.body || {};
      const patch = {};

      if (has(b, "name")) patch.name = String(b.name || "");
      if (has(b, "product")) patch.product = b.product || null;
      if (has(b, "photoUrl")) patch.photoUrl = String(b.photoUrl || "");
      if (has(b, "text")) patch.text = String(b.text || "");
      if (has(b, "rating")) patch.rating = Number(b.rating);
      if (has(b, "status")) patch.status = String(b.status || "draft");
      if (has(b, "position")) patch.position = Number(b.position || 0);
      if (has(b, "isVisibleProduct"))
        patch.isVisibleProduct = !!b.isVisibleProduct;
      if (has(b, "isVisibleMainPage"))
        patch.isVisibleMainPage = !!b.isVisibleMainPage;

      if (!Object.keys(patch).length) {
        return res.status(400).json({ message: "Nothing to update" });
      }

      const updated = await reviewService.updateById(req.params.id, patch);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  // ADMIN: DELETE
  router.delete("/:id", async (req, res, next) => {
    try {
      const deleted = await reviewService.deleteById(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Not found" });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
}
