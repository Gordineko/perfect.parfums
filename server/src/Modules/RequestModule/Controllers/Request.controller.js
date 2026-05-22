import { IRequestFacade } from "../../../Common/DI/tokens.js";

export function requestController(router, { container }) {
  const requestFacade = container.get(IRequestFacade);

  router.post("/", async (req, res, next) => {
    try {
      const data = await requestFacade.create(req.body);

      res.status(201).json({
        ok: true,
        data,
      });
    } catch (e) {
      next(e);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const data = await requestFacade.getAll(req.query);

      res.json({
        ok: true,
        data,
      });
    } catch (e) {
      next(e);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const data = await requestFacade.getById(req.params.id);

      res.json({
        ok: true,
        data,
      });
    } catch (e) {
      next(e);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const data = await requestFacade.update(
        req.params.id,
        req.body
      );

      res.json({
        ok: true,
        data,
      });
    } catch (e) {
      next(e);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      await requestFacade.delete(req.params.id);

      res.json({
        ok: true,
      });
    } catch (e) {
      next(e);
    }
  });
}