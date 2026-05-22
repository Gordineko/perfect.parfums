import { requireAdminPermissions } from "../Middlewares/requireAdminPermissions.js";

export function createAdminUserController({
  router,
  adminUserService,
  requireAdminAuth,
}) {
  router.get(
    "/admin/users",
    requireAdminAuth,
    requireAdminPermissions(["users.read"]),
    async (req, res, next) => {
      try {
        const data = await adminUserService.listUsers({
          q: req.query.q,
          page: req.query.page,
          limit: req.query.limit,
          status: req.query.status,
        });

        res.json(data);
      } catch (e) {
        next(e);
      }
    }
  );

  router.get(
    "/admin/users/:id",
    requireAdminAuth,
    requireAdminPermissions(["users.read"]),
    async (req, res, next) => {
      try {
        const data = await adminUserService.getUserById(req.params.id);

        if (!data) {
          return res.status(404).json({
            message: "Admin user not found",
            code: "NOT_FOUND",
          });
        }

        res.json({ item: data });
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    "/admin/users",
    requireAdminAuth,
    requireAdminPermissions(["users.create"]),
    async (req, res, next) => {
      try {
        const data = await adminUserService.createUser(req.body || {});
        res.status(201).json({ item: data });
      } catch (e) {
        next(e);
      }
    }
  );

  router.patch(
    "/admin/users/:id",
    requireAdminAuth,
    requireAdminPermissions(["users.update"]),
    async (req, res, next) => {
      try {
        const data = await adminUserService.updateUser(req.params.id, req.body || {});

        if (!data) {
          return res.status(404).json({
            message: "Admin user not found",
            code: "NOT_FOUND",
          });
        }

        res.json({ item: data });
      } catch (e) {
        next(e);
      }
    }
  );

  router.patch(
    "/admin/users/:id/status",
    requireAdminAuth,
    requireAdminPermissions(["users.update"]),
    async (req, res, next) => {
      try {
        const data = await adminUserService.updateUserStatus(
          req.params.id,
          req.body?.status
        );

        if (!data) {
          return res.status(404).json({
            message: "Admin user not found",
            code: "NOT_FOUND",
          });
        }

        res.json({ item: data });
      } catch (e) {
        next(e);
      }
    }
  );
}