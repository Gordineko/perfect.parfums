import mongoose from "mongoose";

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

function normalizeString(value = "") {
  return String(value || "").trim();
}

function normalizeCode(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizePermissions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => String(x || "").trim())
    .filter(Boolean);
}

export function createAdminRoleService({ adminRoleRepo }) {
  return {
    async listRoles(params = {}) {
      const items = await adminRoleRepo.list({
        onlyActive: params.onlyActive !== false,
      });

      return { items };
    },

    async getRoleById(id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid roleId");
      }

      const role = await adminRoleRepo.findById(id);
      return role || null;
    },

    async createRole(payload = {}) {
      const name = normalizeString(payload.name);
      const code = normalizeCode(payload.code);
      const description = normalizeString(payload.description);
      const level = Number(payload.level || 1);
      const permissions = normalizePermissions(payload.permissions);

      if (!name) throw badRequest("name is required");
      if (!code) throw badRequest("code is required");

      const existing = await adminRoleRepo.findByCode(code);
      if (existing) {
        throw badRequest("Role code already exists");
      }

      return adminRoleRepo.create({
        name,
        code,
        description,
        level,
        permissions,
        isSystem: Boolean(payload.isSystem),
        isActive: payload.isActive !== false,
      });
    },

    async updateRole(id, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid roleId");
      }

      const current = await adminRoleRepo.findById(id);
      if (!current) return null;

      const patch = {};

      if (payload.name !== undefined) {
        patch.name = normalizeString(payload.name);
      }

      if (payload.code !== undefined) {
        const code = normalizeCode(payload.code);
        if (!code) throw badRequest("code is required");

        const existing = await adminRoleRepo.findByCode(code);
        if (existing && String(existing._id) !== String(id)) {
          throw badRequest("Role code already exists");
        }

        patch.code = code;
      }

      if (payload.description !== undefined) {
        patch.description = normalizeString(payload.description);
      }

      if (payload.level !== undefined) {
        patch.level = Number(payload.level || 1);
      }

      if (payload.permissions !== undefined) {
        patch.permissions = normalizePermissions(payload.permissions);
      }

      if (payload.isActive !== undefined) {
        patch.isActive = Boolean(payload.isActive);
      }

      if (payload.isSystem !== undefined) {
        patch.isSystem = Boolean(payload.isSystem);
      }

      return adminRoleRepo.updateById(id, patch);
    },

    async deleteRole(id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid roleId");
      }

      const current = await adminRoleRepo.findById(id);
      if (!current) return null;

      if (current.isSystem) {
        throw badRequest("System role cannot be deleted");
      }

      return adminRoleRepo.updateById(id, {
        isActive: false,
      });
    },
  };
}