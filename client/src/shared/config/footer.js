export const getLocalizedFooter = (t) => ({
  contacts: {
    title: t("footer.contacts.title"),
    showroomLabel: t("footer.contacts.showroomLabel"),
    showroomAddress: t("footer.contacts.showroomAddress"),
    phoneLabel: t("footer.contacts.phoneLabel"),
    phone: t("footer.contacts.phone"),
    scheduleLabel: t("footer.contacts.scheduleLabel"),
    scheduleValue: t("footer.contacts.scheduleValue"),
  },

  information: {
    title: t("footer.information.title"),
    items: [
      {
        id: "payment",
        label: t("footer.information.paymentDelivery"),
        href: "/payment-delivery",
      },
      {
        id: "offer",
        label: t("footer.information.publicOffer"),
        href: "/payment-delivery",
      },
      {
        id: "privacy",
        label: t("footer.information.privacy"),
        href: "/about-us",
      },
      {
        id: "delivery",
        label: t("footer.information.deliveryReturns"),
        href: "/warranty-returns",
      },
    ],
  },

  brand: {
    perfect: t("footer.brand.perfect"),
    parfums: t("footer.brand.parfums"),
  },
});
