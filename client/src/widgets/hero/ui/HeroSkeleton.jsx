"use client";

import { useI18n } from "@shared/i18n/use-i18n";

import styles from "./Hero.module.scss";

export default function HeroSkeleton() {
  const { t } = useI18n();

  return (
    <section
      className={`${styles.root} ${styles.skeleton}`}
      aria-busy="true"
      aria-label={t("aria.heroLoading")}
    >
      <div className={styles.overlay}>
        <div className={`ds-container ${styles.content}`}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonBtn} />
        </div>
      </div>
    </section>
  );
}
