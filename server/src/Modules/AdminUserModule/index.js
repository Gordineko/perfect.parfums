import express from "express";

import { createAdminUserRepo } from "./Repositories/adminUser.repo.js";
import { createAdminRoleRepo } from "./Repositories/adminRole.repo.js";

import { createAdminAuthService } from "./Services/adminAuth.service.js";
import { createAdminUserService } from "./Services/adminUser.service.js";
import { createAdminRoleService } from "./Services/adminRole.service.js";

import { createRequireAdminAuth } from "./Middlewares/requireAdminAuth.js";

import { createAdminAuthController } from "./Controllers/adminAuth.controller.js";
import { createAdminUserController } from "./Controllers/adminUser.controller.js";
import { createAdminRoleController } from "./Controllers/adminRole.controller.js";

export const IAdminAuthService = Symbol("IAdminAuthService");
export const IAdminUserService = Symbol("IAdminUserService");
export const IAdminRoleService = Symbol("IAdminRoleService");
export const IAdminUserRepo = Symbol("IAdminUserRepo");
export const IAdminRoleRepo = Symbol("IAdminRoleRepo");
export const IRequireAdminAuth = Symbol("IRequireAdminAuth");

export function registerAdminUser(api, container) {
  const router = express.Router();

  container.set(IAdminUserRepo, createAdminUserRepo());
  container.set(IAdminRoleRepo, createAdminRoleRepo());

  container.set(
    IAdminAuthService,
    createAdminAuthService({
      adminUserRepo: container.get(IAdminUserRepo),
    })
  );

  container.set(
    IAdminUserService,
    createAdminUserService({
      adminUserRepo: container.get(IAdminUserRepo),
      adminRoleRepo: container.get(IAdminRoleRepo),
    })
  );

  container.set(
    IAdminRoleService,
    createAdminRoleService({
      adminRoleRepo: container.get(IAdminRoleRepo),
    })
  );

  container.set(
    IRequireAdminAuth,
    createRequireAdminAuth({
      adminUserRepo: container.get(IAdminUserRepo),
    })
  );

  createAdminAuthController({
    router,
    adminAuthService: container.get(IAdminAuthService),
    requireAdminAuth: container.get(IRequireAdminAuth),
  });

  createAdminUserController({
    router,
    adminUserService: container.get(IAdminUserService),
    requireAdminAuth: container.get(IRequireAdminAuth),
  });

  createAdminRoleController({
    router,
    adminRoleService: container.get(IAdminRoleService),
    requireAdminAuth: container.get(IRequireAdminAuth),
  });

  api.use("/staff", router);
}