import { ICatalogFacade } from "../../../Common/DI/tokens.js";
import { invalidateCatalogCache } from "../../../Common/Infrastructure/cache.js";

async function safeInvalidateCatalogCache() {
  try {
    await invalidateCatalogCache();
  } catch (err) {
    console.warn("[cache] catalog invalidation failed:", err?.message || err);
  }
}

export function adminCategoriesController(router, { container }) {
  router.get("/admin/categories/export.csv", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const csv = await facade.exportCategoryCsv({ status });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="categories.csv"');
      res.send(csv);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/categories/export.xlsx", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const xlsx = await facade.exportCategoryXlsx({ status });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", 'attachment; filename="categories.xlsx"');
      res.send(xlsx);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/categories/tree", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const tree = await facade.getCategoryTree({ status });
      res.json({ items: tree });
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/categories/children", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const parentId = req.query.parentId || null;

      const items = await facade.getCategoryChildren({ parentId, status });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/categories/breadcrumbs", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const categoryId = req.query.categoryId;
      if (!categoryId) {
        return res.status(400).json({ message: "categoryId is required", code: "BAD_REQUEST" });
      }

      const items = await facade.getCategoryBreadcrumbs({ categoryId });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/categories/by-path", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const pathStr = req.query.path;

      if (!pathStr) {
        return res.status(400).json({ message: "path is required", code: "BAD_REQUEST" });
      }

      const item = await facade.getCategoryByPath({ path: pathStr, status });
      if (!item) {
        return res.status(404).json({ message: "Category not found", code: "NOT_FOUND" });
      }

      res.json({ item });
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/categories/by-fullslug", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const fullSlug = req.query.fullSlug;

      if (!fullSlug) {
        return res.status(400).json({ message: "fullSlug is required", code: "BAD_REQUEST" });
      }

      const item = await facade.getCategoryByFullSlug({ fullSlug, status });
      if (!item) {
        return res.status(404).json({ message: "Category not found", code: "NOT_FOUND" });
      }

      res.json({ item });
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/categories/subtree", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const status = req.query.status || "active";
      const pathStr = req.query.path;

      if (!pathStr) {
        return res.status(400).json({ message: "path is required", code: "BAD_REQUEST" });
      }

      const item = await facade.getCategorySubtreeByPath({ path: pathStr, status });
      if (!item) {
        return res.status(404).json({ message: "Category not found", code: "NOT_FOUND" });
      }

      res.json({ item });
    } catch (e) {
      next(e);
    }
  });

  router.post("/admin/categories", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const item = await facade.createCategory(req.body);
      await safeInvalidateCatalogCache();
      res.status(201).json({ ok: true, item });
    } catch (e) {
      next(e);
    }
  });

  router.put("/admin/categories/:id", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const item = await facade.updateCategory({
        categoryId: req.params.id,
        ...req.body,
      });
      await safeInvalidateCatalogCache();
      res.json({ ok: true, item });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/admin/categories/:id", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const result = await facade.deleteCategory({ categoryId: req.params.id });
      await safeInvalidateCatalogCache();
      res.json(result);
    } catch (e) {
      next(e);
    }
  });
}