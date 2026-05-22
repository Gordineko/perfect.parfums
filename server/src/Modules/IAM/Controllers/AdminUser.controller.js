import { IUserAdminService } from "../../../Common/DI/tokens.js";

export function adminUserController(router, { container }) {
  // ===== LIST =====
  router.get("/admin/users", async (req, res, next) => {
    try {
      const service = container.get(IUserAdminService);

      const data = await service.listUsers({
        q: req.query.q,
        status: req.query.status,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        sort: parseSort(req.query.sort),
      });

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  // ===== GET ONE =====
  router.get("/admin/users/:id", async (req, res, next) => {
    try {
      const service = container.get(IUserAdminService);

      const user = await service.getUserById(req.params.id);

      res.json(user);
    } catch (e) {
      next(e);
    }
  });

  // ===== CREATE =====
  router.post("/admin/users", async (req, res, next) => {
    try {
      const service = container.get(IUserAdminService);

      const data = await service.createUser(
        req.body || {},
        req.user || null
      );

      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  });

  // ===== UPDATE =====
  router.patch("/admin/users/:id", async (req, res, next) => {
    try {
      const service = container.get(IUserAdminService);

      const data = await service.updateUser(
        req.params.id,
        req.body || {},
        req.user || null
      );

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  // ===== DELETE =====
  router.delete("/admin/users/:id", async (req, res, next) => {
    try {
      const service = container.get(IUserAdminService);

      await service.deleteUser(req.params.id);

      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  });
}

/**
 * Преобразование sort из query в mongoose-формат
 * Примеры:
 *  ?sort=createdAt -> { createdAt: 1 }
 *  ?sort=-createdAt -> { createdAt: -1 }
 *  ?sort=name,-email -> { name: 1, email: -1 }
 */
function parseSort(sort) {
  if (!sort) return { createdAt: -1 };

  const result = {};

  String(sort)
    .split(",")
    .forEach((field) => {
      field = field.trim();
      if (!field) return;

      if (field.startsWith("-")) {
        result[field.slice(1)] = -1;
      } else {
        result[field] = 1;
      }
    });

  return result;
}