export function createUserAdminService({ userRepo }) {
  return {
    async listUsers({ q, status, page = 1, limit = 20, sort } = {}) {
      const filter = {};

      if (q) {
        filter.$or = [
          { email: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } },
        ];
      }

      if (status) {
        filter.status = status;
      }

      const normalizedPage = Math.max(1, Number(page) || 1);
      const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
      const skip = (normalizedPage - 1) * normalizedLimit;

      const users = await userRepo.find(filter, {
        skip,
        limit: normalizedLimit,
        sort: sort || { createdAt: -1 },
      });

      const total = await userRepo.count(filter);

      return {
        users,
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        pages: Math.ceil(total / normalizedLimit),
      };
    },

    async getUserById(id) {
      if (!id) {
        throw new Error("User id is required");
      }

      const user = await userRepo.findById(id);

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    },

    async createUser(data, actor) {
   

      if (!data?.firstName) {
        throw new Error("First name is required");
      }

      if (!data?.lastName) {
        throw new Error("Last name is required");
      }

      const normalizedEmail = String(data.email).trim().toLowerCase();

      const exists = await userRepo.exists({ email: normalizedEmail });
      if (exists) {
        throw new Error("User with this email already exists");
      }

      const payload = {
        firstName: String(data.firstName).trim(),
        lastName: String(data.lastName).trim(),
        email: normalizedEmail || "",
        phone: String(data.phone).trim() || "",
        status: data.status || "active",
        role: data.role || "user",

      };

      const createdUser = await userRepo.create(payload);

      return createdUser.toObject ? createdUser.toObject() : createdUser;
    },

    async updateUser(id, data) {
      if (!id) {
        throw new Error("User id is required");
      }

  

      const existingUser = await userRepo.findById(id);
      if (!existingUser) {
        throw new Error("User not found");
      }

      if (data.email) {
        const normalizedEmail = String(data.email).trim().toLowerCase();

        if (normalizedEmail !== existingUser.email) {
          const emailTaken = await userRepo.exists({
            email: normalizedEmail,
            _id: { $ne: id },
          });

          if (emailTaken) {
            throw new Error("User with this email already exists");
          }
        }
      }

      const payload = {
        ...(data.firstName !== undefined ? { firstName: String(data.firstName).trim() } : {}),
        ...(data.lastName !== undefined ? { lastName: String(data.lastName).trim() } : {}),
        ...(data.email !== undefined
          ? { email: String(data.email).trim().toLowerCase() }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.phone !== undefined ? { phone: String(data.phone).trim() } : {}),
      };

      return userRepo.updateById(id, payload);
    },

    async deleteUser(id) {
      if (!id) {
        throw new Error("User id is required");
      }

      const existingUser = await userRepo.findById(id);
      if (!existingUser) {
        throw new Error("User not found");
      }

      return userRepo.deleteById(id);
    },
  };
}