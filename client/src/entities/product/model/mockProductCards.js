import { PRODUCT_CARD_VOLUME_OPTIONS } from "./productCardVolumeOptions";

export const MOCK_PRODUCT_CARDS = [
  {
    _id: "product-mock-1",
    slug: "this-is-her",
    title: { ua: "This Is Her!", en: "This Is Her!" },
    brand: "Zadig & Voltaire",
    imageURL: "/img/product-placeholder.png",
    rating: 4,
    pricing: { min: "239", currency: "UAH" },
    offers: [
      {
        _id: "offer-mock-1",
        effectivePrice: 239,
        price: 239,
        stocks: [{ onHand: 12 }],
      },
    ],
  },
  {
    _id: "product-mock-2",
    slug: "good-girl",
    title: { ua: "Good Girl", en: "Good Girl" },
    brand: "Carolina Herrera",
    imageURL: "/img/product-placeholder.png",
    rating: 5,
    pricing: { min: "389", currency: "UAH" },
    offers: [
      {
        _id: "offer-mock-2",
        effectivePrice: 389,
        price: 389,
        stocks: [{ onHand: 6 }],
      },
    ],
  },
  {
    _id: "product-mock-3",
    slug: "libre",
    title: { ua: "Libre", en: "Libre" },
    brand: "Yves Saint Laurent",
    imageURL: "/img/product-placeholder.png",
    rating: 3,
    pricing: { min: "415", old: "459", currency: "UAH" },
    offers: [
      {
        _id: "offer-mock-3",
        effectivePrice: 415,
        price: 459,
        stocks: [{ onHand: 10 }],
      },
    ],
  },
  {
    _id: "product-mock-4",
    slug: "black-opium",
    title: { ua: "Black Opium", en: "Black Opium" },
    brand: "Yves Saint Laurent",
    imageURL: "/img/product-placeholder.png",
    rating: 4,
    pricing: { min: "298", currency: "UAH" },
    offers: [
      {
        _id: "offer-mock-4",
        effectivePrice: 298,
        price: 298,
        stocks: [{ onHand: 15 }],
      },
    ],
  },
  {
    _id: "product-mock-5",
    slug: "si-passione",
    title: { ua: "Sì Passione", en: "Sì Passione" },
    brand: "Giorgio Armani",
    imageURL: "/img/product-placeholder.png",
    rating: 2,
    pricing: { min: "352", old: "399", currency: "UAH" },
    offers: [
      {
        _id: "offer-mock-5",
        effectivePrice: 352,
        price: 399,
        stocks: [{ onHand: 7 }],
      },
    ],
  },
  {
    _id: "product-mock-6",
    slug: "flowerbomb",
    title: { ua: "Flowerbomb", en: "Flowerbomb" },
    brand: "Viktor & Rolf",
    imageURL: "/img/product-placeholder.png",
    rating: 5,
    pricing: { min: "478", currency: "UAH" },
    offers: [
      {
        _id: "offer-mock-6",
        effectivePrice: 478,
        price: 478,
        stocks: [{ onHand: 5 }],
      },
    ],
  },
  {
    _id: "product-mock-7",
    slug: "this-is-her-2",
    title: { ua: "This Is Her! (2)", en: "This Is Her! (2)" },
    brand: "Zadig & Voltaire",
    imageURL: "/img/product-placeholder.png",
    rating: 4.5,
    pricing: { min: "239", currency: "UAH" },
    offers: [
      {
        _id: "offer-mock-7",
        effectivePrice: 239,
        price: 239,
        stocks: [{ onHand: 12 }],
      },
    ],
  },
  {
    _id: "product-mock-8",
    slug: "good-girl-2",
    title: { ua: "Good Girl (2)", en: "Good Girl (2)" },
    brand: "Carolina Herrera",
    imageURL: "/img/product-placeholder.png",
    rating: 5,
    pricing: { min: "389", currency: "UAH" },
    offers: [
      {
        _id: "offer-mock-8",
        effectivePrice: 389,
        price: 389,
        stocks: [{ onHand: 6 }],
      },
    ],
  },
];

export { PRODUCT_CARD_VOLUME_OPTIONS };
