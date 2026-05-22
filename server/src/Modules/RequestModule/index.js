import express from "express";
import { IRequestFacade } from "../../Common/DI/tokens.js";

import { requestController } from "./Controllers/Request.controller.js";
import { createRequestFacade } from "./Adapters/request.facade.js";

import "./Models/Request.model.js";

export function registerRequest(api, container) {
  const router = express.Router();

  // если используешь bus/event system
  const bus = container.get?.("bus");

  // регистрируем фасад
  container.set(IRequestFacade, createRequestFacade({ bus }));

  // регистрируем контроллер
  requestController(router, { container });

  // подключаем роуты
  api.use("/requests", router);
}