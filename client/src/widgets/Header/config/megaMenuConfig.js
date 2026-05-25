import { localePath } from "@shared/lib/localePath";

const COLLECTION_IMAGE_BASE = "/img";

export const MEGA_MENU_IDS = {
  COLLECTIONS: "collections",
  GIRLS: "girls",
  BOYS: "boys",
};

export const COLLECTION_MEGA_ITEMS = [
  {
    id: "elegant",
    title: { ua: "Elegant Collection", en: "Elegant Collection" },
    image: `${COLLECTION_IMAGE_BASE}/collection-elegant.png`,
    href: "elegant",
  },
  {
    id: "sport",
    title: { ua: "Sport Collection", en: "Sport Collection" },
    image: `${COLLECTION_IMAGE_BASE}/collection-sport.png`,
    href: "sport",
  },
  {
    id: "casual",
    title: { ua: "Casual Collection", en: "Casual Collection" },
    image: `${COLLECTION_IMAGE_BASE}/collection-casual.png`,
    href: "casual",
  },
  {
    id: "elegant-repeat",
    title: { ua: "Elegant Collection", en: "Elegant Collection" },
    image: `${COLLECTION_IMAGE_BASE}/collection-elegant.png`,
    href: "elegant",
  },
];

export const GIRLS_MEGA_MENU = {
  banner: {
    image: "/img/girls-catalog.png",
    caption: { ua: "GIRLS COLLECTION 2026", en: "GIRLS COLLECTION 2026" },
    href: "girls",
  },
  categories: [
    {
      id: "dresses",
      label: { ua: "Плаття та сарафани", en: "Dresses & sundresses" },
      href: "girls/dresses",
    },
    {
      id: "bodysuits",
      label: { ua: "Боді", en: "Bodysuits" },
      href: "girls/bodysuits",
    },
    {
      id: "linen",
      label: { ua: "Лляні комплекти", en: "Linen sets" },
      href: "girls/linen-sets",
    },
    {
      id: "outerwear",
      label: { ua: "Верхній одяг", en: "Outerwear" },
      href: "girls/outerwear",
    },
  ],
  byAge: [
    {
      id: "newborn",
      label: { ua: "Newborn (0-12M)", en: "Newborn (0-12M)" },
      href: "girls/newborn",
    },
    {
      id: "toddler",
      label: { ua: "Toddler (1-3Y)", en: "Toddler (1-3Y)" },
      href: "girls/toddler",
    },
    {
      id: "kids",
      label: { ua: "Kids (3-6Y)", en: "Kids (3-6Y)" },
      href: "girls/kids",
    },
  ],
};

export const BOYS_MEGA_MENU = {
  banner: {
    image: "/img/boys-catalog.png",
    caption: {
      ua: "BOYS COLLECTION 2026",
      en: "BOYS COLLECTION 2026",
    },
    href: "boys",
  },
  categories: [
    {
      id: "shirts",
      label: { ua: "Сорочки", en: "Shirts" },
      href: "boys/shirts",
    },
    {
      id: "pants",
      label: { ua: "Штани", en: "Pants" },
      href: "boys/pants",
    },
    {
      id: "linen",
      label: { ua: "Лляні комплекти", en: "Linen sets" },
      href: "boys/linen-sets",
    },
    {
      id: "outerwear",
      label: { ua: "Верхній одяг", en: "Outerwear" },
      href: "boys/outerwear",
    },
  ],
  byAge: [
    {
      id: "newborn",
      label: { ua: "Newborn (0-12M)", en: "Newborn (0-12M)" },
      href: "boys/newborn",
    },
    {
      id: "toddler",
      label: { ua: "Toddler (1-3Y)", en: "Toddler (1-3Y)" },
      href: "boys/toddler",
    },
    {
      id: "kids",
      label: { ua: "Kids (3-6Y)", en: "Kids (3-6Y)" },
      href: "boys/kids",
    },
  ],
};

export function pickLocalizedText(value, locale) {
  if (!value || typeof value !== "object") return "";
  return (
    value[locale] ??
    value.ua ??
    value.uk ??
    value.en ??
    ""
  );
}

export function megaMenuCategoryHref(locale, href) {
  const path = String(href ?? "").replace(/^\//, "");
  return localePath(locale, `/categories/${path}`);
}
