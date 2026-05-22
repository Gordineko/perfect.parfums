import bcrypt from "bcryptjs";
import mongoose from "mongoose";

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
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

function buildFullName(user) {
  return [user?.lastName, user?.firstName, user?.middleName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function normalizeString(value = "") {
  return String(value || "").trim();
}

function normalizeLogin(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function createAdminUserService({ adminUserRepo, adminRoleRepo }) {
  return {
    async listUsers(params = {}) {
      const page = Math.max(1, Number(params.page || 1));
      const limit = Math.min(200, Math.max(1, Number(params.limit || 10)));
      const skip = (page - 1) * limit;

      const filter = {};

      if (params.q && String(params.q).trim()) {
        const raw = String(params.q).trim();
        const rx = new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

        filter.$or = [
          { firstName: rx },
          { lastName: rx },
          { middleName: rx },
          { email: rx },
          { phone: rx },
          { login: rx },
        ];
      }

      if (params.status) {
        filter.status = String(params.status);
      }

      const { items, total } = await adminUserRepo.findPage(filter, {
        skip,
        limit,
        sort: { createdAt: -1, _id: -1 },
      });

      return {
        items: items.map((user) => ({
          _id: user._id,
          fullName: buildFullName(user),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          middleName: user.middleName || "",
          phone: user.phone || "",
          email: user.email || "",
          login: user.login || "",
          status: user.status || "active",
          roles: user.roles || [],
          permissions: collectPermissions(user),
          level: Math.max(0, ...(user.roles || []).map((r) => Number(r.level || 0))),
          createdAt: user.createdAt || null,
          updatedAt: user.updatedAt || null,
          lastLoginAt: user.lastLoginAt || null,
        })),
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async getUserById(id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid adminUserId");
      }

      const user = await adminUserRepo.findById(id);
      if (!user) return null;

      return {
        _id: user._id,
        fullName: buildFullName(user),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        middleName: user.middleName || "",
        phone: user.phone || "",
        email: user.email || "",
        login: user.login || "",
        status: user.status || "active",
        roles: user.roles || [],
        permissions: collectPermissions(user),
        level: Math.max(0, ...(user.roles || []).map((r) => Number(r.level || 0))),
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
        lastLoginAt: user.lastLoginAt || null,
      };
    },

    async createUser(payload = {}) {
      const firstName = normalizeString(payload.firstName);
      const lastName = normalizeString(payload.lastName);
      const middleName = normalizeString(payload.middleName);
      const phone = normalizeString(payload.phone);
      const email = normalizeString(payload.email).toLowerCase();
      const login = normalizeLogin(payload.login);
      const password = String(payload.password || "");
      const status = normalizeString(payload.status || "active");

      if (!firstName) throw badRequest("firstName is required");
      if (!lastName) throw badRequest("lastName is required");
      if (!login) throw badRequest("login is required");
      if (!password) throw badRequest("password is required");
      if (password.length < 8) {
        throw badRequest("password must be at least 8 characters");
      }

      let roleIds = Array.isArray(payload.roleIds) ? payload.roleIds : [];
      roleIds = roleIds.map(String).filter(Boolean);

      const roles = await adminRoleRepo.findByIds(roleIds);
      if (roles.length !== roleIds.length) {
        throw badRequest("Some roles were not found");
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const created = await adminUserRepo.create({
        firstName,
        lastName,
        middleName,
        phone,
        email,
        login,
        passwordHash,
        status,
        roles: roles.map((r) => r._id),
      });

      return this.getUserById(created._id);
    },

    async updateUser(id, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid adminUserId");
      }

      const current = await adminUserRepo.findById(id);
      if (!current) return null;

      const patch = {};

      if (payload.firstName !== undefined) patch.firstName = normalizeString(payload.firstName);
      if (payload.lastName !== undefined) patch.lastName = normalizeString(payload.lastName);
      if (payload.middleName !== undefined) patch.middleName = normalizeString(payload.middleName);
      if (payload.phone !== undefined) patch.phone = normalizeString(payload.phone);
      if (payload.email !== undefined) patch.email = normalizeString(payload.email).toLowerCase();
      if (payload.login !== undefined) patch.login = normalizeLogin(payload.login);
      if (payload.status !== undefined) patch.status = normalizeString(payload.status);

      if (payload.password !== undefined) {
        const password = String(payload.password || "");
        if (password) {
          if (password.length < 8) {
            throw badRequest("password must be at least 8 characters");
          }
          patch.passwordHash = await bcrypt.hash(password, 10);
        }
      }

      if (payload.roleIds !== undefined) {
        let roleIds = Array.isArray(payload.roleIds) ? payload.roleIds : [];
        roleIds = roleIds.map(String).filter(Boolean);

        const roles = await adminRoleRepo.findByIds(roleIds);
        if (roles.length !== roleIds.length) {
          throw badRequest("Some roles were not found");
        }

        patch.roles = roles.map((r) => r._id);
      }

      await adminUserRepo.updateById(id, patch);
      return this.getUserById(id);
    },

    async updateUserStatus(id, status) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid adminUserId");
      }

      const allowed = ["active", "blocked", "pending"];
      if (!allowed.includes(String(status || ""))) {
        throw badRequest("Invalid status", { allowed });
      }

      const current = await adminUserRepo.findById(id);
      if (!current) return null;

      await adminUserRepo.updateById(id, {
        status: String(status),
      });

      return this.getUserById(id);
    },
  };
}