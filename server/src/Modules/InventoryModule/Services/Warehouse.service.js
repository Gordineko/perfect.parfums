import mongoose from "mongoose";

function badRequest(message) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  return err;
}

export function createWarehouseService({ warehouseRepo }) {
  return {
    async list(params = {}) {
      const page = Math.max(1, Number(params.page || 1));
      const limit = Math.min(200, Math.max(1, Number(params.limit || 50)));
      const skip = (page - 1) * limit;

      const filter = {};
      if (params.status) filter.status = params.status;

      const { items, total } = await warehouseRepo.findPage(filter, {
        skip,
        limit,
        sort: { sort: 1, _id: 1 },
      });

      return {
        items,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async create(payload = {}) {
      if (!payload.code) throw badRequest("code is required");

      const existing = await warehouseRepo.findByCode(String(payload.code).trim());
      if (existing) throw badRequest("Warehouse code already exists");

      return warehouseRepo.create({
        code: String(payload.code).trim(),
        title: payload.title || { ua: "", ru: "" },
        address: String(payload.address || ""),
        sort: Number(payload.sort || 0),
        status: payload.status || "active",
        isDefault: Boolean(payload.isDefault),
      });
    },

    async update(id, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid warehouseId");
      }

      return warehouseRepo.updateById(id, payload);
    },

    async listActive() {
      return warehouseRepo.findAllActive();
    },
  };
}