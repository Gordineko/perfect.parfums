import { ICharacteristicMetaRepo } from "../../../Common/DI/tokens.js";

export function characteristicsController(router, { container }) {
  router.get("/characteristics/meta", async (req, res, next) => {
    try {
      const repo = container.get(ICharacteristicMetaRepo);
      const status = req.query.status || "active";
      const items = await repo.list({ status });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  });
}
