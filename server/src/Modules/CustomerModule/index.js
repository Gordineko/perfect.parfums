import express from "express";
import { ICustomerAdminService } from "../../Common/DI/tokens.js";
import { createCustomerRepo } from "./Repositories/customer.repo.js";
import { createCustomerAdminService } from "./Services/customer.admin.service.js";
import { customerAdminController } from "./Controllers/customer.admin.controller.js";

export function registerCustomer(api, container) {
  const router = express.Router();

  const customerRepo = createCustomerRepo();

  container.set(
    ICustomerAdminService,
    createCustomerAdminService({
      customerRepo,
    })
  );

  customerAdminController(router, { container });

  api.use("/customers", router);
}