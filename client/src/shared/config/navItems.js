export const getLocalizedNavigation = (
  t,
  locale,
) => ({
  headerNavItems: [
    {
      id: "catalog",
      label: t("navigation.header.catalog"),
      href: `/${locale}/categories/all`,
    },
    {
      id: "about",
      label: t("navigation.header.about"),
      href: `/${locale}/about-us`,
    },
    {
      id: "content",
      label: t("navigation.header.content"),
      href: `/${locale}/content`,
    },
    {
      id: "principles",
      label: t("navigation.header.principles"),
      href: `/${locale}/principles`,
    },
    {
      id: "contacts",
      label: t("navigation.header.contacts"),
      href: `/${locale}/contacts`,
    },
  ],

  footerNavItems: [
    {
      id: "catalog",
      label: t("navigation.footer.catalog"),
      href: `/${locale}/categories/all`,
    },
    {
      id: "about-us",
      label: t("navigation.footer.aboutUs"),
      href: `/${locale}/about-us`,
    },
    {
      id: "laboratory",
      label: t("navigation.footer.laboratory"),
      href: `/${locale}/laboratory`,
    },
    {
      id: "library",
      label: t("navigation.footer.library"),
      href: `/${locale}/library`,
    },
    {
      id: "payment-delivery",
      label: t(
        "navigation.footer.paymentDelivery",
      ),
      href: `/${locale}/payment-delivery`,
    },
    {
      id: "warranty-returns",
      label: t(
        "navigation.footer.warrantyReturns",
      ),
      href: `/${locale}/warranty-returns`,
    },
  ],

  burgerNavItems: [
    {
      id: "about-us",
      label: t("navigation.footer.aboutUs"),
      href: `/${locale}/about-us`,
    },
    {
      id: "cooperation",
      label: t("navigation.burger.cooperation"),
      href: `/${locale}/cooperation`,
    },
    {
      id: "payment-delivery",
      label: t("navigation.footer.paymentDelivery"),
      href: `/${locale}/payment-delivery`,
    },
    {
      id: "warranty-returns",
      label: t("navigation.footer.warrantyReturns"),
      href: `/${locale}/warranty-returns`,
    },
    {
      id: "contacts",
      label: t("navigation.header.contacts"),
      href: `/${locale}/contacts`,
    },
  ],
});
