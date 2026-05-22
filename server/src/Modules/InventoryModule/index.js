import express from "express";
import {
  IWarehouseRepo,
  IInventoryRepo,
  IStockMovementRepo,
  IStockDocumentRepo,
  IWarehouseService,
  IInventoryService,
  IStockOperationService,
} from "../../Common/DI/tokens.js";

import { createWarehouseRepo } from "./Repositories/Warehouse.repo.js";
import { createInventoryRepo } from "./Repositories/Inventory.repo.js";
import { createStockMovementRepo } from "./Repositories/StockMovement.repo.js";
import { createStockDocumentRepo } from "./Repositories/StockDocument.repo.js";

import { createWarehouseService } from "./Services/Warehouse.service.js";
import { createInventoryService } from "./Services/Inventory.service.js";
import { createStockOperationService } from "./Services/StockOperation.service.js";

import { warehouseController } from "./Controllers/Warehouse.controller.js";
import { inventoryController } from "./Controllers/Inventory.controller.js";
import { stockOperationController } from "./Controllers/StockOperation.controller.js";

export function registerInventory(api, container) {
  const router = express.Router();

  container.set(IWarehouseRepo, createWarehouseRepo());
  container.set(IInventoryRepo, createInventoryRepo());
  container.set(IStockMovementRepo, createStockMovementRepo());
  container.set(IStockDocumentRepo, createStockDocumentRepo());

  container.set(
    IWarehouseService,
    createWarehouseService({
      warehouseRepo: container.get(IWarehouseRepo),
    })
  );

  container.set(
    IInventoryService,
    createInventoryService({
      inventoryRepo: container.get(IInventoryRepo),
      warehouseRepo: container.get(IWarehouseRepo),
    })
  );

  container.set(
    IStockOperationService,
    createStockOperationService({
      inventoryRepo: container.get(IInventoryRepo),
      warehouseRepo: container.get(IWarehouseRepo),
      stockMovementRepo: container.get(IStockMovementRepo),
      stockDocumentRepo: container.get(IStockDocumentRepo),
    })
  );

  warehouseController(router, { container });
  inventoryController(router, { container });
  stockOperationController(router, { container });

  api.use("/inventory", router);
}