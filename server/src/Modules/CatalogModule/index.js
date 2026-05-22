import express from "express";

import {
  ICatalogFacade,

  ICategoryRepo,
  IProductGroupRepo,
  IOfferRepo,
  ICharacteristicMetaRepo,
  IProductGroupFacetsRepo,

  ICategoryService,
  ICategoryAdminService,
  ICatalogCardsService,
  IFacetsService,
  ICatalogDetailsService,
  IOfferResolveService,

  ICatalogAdminService,
  ICatalogAdminOffersService,
} from "../../Common/DI/tokens.js";

// ===== Models =====
import { Category } from "./Models/Category.model.js";
import { ProductGroup } from "./Models/ProductGroup.model.js";
import { Offer } from "./Models/Offer.model.js";
import { CharacteristicMeta } from "./Models/CharacteristicMeta.model.js";

// ===== Repos =====
import { createCategoryRepo } from "./Repositories/Category.repo.js";
import { createProductGroupRepo } from "./Repositories/ProductGroup.repo.js";
import { createOfferRepo } from "./Repositories/Offer.repo.js";
import { createCharacteristicMetaRepo } from "./Repositories/CharacteristicMeta.repo.js";
import { createProductGroupFacetsRepo } from "./Repositories/ProductGroupFacets.repo.js";

import { createProductGroupWriteRepo } from "./Repositories/ProductGroup.write.repo.js";
import { createOfferWriteRepo } from "./Repositories/Offer.write.repo.js";

// ===== Services =====
import { createCategoryService } from "./Services/Category.service.js";
import { createCatalogCardsService } from "./Services/CatalogCards.service.js";
import { createFacetsService } from "./Services/Facets.service.js";
import { createCatalogDetailsService } from "./Services/CatalogDetails.service.js";
import { createOfferResolveService } from "./Services/OfferResolve.service.js";
import { createCategoryAdminService } from "./Services/CategoryAdmin.service.js";

import { createCatalogAdminService } from "./Services/CatalogAdmin.service.js";
import { createCatalogAdminOffersService } from "./Services/CatalogAdminOffers.service.js";

// ===== Facade =====
import { createCatalogFacade } from "./Adapters/Catalog.facade.js";

// ===== Controllers =====
import { catalogController } from "./Controllers/Catalog.controller.js";
import { categoriesController } from "./Controllers/Categories.controller.js";
import { offersController } from "./Controllers/Offers.controller.js";
import { characteristicsController } from "./Controllers/Characteristics.controller.js";

import { adminCatalogController } from "./Controllers/AdminCatalog.controller.js";
import { adminCatalogOffersController } from "./Controllers/AdminCatalogOffers.controller.js";
import { adminCategoriesController } from "./Controllers/AdminCategories.controller.js";

export function registerCatalog(api, container) {
  const router = express.Router();

  // =========================
  // 1) Repositories
  // =========================
  container.set(ICategoryRepo, createCategoryRepo({ Category }));
  container.set(IProductGroupRepo, createProductGroupRepo({ ProductGroup }));
  container.set(IOfferRepo, createOfferRepo({ Offer }));
  container.set(ICharacteristicMetaRepo, createCharacteristicMetaRepo({ CharacteristicMeta }));
  container.set(IProductGroupFacetsRepo, createProductGroupFacetsRepo({ ProductGroup }));

  container.set("productGroupWriteRepo", createProductGroupWriteRepo());
  container.set("offerWriteRepo", createOfferWriteRepo());

  // =========================
  // 2) Services
  // =========================
  container.set(
    ICategoryService,
    createCategoryService({
      categoryRepo: container.get(ICategoryRepo),
    })
  );

  container.set(
    ICategoryAdminService,
    createCategoryAdminService({
      categoryRepo: container.get(ICategoryRepo),
      productGroupWriteRepo: container.get("productGroupWriteRepo"),
      offerWriteRepo: container.get("offerWriteRepo"),
      characteristicMetaRepo: container.get(ICharacteristicMetaRepo),
    })
  );

  container.set(
    ICatalogCardsService,
    createCatalogCardsService({
      productGroupRepo: container.get(IProductGroupRepo),
      offerRepo: container.get(IOfferRepo),
      categoryRepo: container.get(ICategoryRepo),
    })
  );

  container.set(
    IFacetsService,
    createFacetsService({
      productGroupRepo: container.get(IProductGroupRepo),
      offerRepo: container.get(IOfferRepo),
      categoryRepo: container.get(ICategoryRepo),
      characteristicMetaRepo: container.get(ICharacteristicMetaRepo),
      productGroupFacetsRepo: container.get(IProductGroupFacetsRepo),
    })
  );

  container.set(
    ICatalogDetailsService,
    createCatalogDetailsService({
      productGroupRepo: container.get(IProductGroupRepo),
      offerRepo: container.get(IOfferRepo),
    })
  );

  container.set(
    IOfferResolveService,
    createOfferResolveService({
      offerRepo: container.get(IOfferRepo),
    })
  );

  container.set(
    ICatalogAdminService,
    createCatalogAdminService({
      productGroupWriteRepo: container.get("productGroupWriteRepo"),
      offerWriteRepo: container.get("offerWriteRepo"),
      categoryRepo: container.get(ICategoryRepo),
      characteristicMetaRepo: container.get(ICharacteristicMetaRepo),
    })
  );

  container.set(
    ICatalogAdminOffersService,
    createCatalogAdminOffersService({
      productGroupWriteRepo: container.get("productGroupWriteRepo"),
      offerWriteRepo: container.get("offerWriteRepo"),
      categoryRepo: container.get(ICategoryRepo),
    })
  );

  // =========================
  // 3) Facade
  // =========================
  container.set(ICatalogFacade, createCatalogFacade(container));

  // =========================
  // 4) Routes
  // =========================
  catalogController(router, { container });
  categoriesController(router, { container });
  offersController(router, { container });
  characteristicsController(router, { container });

  adminCatalogController(router, { container });
  adminCatalogOffersController(router, { container });
  adminCategoriesController(router, { container });

  api.use("/catalog", router);
}