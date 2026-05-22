export function formatIamCartLines(rawCart) {
  if (!Array.isArray(rawCart)) {
    return [];
  }
  return rawCart.map((item) => {
    const g = item.group || {};
    const o = item.offer || {};

    return {
      _id: o._id || item.offerId,
      groupId: g._id || item.groupId,
      slug: g.slug,
      imageURL: g.imageURL,
      title: g.title,
      categoryIds: g.categoryIds,
      availability: {
        hasAvailable: o.available ?? true,
        variantsCount: g.variationAxes?.length || 1,
      },
      pricing: (() => {
        const raw = o.effectivePrice ?? o.price ?? item.priceAtAdd ?? 0;
        const n = Number(raw);
        const s = Number.isFinite(n) ? String(Math.round(n)) : "0";
        return {
          min: s,
          max: s,
          currency: "UAH",
        };
      })(),
      quantityInCart: item.qty,
      offers: [o],
      ui: g.ui || { variationAxes: g.variationAxes || [] },
      variantPreview: g.variantPreview || {},
    };
  });
}
