export const getLocalizedHeroSlides = (t) => [
  {
    id: "main",
    image: "/img/hero-1.jpg",
    title: t("hero.slides.main.title"),
    lines: t("hero.slides.main.lines"),
  },
  {
    id: "main2",
    image: "/img/hero-1.jpg",
    title: t("hero.slides.main.title"),
    lines: t("hero.slides.main.lines"),
  },
  {
    id: "main3",
    image: "/img/hero-1.jpg",
    title: t("hero.slides.main.title"),
    lines: t("hero.slides.main.lines"),
  },
];

// на потом
//  const HERO_SLIDES_BASE = [
//   { id: "main", image: "/img/hero-1.jpg" },
//   { id: "second", image: "/img/hero-2.jpg" },
// ];

// export const getLocalizedHeroSlides = (t) =>
//   HERO_SLIDES_BASE.map(({ id, image }) => ({
//     id,
//     image,
//     title: t(`hero.slides.${id}.title`),
//     lines: t(`hero.slides.${id}.lines`),
//   }));
