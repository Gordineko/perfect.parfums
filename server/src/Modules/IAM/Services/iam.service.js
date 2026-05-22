// src/IAM/Services/iam.service.js
import * as repo from '../Repositories/user.repo.js';

export const iamService = {
  // --- Пользователи ---
  async getStatus(userId) {
    const u = await repo.userRepo.findById(userId);
    if (!u) return { exists: false, isActive: false, permissions: [] };
    return { exists: true, isActive: u.status === 'active', permissions: u.permissions };
  },

  async blockUser(userId) {
    await repo.userRepo.blockById(userId);
    return true;
  },

  // --- Роли и связи админов/менеджеров ---
  async createRole(name, description, permissions = []) {
    return repo.userRepo.createRole({ name, description, permissions });
  },

  async assignRoleToUser(userId, roleName) {
    const role = await repo.userRepo.findRoleByName(roleName);
    if (!role) {
      const err = new Error('Role not found');
      err.status = 404;
      throw err;
    }
    return repo.userRepo.addRoleToUser(userId, role._id);
  },

  async linkManagerToAdmin(managerId, adminId) {
    return repo.userRepo.assignManagerToAdmin(managerId, adminId);
  },

  async getManagersOfAdmin(adminId) {
    return repo.userRepo.getManagersOfAdmin(adminId);
  },

  async getPermissionsOfUser(userId) {
    return repo.userRepo.getUserPermissions(userId);
  },
};
