/** Єдині брейкпоінти (px). Дзеркало SCSS: shared/ui/styles/variables.scss */
export const BREAKPOINTS = Object.freeze({
  desktop: 1250,
  tablet: 768,
  mobile: 400,
  mobileMax: 399.98,
  belowTabletMax: 767.98,
  tabletMax: 1249.98,
  mobileXs: 480,
  desktopNarrow: 1200,
  tabletLandscapeMax: 1023.98,
});

/** Готові рядки для matchMedia / sizes */
export const MQ = Object.freeze({
  mobileOnly: `(max-width: ${BREAKPOINTS.mobileMax}px)`,
  belowTablet: `(max-width: ${BREAKPOINTS.belowTabletMax}px)`,
  tabletOnly: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.tabletMax}px)`,
  tabletUp: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  belowDesktop: `(max-width: ${BREAKPOINTS.tabletMax}px)`,
});
