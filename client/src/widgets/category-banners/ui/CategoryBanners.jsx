"use client";

import { useI18n } from "@shared/i18n/use-i18n";
import Image from "next/image";
import Link from "next/link";

import styles from "./CategoryBanners.module.scss";

const BANNER_IDS = [
  { id: "girls", titleKey: "navigation.header.girls", href: "girls" },
  { id: "boys", titleKey: "navigation.header.boys", href: "boys" },
];

const BANNER_IMAGES = {
  girls: "/img/girls-catalog.png",
  boys: "/img/boys-catalog.png",
};

export default function CategoryBanners({ locale = "ua" }) {
  const { t } = useI18n();

  return (
    <section
      className={styles.root}
      aria-label={t("home.categorySectionAria")}
    >
      <div className={`ds-container ${styles.inner}`}>
        {BANNER_IDS.map((banner) => (
          <Link
            key={banner.id}
            href={`/${locale}/categories/${banner.href}`}
            className={styles.card}
          >
            <Image
              src={BANNER_IMAGES[banner.id]}
              alt={t(banner.titleKey)}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className={styles.image}
            />
            <div className={styles.overlay}>
              <h2 className={styles.title}>{t(banner.titleKey)}</h2>
              <span className={styles.cta}>{t("home.goToCatalog")}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
