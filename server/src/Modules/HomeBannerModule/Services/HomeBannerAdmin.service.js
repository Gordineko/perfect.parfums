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
    en: String(v?.en || "").trim(),
  };
}

function normalizeSlug(slug = "") {
  return String(slug).trim().toLowerCase().replace(/^\/+|\/+$/g, "");
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

export function createHomeBannerAdminService({
  homeBannerRepo,
  categoryRepo,
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
          { "title.en": rx },
          { "subtitle.ua": rx },
          { "subtitle.en": rx },
        ];
      }

      const { items, total } = await homeBannerRepo.findPage(filter, {
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
        throw badRequest("Invalid bannerId");
      }

      return homeBannerRepo.findById(id);
    },

    async create(payload = {}) {
      const slug = normalizeSlug(payload.slug);
      if (!slug) throw badRequest("slug is required");

      const existing = await homeBannerRepo.findBySlug(slug);
      if (existing) throw badRequest("Slug already exists");

      let categoryId = null;
      if (payload.categoryId !== undefined && payload.categoryId !== null && payload.categoryId !== "") {
        if (!mongoose.Types.ObjectId.isValid(String(payload.categoryId))) {
          throw badRequest("Invalid categoryId");
        }

        const category = await categoryRepo.getById(payload.categoryId);
        if (!category) throw badRequest("Category not found");
        categoryId = category._id;
      }

      return homeBannerRepo.create({
        slug,
        title: normalizeLocalizedText(payload.title),
        subtitle: normalizeLocalizedText(payload.subtitle),
        description: normalizeLocalizedText(payload.description),
        imageURL: String(payload.imageURL || "").trim(),
        mobileImageURL: String(payload.mobileImageURL || "").trim(),
        videoURL: String(payload.videoURL || "").trim(),
        mobileVideoURL: String(payload.mobileVideoURL || "").trim(),
        buttonText: normalizeLocalizedText(payload.buttonText),
        link: String(payload.link || "").trim(),
        categoryId,
        backgroundColor: String(payload.backgroundColor || "").trim(),
        textColor: String(payload.textColor || "").trim(),
        status: payload.status || "active",
        position: Number(payload.position || 0),
        startsAt: payload.startsAt || null,
        endsAt: payload.endsAt || null,
      });
    },

    async update(id, payload = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid bannerId");
      }

      const current = await homeBannerRepo.findById(id);
      if (!current) throw badRequest("Banner not found");

      const slug =
        payload.slug !== undefined ? normalizeSlug(payload.slug) : current.slug;

      if (!slug) throw badRequest("slug is required");

      const existing = await homeBannerRepo.findBySlug(slug);
      if (existing && String(existing._id) !== String(id)) {
        throw badRequest("Slug already exists");
      }

      let categoryId = current.categoryId?._id || current.categoryId || null;
      if (payload.categoryId !== undefined) {
        if (payload.categoryId === null || payload.categoryId === "") {
          categoryId = null;
        } else {
          if (!mongoose.Types.ObjectId.isValid(String(payload.categoryId))) {
            throw badRequest("Invalid categoryId");
          }

          const category = await categoryRepo.getById(payload.categoryId);
          if (!category) throw badRequest("Category not found");
          categoryId = category._id;
        }
      }

      return homeBannerRepo.updateById(id, {
        slug,
        title:
          payload.title !== undefined
            ? normalizeLocalizedText(payload.title)
            : current.title,
        subtitle:
          payload.subtitle !== undefined
            ? normalizeLocalizedText(payload.subtitle)
            : current.subtitle,
        description:
          payload.description !== undefined
            ? normalizeLocalizedText(payload.description)
            : current.description,
        imageURL:
          payload.imageURL !== undefined
            ? String(payload.imageURL || "").trim()
            : current.imageURL,
        mobileImageURL:
          payload.mobileImageURL !== undefined
            ? String(payload.mobileImageURL || "").trim()
            : current.mobileImageURL,
        videoURL:
          payload.videoURL !== undefined
            ? String(payload.videoURL || "").trim()
            : current.videoURL,
        mobileVideoURL:
          payload.mobileVideoURL !== undefined
            ? String(payload.mobileVideoURL || "").trim()
            : current.mobileVideoURL,
        buttonText:
          payload.buttonText !== undefined
            ? normalizeLocalizedText(payload.buttonText)
            : current.buttonText,
        link:
          payload.link !== undefined
            ? String(payload.link || "").trim()
            : current.link,
        categoryId,
        backgroundColor:
          payload.backgroundColor !== undefined
            ? String(payload.backgroundColor || "").trim()
            : current.backgroundColor,
        textColor:
          payload.textColor !== undefined
            ? String(payload.textColor || "").trim()
            : current.textColor,
        status: payload.status !== undefined ? payload.status : current.status,
        position:
          payload.position !== undefined
            ? Number(payload.position || 0)
            : current.position,
        startsAt: payload.startsAt !== undefined ? payload.startsAt : current.startsAt,
        endsAt: payload.endsAt !== undefined ? payload.endsAt : current.endsAt,
      });
    },

    async remove(id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid bannerId");
      }

      const current = await homeBannerRepo.findById(id);
      if (!current) throw badRequest("Banner not found");

      await homeBannerRepo.deleteById(id);
      return { ok: true };
    },

    async listActive() {
      return homeBannerRepo.listActive(new Date());
    },
  };
}
