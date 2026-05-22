export function createOfferResolveService({ offerRepo }) {
  return {
    async resolve({ groupId, optionKey = null, optionValues = null }) {
      if (!groupId) throw new Error("groupId is required");

      if (optionKey) {
        return offerRepo.findByGroupAndOptionKey(groupId, optionKey);
      }

      if (Array.isArray(optionValues)) {
        return offerRepo.findByGroupAndOptionValues(groupId, optionValues);
      }

      throw new Error("optionKey or optionValues is required");
    },
  };
}
