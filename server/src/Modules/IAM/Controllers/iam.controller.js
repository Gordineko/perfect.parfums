export function iamController(router, { iamService, bus }) {

  router.post('/iam/users/:id/block', async (req, res, next) => {
    try {
      await iamService.blockUser(req.params.id);
      bus.publish('iam.user.blocked.v1', { userId: req.params.id }, { actorId: req.user?.id });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

}
