import { localePath } from "../lib/localePath";

export const getLocalizedNavigation = (
  t,
  locale,
) => ({
  headerNavItems: [
    {
      id: "catalog",
      label: t("navigation.header.catalog"),
      href: localePath(locale, "/categories/all"),
    },
    {
      id: "about",
      label: t("navigation.header.about"),
      href: localePath(locale, "/about-us"),
    },
    {
      id: "content",
      label: t("navigation.header.content"),
      href: localePath(locale, "/content"),
    },
    {
      id: "principles",
      label: t("navigation.header.principles"),
      href: localePath(locale, "/principles"),
    },
    {
      id: "contacts",
      label: t("navigation.header.contacts"),
      href: localePath(locale, "/contacts"),
    },
  ],

  footerNavItems: [
    {
      id: "catalog",
      label: t("navigation.footer.catalog"),
      href: localePath(locale, "/categories/all"),
    },
    {
      id: "about-us",
      label: t("navigation.footer.aboutUs"),
      href: localePath(locale, "/about-us"),
    },
    {
      id: "laboratory",
      label: t("navigation.footer.laboratory"),
      href: localePath(locale, "/laboratory"),
    },
    {
      id: "library",
      label: t("navigation.footer.library"),
      href: localePath(locale, "/library"),
    },
    {
      id: "payment-delivery",
      label: t(
        "navigation.footer.paymentDelivery",
      ),
      href: localePath(locale, "/payment-delivery"),
    },
    {
      id: "warranty-returns",
      label: t(
        "navigation.footer.warrantyReturns",
      ),
      href: localePath(locale, "/warranty-returns"),
    },
  ],

  burgerNavItems: [
    {
      id: "about-us",
      label: t("navigation.footer.aboutUs"),
      href: localePath(locale, "/about-us"),
    },
    {
      id: "cooperation",
      label: t("navigation.burger.cooperation"),
      href: localePath(locale, "/cooperation"),
    },
    {
      id: "payment-delivery",
      label: t("navigation.footer.paymentDelivery"),
      href: localePath(locale, "/payment-delivery"),
    },
    {
      id: "warranty-returns",
      label: t("navigation.footer.warrantyReturns"),
      href: localePath(locale, "/warranty-returns"),
    },
    {
      id: "contacts",
      label: t("navigation.header.contacts"),
      href: localePath(locale, "/contacts"),
    },
  ],
});
