import mongoose from "mongoose";

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

function normalizeLocalizedText(v = {}) {
  return {
    ua: String(v?.ua || "").trim(),
    ru: String(v?.ru || "").trim(),
  };
}

function normalizeSlug(slug = "") {
  return String(slug)
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
}

function normalizeProducts(products = []) {
  if (!Array.isArray(products)) return [];

  const seen = new Set();

  return products
    .filter(Boolean)
    .map((item, index) => {
      const productGroupId = String(item?.productGroupId || "").trim();
      if (!mongoose.Types.ObjectId.isValid(productGroupId)) {
        throw badRequest(`products[${index}].productGroupId is invalid`);
      }

      if (seen.has(productGroupId)) {
        throw badRequest(`Duplicate productGroupId in products: ${productGroupId}`);
      }
      seen.add(productGroupId);

      return {
        productGroupId,
        position: Number(item?.position || 0),
      };
    })
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function parseIntStrict(v, param) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) {
    throw badRequest(`Параметр ${param} должен быть integer`, { param });
  }
  return n;
}

function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createCharacterAdminService({
  characterRepo,
  productGroupWriteRepo,
}) {
  return {
    async list(params = {}) {
      const page = Math.max(1, parseIntStrict(params.page, "page") ?? 1);
      const limit = Math.min(200, Math.max(1, parseIntStrict(params.limit, "limit") ?? 20));
      const skip = (page - 1) * limit;

      const filter = {};

      if (params.status) {
        filter.status = params.status;
      }

      if (params.q && String(params.q).trim()) {
        const rx = new RegExp(escapeRegex(String(params.q).trim()), "i");
        filter.$or = [
          { slug: rx },
          { "title.ua": rx },
          { "title.ru": rx },
        ];
      }

      const { items, total } = await characterRepo.findPage(filter, {
        skip,
        limit,
        sort: { position: 1, _id: 1 },
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

    async getById(id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid characterId");
      }

      return characterRepo.findById(id);
    },

    async create(payload = {}) {
      const slug = normalizeSlug(payload.slug);
      if (!slug) throw badRequest("slug is required");

      const existing = await characterRepo.findBySlug(slug);
      if (existing) throw badRequest("Slug already exists");

      const products = normalizeProducts(payload.products || []);

      // Проверка существования product groups
      for (const item of products) {
        const pg = await productGroupWriteRepo.findById(item.productGroupId);
        if (!pg) {
          throw badRequest(`ProductGroup not found: ${item.productGroupId}`);
        }
      }

      return characterRepo.create({
        slug,
        title: normalizeLocalizedText(payload.title),
        imageURL: String(payload.imageURL || "").trim(),
        status: payload.status || "active",
        position: Number(payload.position || 0),
        products,
      });
    },

    async update(id, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid characterId");
      }

      const current = await characterRepo.findById(id);
      if (!current) throw badRequest("Character not found");

      const slug =
        payload.slug !== undefined ? normalizeSlug(payload.slug) : current.slug;

      if (!slug) throw badRequest("slug is required");

      const existing = await characterRepo.findBySlug(slug);
      if (existing && String(existing._id) !== String(id)) {
        throw badRequest("Slug already exists");
      }

      const products =
        payload.products !== undefined
          ? normalizeProducts(payload.products)
          : current.products.map((x) => ({
              productGroupId: x.productGroupId?._id || x.productGroupId,
              position: x.position,
            }));

      for (const item of products) {
        const pg = await productGroupWriteRepo.findById(item.productGroupId);
        if (!pg) {
          throw badRequest(`ProductGroup not found: ${item.productGroupId}`);
        }
      }

      return characterRepo.updateById(id, {
        slug,
        title:
          payload.title !== undefined
            ? normalizeLocalizedText(payload.title)
            : current.title,
        imageURL:
          payload.imageURL !== undefined
            ? String(payload.imageURL || "").trim()
            : current.imageURL,
        status: payload.status !== undefined ? payload.status : current.status,
        position:
          payload.position !== undefined
            ? Number(payload.position || 0)
            : current.position,
        products,
      });
    },

    async remove(id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid characterId");
      }

      const current = await characterRepo.findById(id);
      if (!current) throw badRequest("Character not found");

      await characterRepo.deleteById(id);
      return { ok: true };
    },

    async listActive() {
      return characterRepo.listActive();
    },
  };
}