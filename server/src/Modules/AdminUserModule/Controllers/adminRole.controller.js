import { requireAdminPermissions } from "../Middlewares/requireAdminPermissions.js";

export function createAdminRoleController({
  router,
  adminRoleService,
  requireAdminAuth,
}) {
  router.get(
    "/admin/roles",
    requireAdminAuth,
    requireAdminPermissions(["users.read"]),
    async (req, res, next) => {
      try {
        const data = await adminRoleService.listRoles({
          onlyActive:
            req.query.onlyActive !== undefined
              ? String(req.query.onlyActive) !== "false"
              : true,
        });

        res.json(data);
      } catch (e) {
        next(e);
      }
    }
  );

  router.get(
    "/admin/roles/:id",
    requireAdminAuth,
    requireAdminPermissions(["users.read"]),
    async (req, res, next) => {
      try {
        const data = await adminRoleService.getRoleById(req.params.id);

        if (!data) {
          return res.status(404).json({
            message: "Role not found",
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
    "/admin/roles",
    requireAdminAuth,
    requireAdminPermissions(["users.assign_roles"]),
    async (req, res, next) => {
      try {
        const data = await adminRoleService.createRole(req.body || {});
        res.status(201).json({ item: data });
      } catch (e) {
        next(e);
      }
    }
  );

  router.patch(
    "/admin/roles/:id",
    requireAdminAuth,
    requireAdminPermissions(["users.assign_roles"]),
    async (req, res, next) => {
      try {
        const data = await adminRoleService.updateRole(req.params.id, req.body || {});

        if (!data) {
          return res.status(404).json({
            message: "Role not found",
            code: "NOT_FOUND",
          });
        }

        res.json({ item: data });
      } catch (e) {
        next(e);
      }
    }
  );

  router.delete(
    "/admin/roles/:id",
    requireAdminAuth,
    requireAdminPermissions(["users.assign_roles"]),
    async (req, res, next) => {
      try {
        const data = await adminRoleService.deleteRole(req.params.id);

        if (!data) {
          return res.status(404).json({
            message: "Role not found",
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