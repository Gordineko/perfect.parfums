"use client";

import { localePath } from "@shared/lib/localePath";
import { useI18n } from "@shared";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import styles from "./NotFoundPage.module.scss";
import NotFoundCtaOrnament from "./NotFoundCtaOrnament";
import NotFoundOrnament from "./NotFoundOrnament";
import NotFoundTitleOrnament from "./NotFoundTitleOrnament";

const NOT_FOUND_PAGE_CLASS = "is-not-found-page";

export default function NotFoundPage({ locale: localeFromServer }) {
  const params = useParams();
  const locale = localeFromServer ?? params?.locale ?? "ua";
  const { t } = useI18n();

  useEffect(() => {
    document.documentElement.classList.add(NOT_FOUND_PAGE_CLASS);

    return () => {
      document.documentElement.classList.remove(NOT_FOUND_PAGE_CLASS);
    };
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.ornament}>
        <NotFoundOrnament />
      </div>

      <div className={styles.content}>
        <p className={styles.code} aria-hidden="true">
          404
        </p>

        <h1 className={styles.title}>{t("notFound.title")}</h1>

        <div className={styles.titleOrnament}>
          <NotFoundTitleOrnament />
        </div>

        <p className={styles.desc}>{t("notFound.description")}</p>

        <Link href={localePath(locale)} className={styles.cta}>
          {t("notFound.ctaHome")}
        </Link>
      </div>

      <div className={styles.ctaOrnament}>
        <NotFoundCtaOrnament />
      </div>
    </section>
  );
}
