function forbidden(message = "Forbidden") {
  const err = new Error(message);
  err.code = "FORBIDDEN";
  err.status = 403;
  return err;
}

export function requireAdminPermissions(required = []) {
  return (req, _res, next) => {
    try {
      const permissions = Array.isArray(req.adminPermissions)
        ? req.adminPermissions
        : [];

      if (permissions.includes("full.access")) {
        return next();
      }

      const missing = required.filter((p) => !permissions.includes(p));
      if (missing.length) {
        throw forbidden("Insufficient permissions");
      }

      next();
    } catch (e) {
      next(e);
    }
  };
}