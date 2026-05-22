import express from "express";
import {
  ICharacterRepo,
  ICharacterAdminService,
} from "../../Common/DI/tokens.js";

import { createCharacterRepo } from "./Repositories/Character.repo.js";
import { createCharacterAdminService } from "./Services/CharacterAdmin.service.js";
import { characterController } from "./Controllers/Character.controller.js";

export function registerCharacter(api, container) {
  const router = express.Router();

  container.set(ICharacterRepo, createCharacterRepo());

  container.set(
    ICharacterAdminService,
    createCharacterAdminService({
      characterRepo: container.get(ICharacterRepo),
      productGroupWriteRepo: container.get("productGroupWriteRepo"),
    })
  );

  characterController(router, { container });

  api.use("/character", router);
}