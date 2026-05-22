import {
  createI18nServer,
  getLocalizedHeroSlides,
  getMessages,
  HOME_BANNER_FALLBACK,
} from "@shared";
import Hero from "@widgets/hero";

function pickLocalized(value, locale) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const loc = locale === "en" ? "en" : "ua";
    const raw = value[loc] ?? value.ua ?? value.en ?? "";
    return typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
  }
  return String(value).trim();
}

function normalizeLink(link) {
  if (typeof link !== "string") return "";
  return link.trim();
}

function buildSlidesFromApi(items, baseSlides, locale) {
  const sorted = [...items].sort(
    (a, b) => Number(a?.position ?? 0) - Number(b?.position ?? 0),
  );

  // Pass all API fields through, add id if missing
  return sorted.map((b, i) => ({
    ...b,
    id: String(b?._id ?? `banner-${i}`),
  }));
}

function buildFallbackSlides(baseSlides) {
  return baseSlides.map((s) => ({
    ...s,
    imageURL: HOME_BANNER_FALLBACK,
    mobileImageURL: HOME_BANNER_FALLBACK,
    videoURL: "",
    mobileVideoURL: "",
    link: "",
  }));
}

export default async function HeroServerBlock({ locale, banners = [] }) {
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const baseSlides = getLocalizedHeroSlides(t);

  const slides =
    Array.isArray(banners) && banners.length > 0
      ? buildSlidesFromApi(banners, baseSlides, locale)
      : buildFallbackSlides(baseSlides);

  return (
    <Hero
      slides={slides}
      heroCta={t("home.heroCta")}
      heroFallbackTitle={t("home.heroFallbackTitle")}
    />
  );
}
