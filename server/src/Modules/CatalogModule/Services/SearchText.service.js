export function createSearchTextService({ characteristicMetaRepo }) {
  return {
    async buildSearchTextForGroup(group) {
      const parts = [];
      const t = group?.title || {};
      if (t.ua) parts.push(t.ua);
      if (t.en) parts.push(t.en);

      // add searchable characteristics values
      const searchable = await characteristicMetaRepo.listSearchable({ status: "active" });
      const searchableKeys = new Set(searchable.map((m) => m.key));

      for (const c of group?.characteristics || []) {
        if (!searchableKeys.has(c.key)) continue;

        if (c.value != null && c.value !== "") parts.push(String(c.value));
        if (Array.isArray(c.values) && c.values.length) parts.push(...c.values.map(String));
      }

      return parts.join(" ").toLowerCase();
    },
  };
}
