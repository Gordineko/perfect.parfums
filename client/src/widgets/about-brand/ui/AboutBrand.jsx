"use client";

import { localePath, useI18n } from "@shared";
import Image from "next/image";
import Link from "next/link";
import { useId } from "react";

import styles from "./AboutBrand.module.scss";

const ABOUT_BRAND_IMAGE = "/img/about-brand.jpg";

export default function AboutBrand() {
  const sectionId = useId();
  const { locale, t } = useI18n();
  const aboutUsHref = localePath(locale, "/about-us");

  return (
    <section className={styles.root} aria-labelledby={sectionId}>
      <div className={styles.layout}>
        <div className={styles.contentColumn}>
          <div className={styles.content}>
            <h2 className={styles.title} id={sectionId}>
              {t("aboutBrand.title")}
            </h2>

            <div className={styles.textBlock}>
              <p className={styles.lead}>
                <Link
                  className={styles.brandLink}
                  href={aboutUsHref}
                  aria-label={t("aboutBrand.brandLinkAria")}
                >
                  {t("aboutBrand.brandName")}
                </Link>
                {t("aboutBrand.leadSuffix")}
              </p>
              <p className={styles.paragraph}>{t("aboutBrand.paragraph2")}</p>
              <p className={styles.paragraph}>{t("aboutBrand.paragraph3")}</p>
            </div>
          </div>
        </div>

        <div className={styles.imageWrap}>
          <Image
            className={styles.image}
            src={ABOUT_BRAND_IMAGE}
            alt={t("aboutBrand.imageAlt")}
            width={720}
            height={720}
            sizes="(max-width: 767.98px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
