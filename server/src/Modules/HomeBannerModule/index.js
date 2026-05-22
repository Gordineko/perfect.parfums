import express from "express";
import {
  IHomeBannerRepo,
  IHomeBannerAdminService,
  ICategoryRepo,
} from "../../Common/DI/tokens.js";

import { createHomeBannerRepo } from "./Repositories/HomeBanner.repo.js";
import { createHomeBannerAdminService } from "./Services/HomeBannerAdmin.service.js";
import { homeBannerController } from "./Controllers/HomeBanner.controller.js";

export function registerHomeBanner(api, container) {
  const router = express.Router();

  container.set(IHomeBannerRepo, createHomeBannerRepo());

  container.set(
    IHomeBannerAdminService,
    createHomeBannerAdminService({
      homeBannerRepo: container.get(IHomeBannerRepo),
      categoryRepo: container.get(ICategoryRepo),
    })
  );

  homeBannerController(router, { container });

  api.use("/banner", router);
}