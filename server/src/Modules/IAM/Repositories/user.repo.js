import { UserModel } from "../Models/User.model.js";

export const userRepo = {
  findById: (id) => UserModel.findById(id).populate('roles').lean(),
  blockById: (id) => UserModel.findByIdAndUpdate(id, { status: 'blocked' }),
  createUser: (data) => new UserModel(data).save(),
  findUserByEmail: (email) => UserModel.findOne({ email }).populate('roles').lean(),
  addRoleToUser: (userId, roleId) => UserModel.findByIdAndUpdate(userId, { $addToSet: { roles: roleId } }, { new: true }).populate('roles').lean(),
  assignManagerToAdmin: (managerId, adminId) => UserModel.findByIdAndUpdate(managerId, { assignedAdmin: adminId }, { new: true }).populate('roles').lean(),
  getManagersOfAdmin: (adminId) => UserModel.find({ assignedAdmin: adminId }).populate('roles').lean(),
  createRole: (dto) => new Role(dto).save(),
  findRoleByName: (name) => Role.findOne({ name }).lean(),
  getUserPermissions: async (userId) => {
    const user = await UserModel.findById(userId).populate('roles').lean();
    const set = new Set();
    (user?.roles || []).forEach(r => (r.permissions || []).forEach(p => set.add(p)));
    return Array.from(set);
  }
};
