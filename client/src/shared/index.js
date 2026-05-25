export { BREAKPOINTS, MQ } from "./config/BREAKPOINTS";
export { getLocalizedCatalogSection } from "./config/catalogSection";
export { getLocalizedFooter } from "./config/footer";
export * from "./config/headerActionsList";
export { getLocalizedHeroSlides } from "./config/heroSlides";
export { HOME_BANNER_FALLBACK } from "./config/homeBannerFallback";
export { MODALS } from "./config/modals";
export { getLocalizedNavigation } from "./config/navItems";
export {
  QUERY_CATEGORY_IDS,
  QUERY_CHAR,
  QUERY_OFFER_CHAR,
  QUERY_ONLY_AVAILABLE,
  QUERY_OPT,
  QUERY_PAGE,
  QUERY_PRICE_MAX,
  QUERY_PRICE_MIN,
  QUERY_Q,
  QUERY_SORT,
  QUERY_VALUE,
} from "./consts/query-params";
export { buildCatalogSearchResultsHref } from "./lib/buildCatalogSearchHref";
export {
  getLocaleFromPathname,
  localePath,
  pathWithoutLocale,
} from "./lib/localePath";
export { categoryIdsHasSale } from "./lib/categoryIdsHasSale";
export {
  normalizeCategoryIdsForCardsQuery,
  parseCategoryIdsFromResolvedSearch,
  parseCategoryIdsFromSearchParams,
} from "./lib/categoryIdsQuery";
export {
  categoryNodeFullSlug,
  categoryTreeItemHref,
} from "./lib/categoryTreeHref";
export { colorPresetValueToHex } from "./lib/colorPresetHex";
export { deriveProductPrimaryImageUrl } from "./lib/deriveProductPrimaryImageUrl";
export {
  formatPrice,
  formatPriceDigits,
  parsePriceLikeNumber,
} from "./lib/formatPrice";
export { ModalsProvider, useModals } from "./lib/modalsContext";
export {
  enrichPricingWithOfferReference,
  normalizeCatalogCardForProductItem,
} from "./lib/normalizeCatalogCard";
export {
  getOfferCrossPrice,
  getOfferUnitPrice,
  offerToNumber,
} from "./lib/offerPrice";
export { pickLocalizedString } from "./lib/pickLocalized";
export { resolveCatalogGroupSlugParam } from "./lib/resolveCatalogGroupSlugParam";
export { ToastProvider, useToast } from "./lib/toastContext";
export {
  formatUaPhone,
  normalizeUaPhoneDigits,
  toUaE164Phone,
} from "./lib/uaPhone";
export { useOnClickOutside } from "./lib/useOnClickOutside";
export { useIsMobile } from "./lib/useScreenWidth";
export { getViewedProducts, pushViewedProduct } from "./lib/viewedProducts";
export { default as AccountIcon } from "./ui/icons/AccountIcon";
export { default as AuthEmailIcon } from "./ui/icons/AuthEmailIcon";
export { default as Arrow } from "./ui/icons/Arrow";
export { default as ArrowMoreIcon } from "./ui/icons/ArrowMoreIcon";
export { default as ArrowSwiperButton } from "./ui/icons/ArrowSwiperButton";
export { default as Basket } from "./ui/icons/Basket";
export { default as BurgerMenu } from "./ui/icons/BurgerMenu";
export { default as BurgerMenuCatalog } from "./ui/icons/BurgerMenuCatalog";
export { default as CloseBtn } from "./ui/icons/CloseBtn";
export { default as CloseX } from "./ui/icons/CloseX";
export { default as CounterMinusIcon } from "./ui/icons/CounterMinusIcon";
export { default as CounterPlusIcon } from "./ui/icons/CounterPlusIcon";
export { default as DeleteBasket } from "./ui/icons/DeleteBasket";
export { default as DeliveryIcon } from "./ui/icons/DeliveryIcon";
export { default as FavoriteHeart } from "./ui/icons/FavoriteHeart";
export { default as FavoriteProductIcon } from "./ui/icons/FavoriteProductIcon";
export { default as FilterIcon } from "./ui/icons/FilterIcon";
export { default as GuaranteesIcon } from "./ui/icons/GuaranteesIcon";
export { default as LanguageSwitcher } from "./ui/icons/LanguageSwitcher";
export { default as Logo } from "./ui/icons/Logo";
export { default as PaymentMethodIcon } from "./ui/icons/PaymentMethodIcon";
export { default as Profile } from "./ui/icons/Profile";
export { default as Search } from "./ui/icons/Search";
export { default as StarDecor } from "./ui/icons/StarDecor";
export { default as SupportAgentIcon } from "./ui/icons/SupportAgentIcon";
export { default as UKFlag } from "./ui/icons/UKFlag";
export { default as UkrFlag } from "./ui/icons/UkrFlag";
export { default as PageHeader } from "./ui/PageHeader";
export { default as SocialLinks } from "./ui/SocialLinks";

// i18n (public API)
export { i18n } from "./i18n/config";
export { getMessages } from "./i18n/getMessages";
export { createI18nServer } from "./i18n/server";
export { I18nProvider, useI18n } from "./i18n/use-i18n";

// api services (public API)
export { getCurrentUser, logoutUser, updateProfile } from "./api/authServices";
export { getHomeBanners } from "./api/bannerServices";
export {
  getAllCategory,
  getCategoryBreadcrumbs,
} from "./api/categoryServices";
export {
  getAllFilters,
  getAllProducts,
  getAllProductsForSwiper,
  getCharacteristicsMeta,
  getPopularCatalogCards,
  getProductBySlug,
  getSaleCatalogCards,
} from "./api/productsServices";
export {
  createReview,
  fetchProductReviews,
  reviewsApiBaseUrl,
} from "./api/reviewsServices";

// redux (public API)
export { resetCartMergeSession } from "./redux/Cart/lib/cartMergeSession";
export {
  addToCart,
  addToCartAsync,
  changeQuantity,
  changeQuantityAsync,
  clearCart,
  clearCartAsync,
  decrementQuantity,
  decrementQuantityAsync,
  fetchCartFromDB,
  getCartData,
  incrementQuantity,
  incrementQuantityAsync,
  removeFromCart,
  removeFromCartAsync,
} from "./redux/Cart/lib/CartSlice";
export { default as store } from "./redux/store/store";
export {
  wishlistContainsGroupForProduct,
  wishlistItemGroupId,
  wishlistRowKey,
} from "./redux/Wishlist/lib/wishlistGroupId";
export {
  clearWishlist,
  getWishlistData,
  toggleWishlist,
  toggleWishlistAsync,
} from "./redux/Wishlist/lib/WishlistSlice";
export { default } from "./ui/MainNav";
export { cormorant, italiana, lato } from "./ui/styles/font";
export { default as SwiperPagination } from "./ui/SwiperPagination";
export { default as Title } from "./ui/Title";
