import {
  ICatalogCardsService,
  ICategoryService,
  ICategoryAdminService,
  IFacetsService,
  ICatalogDetailsService,
  IOfferResolveService,
} from "../../../Common/DI/tokens.js";

export function createCatalogFacade(container) {
  const cards = container.get(ICatalogCardsService);
  const cats = container.get(ICategoryService);
  const catsAdmin = container.get(ICategoryAdminService);
  const facets = container.get(IFacetsService);
  const details = container.get(ICatalogDetailsService);
  const resolve = container.get(IOfferResolveService);

  return {
    // categories read
    getCategoryTree: (params) => cats.getTree(params),
    getCategoryChildren: (params) => cats.getChildren(params),
    getCategoryBreadcrumbs: (params) => cats.getBreadcrumbs(params),
    getCategoryByPath: (params) => cats.getByPath(params),
    getCategoryByFullSlug: (params) => cats.getByFullSlug(params),
    getCategorySubtreeByPath: (params) => cats.getSubtreeByPath(params),
    exportCategoryCsv: (params) => cats.exportCsv(params),
    exportCategoryXlsx: (params) => cats.exportXlsx(params),

    // categories write
    createCategory: (params) => catsAdmin.create(params),
    updateCategory: (params) => catsAdmin.update(params),
    deleteCategory: (params) => catsAdmin.remove(params),

    // listing
    buildCatalogCards: (params) => cards.buildCatalogCards(params),

    // facets
    getFacets: (params) => facets.getFacets(params),

    // PDP
    getGroupBySlug: (params) => details.getGroupBySlug(params),

    // resolve offer
    resolveOffer: (params) => resolve.resolve(params),
  };
}