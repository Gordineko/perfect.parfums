"use client";

import { useI18n } from "@shared";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import styles from "./NotFoundPage.module.scss";

const NOT_FOUND_PAGE_CLASS = "is-not-found-page";
const NOT_FOUND_BG = "#f0efed";

export default function NotFoundPage({ locale: localeFromServer }) {
  const params = useParams();
  const locale = localeFromServer ?? params?.locale ?? "ua";
  const { t } = useI18n();

  useEffect(() => {
    document.documentElement.classList.add(NOT_FOUND_PAGE_CLASS);
    const main = document.querySelector("main");
    const previousMainBackground = main?.style.background ?? "";

    if (main) {
      main.style.background = NOT_FOUND_BG;
    }

    return () => {
      document.documentElement.classList.remove(NOT_FOUND_PAGE_CLASS);

      if (main) {
        main.style.background = previousMainBackground;
      }
    };
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.inner}>
          <p className={styles.code} aria-hidden="true">
            404
          </p>

          <p className={styles.eyebrow}>
            {t("notFound.eyebrow")}
          </p>

          <h1 className={styles.title}>
            {t("notFound.title")}
          </h1>

          <p className={styles.desc}>
            {t("notFound.description")}
          </p>

          <div className={styles.actions}>
            <Link href={`/${locale}`} className={styles.ctaPrimary}>
              {t("notFound.ctaHome")}
            </Link>
            <Link
              href={`/${locale}/categories/new`}
              className={styles.ctaSecondary}
            >
              {t("notFound.ctaCatalog")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
