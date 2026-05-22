import { HomeBanner } from "../Models/HomeBanner.model.js";

export function createHomeBannerRepo() {
  return {
    async findPage(
      filter,
      { skip = 0, limit = 20, sort = { position: 1, _id: 1 } } = {}
    ) {
      const [items, total] = await Promise.all([
        HomeBanner.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate({
            path: "categoryId",
            select: {
              slug: 1,
              title: 1,
              fullSlug: 1,
              status: 1,
            },
          })
          .lean(),
        HomeBanner.countDocuments(filter),
      ]);

      return { items, total };
    },

    async findById(id) {
      return HomeBanner.findById(id)
        .populate({
          path: "categoryId",
          select: {
            slug: 1,
            title: 1,
            fullSlug: 1,
            status: 1,
          },
        })
        .lean();
    },

    async findBySlug(slug) {
      return HomeBanner.findOne({ slug }).lean();
    },

    async create(doc) {
      const created = await HomeBanner.create(doc);
      return created.toObject();
    },

    async updateById(id, patch) {
      return HomeBanner.findByIdAndUpdate(id, patch, {
        new: true,
      })
        .populate({
          path: "categoryId",
          select: {
            slug: 1,
            title: 1,
            fullSlug: 1,
            status: 1,
          },
        })
        .lean();
    },

    async deleteById(id) {
      return HomeBanner.deleteOne({ _id: id });
    },

    async listActive(now = new Date()) {
      return HomeBanner.find({
        status: "active",
        $and: [
          {
            $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
          },
          {
            $or: [{ endsAt: null }, { endsAt: { $gte: now } }],
          },
        ],
      })
        .sort({ position: 1, _id: 1 })
        .populate({
          path: "categoryId",
          select: {
            slug: 1,
            title: 1,
            fullSlug: 1,
            status: 1,
          },
        })
        .lean();
    },
  };
}