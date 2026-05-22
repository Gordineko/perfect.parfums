import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

function unauthorized(message = "Unauthorized") {
  const err = new Error(message);
  err.code = "UNAUTHORIZED";
  err.status = 401;
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

function signToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      login: user.login,
      scope: "admin",
      permissions: collectPermissions(user),
    },
    process.env.JWT_SECRET || "your_jwt_secret_here",
    { expiresIn: "7d" }
  );
}

export function createAdminAuthService({ adminUserRepo }) {
  return {
    async login({ login, password }) {
      const normalizedLogin = String(login || "").trim().toLowerCase();
      const rawPassword = String(password || "");

      if (!normalizedLogin) throw badRequest("login is required");
      if (!rawPassword) throw badRequest("password is required");

      const user = await adminUserRepo.findByLogin(normalizedLogin);
      if (!user) throw unauthorized("Invalid login or password");
      if (user.status !== "active") throw unauthorized("User is not active");

      const ok = await bcrypt.compare(rawPassword, user.passwordHash || "");
      if (!ok) throw unauthorized("Invalid login or password");

      await adminUserRepo.updateById(user._id, {
        lastLoginAt: new Date(),
      });

      const fresh = await adminUserRepo.findById(user._id);

      return {
        token: signToken(fresh),
        user: {
          _id: fresh._id,
          firstName: fresh.firstName || "",
          lastName: fresh.lastName || "",
          middleName: fresh.middleName || "",
          phone: fresh.phone || "",
          email: fresh.email || "",
          login: fresh.login || "",
          status: fresh.status || "active",
          roles: fresh.roles || [],
          permissions: collectPermissions(fresh),
          lastLoginAt: fresh.lastLoginAt || null,
        },
      };
    },

    async me(userId) {
      const user = await adminUserRepo.findById(userId);
      if (!user) throw unauthorized("Admin user not found");

      return {
        _id: user._id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        middleName: user.middleName || "",
        phone: user.phone || "",
        email: user.email || "",
        login: user.login || "",
        status: user.status || "active",
        roles: user.roles || [],
        permissions: collectPermissions(user),
        lastLoginAt: user.lastLoginAt || null,
      };
    },
  };
}