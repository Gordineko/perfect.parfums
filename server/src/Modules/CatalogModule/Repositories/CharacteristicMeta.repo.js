// Repos/CharacteristicMeta.repo.js
export function createCharacteristicMetaRepo({ CharacteristicMeta }) {
  return {
    async list({ status = "active" } = {}) {
      return CharacteristicMeta.find(status ? { status } : {}).sort({ sort: 1, key: 1 }).lean();
    },

    async listFilterable({ status = "active", scope = null } = {}) {
      const q = { ...(status ? { status } : {}), filterable: true };
      if (scope) q.scope = scope;
      return CharacteristicMeta.find(q).sort({ sort: 1, key: 1 }).lean();
    },

    async listSearchable({ status = "active", scope = "group" } = {}) {
      // searchable обычно нужно только для group, но оставляем гибко
      const q = { ...(status ? { status } : {}), searchable: true };
      if (scope) q.scope = scope;
      return CharacteristicMeta.find(q).sort({ sort: 1, key: 1 }).lean();
    },

    async findByKeys(keys = []) {
      if (!Array.isArray(keys) || !keys.length) {
        return [];
      }

      return CharacteristicMeta.find({ key: { $in: keys } }).lean();
    },

    async bulkUpsert(docs = []) {
      if (!Array.isArray(docs) || !docs.length) {
        return { ok: 1, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
      }

      return CharacteristicMeta.bulkWrite(
        docs.map((doc) => ({
          updateOne: {
            filter: { key: doc.key },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    },

    async deleteManyByKeys(keys = []) {
      if (!Array.isArray(keys) || !keys.length) {
        return { deletedCount: 0 };
      }

      return CharacteristicMeta.deleteMany({ key: { $in: keys } });
    },
  };
}