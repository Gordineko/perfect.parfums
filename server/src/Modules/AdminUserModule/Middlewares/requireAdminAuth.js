import jwt from "jsonwebtoken";

function unauthorized(message = "Unauthorized") {
  const err = new Error(message);
  err.code = "UNAUTHORIZED";
  err.status = 401;
  return err;
}

function forbidden(message = "Forbidden") {
  const err = new Error(message);
  err.code = "FORBIDDEN";
  err.status = 403;
  return err;
}

function collectPermissions(user) {
  const set = new Set();

  for (const role of user?.roles || []) {
    for (const p of role?.permissions || []) {
      set.add(p);
    }
  }

  return Array.from(set);
}

export function createRequireAdminAuth({ adminUserRepo }) {
  return async function requireAdminAuth(req, _res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw unauthorized("Authorization header is required");

      const token = authHeader.split(" ")[1];
      if (!token) throw unauthorized("Token is required");

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret_here"
      );

      if (decoded.scope !== "admin") {
        throw unauthorized("Invalid token scope");
      }

      const user = await adminUserRepo.findById(decoded.sub);
      if (!user) throw unauthorized("Admin user not found");
      if (user.status !== "active") throw forbidden("User is not active");

      req.adminUser = user;
      req.adminPermissions = collectPermissions(user);

      next();
    } catch (e) {
      next(e);
    }
  };
}