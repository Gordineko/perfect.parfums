import { ICatalogFacade } from "../../../Common/DI/tokens.js";

export function offersController(router, { container }) {
  router.post("/offers/resolve", async (req, res, next) => {
    try {
      const facade = container.get(ICatalogFacade);
      const { groupId, optionKey, optionValues } = req.body || {};

      if (!groupId) return res.status(400).json({ message: "groupId is required", code: "BAD_REQUEST" });
      if (!optionKey && !Array.isArray(optionValues)) {
        return res.status(400).json({ message: "optionKey or optionValues is required", code: "BAD_REQUEST" });
      }

      const offer = await facade.resolveOffer({ groupId, optionKey, optionValues });
      if (!offer) return res.status(404).json({ message: "Offer not found", code: "NOT_FOUND" });

      res.json({ offer });
    } catch (e) {
      next(e);
    }
  });
}
