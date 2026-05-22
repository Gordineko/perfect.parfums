import {
  createI18nServer,
  getMessages,
  getProductBySlug,
  resolveCatalogGroupSlugParam,
} from "@shared";
import { ProductPdpSkeleton } from "@widgets/product-pdp";
import { Suspense } from "react";

import ProductPdpPageContent from "./ProductPdpPageContent";

function pickSeoText(map, locale) {
  if (map == null) return "";
  if (typeof map === "string") return map.trim();
  if (typeof map !== "object") return "";
  return (
    map[locale] ??
    map.ua ??
    map.uk ??
    map.en ??
    ""
  );
}

export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  const groupSlug = resolveCatalogGroupSlugParam(slug);
  const data = await getProductBySlug(groupSlug);
  const item = data?.item;

  if (!item) {
    return {
      title: "Товар",
      description: "",
    };
  }

  const seo = item.seo ?? {};
  const title = pickSeoText(seo.title, locale) || pickSeoText(item.title, locale) || "Товар";
  const description =
    pickSeoText(seo.description, locale) ||
    pickSeoText(item.description, locale) ||
    "";

  const keywords = Array.isArray(seo.keywords)
    ? seo.keywords.filter(Boolean).join(", ")
    : typeof seo.keywords === "string"
      ? seo.keywords
      : undefined;

  return {
    title: String(title).trim() || "Товар",
    description: String(description).trim(),
    ...(keywords ? { keywords } : {}),
  };
}

export default async function ProductPage({ params }) {
  const { locale = "ua" } = await params;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const pdpSkeletonAria = t("pdp.skeletonAria");

  return (
    <Suspense
      fallback={
        <div className="pdp-page">
          <div className="container">
            <ProductPdpSkeleton busyAriaLabel={pdpSkeletonAria} />
          </div>
        </div>
      }
    >
      <ProductPdpPageContent params={params} />
    </Suspense>
  );
}
