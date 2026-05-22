// Common/DI/tokens.js

// ===== Facades =====
export const ICatalogFacade = Symbol("ICatalogFacade");
export const IUserFacade = Symbol("IUserFacade");
export const IRequestFacade = Symbol("IRequestFacade");

// ===== Repos =====
export const ICategoryRepo = Symbol("ICategoryRepo");
export const IProductGroupRepo = Symbol("IProductGroupRepo");
export const IOfferRepo = Symbol("IOfferRepo");
export const ICharacteristicMetaRepo = Symbol("ICharacteristicMetaRepo");
export const IProductGroupFacetsRepo = Symbol("IProductGroupFacetsRepo");

// ===== Services =====
export const ICategoryService = Symbol("ICategoryService");
export const ICatalogCardsService = Symbol("ICatalogCardsService");
export const IFacetsService = Symbol("IFacetsService");
export const ICatalogDetailsService = Symbol("ICatalogDetailsService");
export const IOfferResolveService = Symbol("IOfferResolveService");
export const ICategoryAdminService = Symbol("ICategoryAdminService");

export const ICatalogAdminService = Symbol("ICatalogAdminService");
export const ICatalogAdminOffersService = Symbol("ICatalogAdminOffersService");

export const IOrderAdminRepo = Symbol("IOrderAdminRepo");
export const IOrderAdminService = Symbol("IOrderAdminService");
export const IUserAdminRepo = Symbol("IUserAdminRepo");
export const IUserAdminService = Symbol("IUserAdminService");

export const IWarehouseRepo = Symbol("IWarehouseRepo");
export const IInventoryRepo = Symbol("IInventoryRepo");
export const IStockMovementRepo = Symbol("IStockMovementRepo");
export const IStockDocumentRepo = Symbol("IStockDocumentRepo");


export const IWarehouseService = Symbol("IWarehouseService");
export const IInventoryService = Symbol("IInventoryService");
export const IStockOperationService = Symbol("IStockOperationService");

export const ICharacterRepo = Symbol("ICharacterRepo");
export const ICharacterAdminService = Symbol("ICharacterAdminService");

export const ICustomerAdminService = Symbol("ICustomerAdminService");
export const IHomeBannerRepo = Symbol("IHomeBannerRepo");
export const IHomeBannerAdminService = Symbol("IHomeBannerAdminService");