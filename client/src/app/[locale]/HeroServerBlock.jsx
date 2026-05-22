import { createI18nServer, getMessages } from "@shared";
import Hero from "@widgets/hero";

export default async function HeroServerBlock({ locale }) {
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  return (
    <Hero
      locale={locale}
      mainImage="/img/hero-perfume-main.png"
      secondaryImage="/img/hero-perfume-secondary.png"
      eyebrow={t("hero.banner.eyebrow")}
      line1={t("hero.banner.line1")}
      line2={t("hero.banner.line2")}
      ctaLabel={t("home.heroCta")}
      catalogHref={`/${locale}/categories/all`}
    />
  );
}
