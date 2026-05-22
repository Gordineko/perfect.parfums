export const getLocalizedFooter = (t) => ({
  description: t("footer.description"),

  columns: [
    {
      id: "catalog",
      title: t("footer.catalogColumn"),
      items: [
        {
          id: "new",
          label: t("footer.navNew"),
          href: "/categories/all?isNew=true",
        },
        {
          id: "sale",
          label: t("footer.navSale"),
          href: "/categories/all?isSale=true",
        },
        {
          id: "girls",
          label: t("footer.navGirls"),
          href: "/categories/girls",
        },
        {
          id: "boys",
          label: t("footer.navBoys"),
          href: "/categories/boys",
        },
      ],
    },
    {
      id: "company",
      title: t("footer.companyColumn"),
      items: [
        {
          id: "about",
          label: t("navigation.footer.aboutUs"),
          href: "/about-us",
        },
        {
          id: "payment",
          label: t("navigation.footer.paymentDelivery"),
          href: "/payment-delivery",
        },
        {
          id: "warranty",
          label: t("navigation.footer.warrantyReturns"),
          href: "/warranty-returns",
        },
        {
          id: "contacts",
          label: t("navigation.header.contacts"),
          href: "/contacts",
        },
      ],
    },
  ],

  contacts: {
    title: t("footer.contactColumn"),
    email: t("footer.contacts.email"),
    phone: t("footer.contacts.phone"),
    callbackText: t("footer.contacts.callback"),
  },

  bottom: {
    copyright: t("footer.bottom.copyright"),
    offer: t("footer.bottom.offer"),
    privacy: t("footer.bottom.privacy"),
    madeBy: t("footer.bottom.madeBy"),
  },
});
