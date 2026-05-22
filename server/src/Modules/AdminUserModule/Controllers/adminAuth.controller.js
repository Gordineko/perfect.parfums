export function createAdminAuthController({
  router,
  adminAuthService,
  requireAdminAuth,
}) {
  router.post("/admin/auth/login", async (req, res, next) => {
    try {
      const data = await adminAuthService.login({
        login: req.body?.login,
        password: req.body?.password,
      });

      res.json(data);
    } catch (e) {
      next(e);
    }
  });

  router.get("/admin/auth/me", requireAdminAuth, async (req, res, next) => {
    try {
      const data = await adminAuthService.me(req.adminUser._id);
      res.json({ user: data });
    } catch (e) {
      next(e);
    }
  });
}