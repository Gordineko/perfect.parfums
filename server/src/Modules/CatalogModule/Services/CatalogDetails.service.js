export function createCatalogDetailsService({ productGroupRepo, offerRepo }) {
  return {
    async getGroupBySlug({ slug }) {
      const group = await productGroupRepo.findBySlug(slug);
      if (!group) return null;

      const offers = await offerRepo.listByGroup(group._id);

      let min = null;
      let max = null;
      let hasAvailable = false;

      for (const o of offers) {
        if (min == null || o.price < min) min = o.price;
        if (max == null || o.price > max) max = o.price;
        if (o.available) hasAvailable = true;
      }

      return {
        ...group,
        offers,
        pricing: { min, max, currency: "UAH" },
        availability: { hasAvailable, variantsCount: offers.length },
      };
    },
  };
}
