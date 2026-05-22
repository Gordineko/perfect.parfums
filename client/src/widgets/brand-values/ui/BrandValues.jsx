"use client";

import { useI18n } from "@shared";
import { useId } from "react";

import styles from "./BrandValues.module.scss";

const PILLARS = [
  {
    id: "care",
    titleKey: "catalog.brandValuesCareTitle",
    labelKey: "catalog.brandValuesCareLabel",
  },
  {
    id: "linen",
    titleKey: "catalog.brandValuesLinenTitle",
    labelKey: "catalog.brandValuesLinenLabel",
  },
  {
    id: "eco",
    titleKey: "catalog.brandValuesEcoTitle",
    labelKey: "catalog.brandValuesEcoLabel",
  },
];

export default function BrandValues() {
  const sectionId = useId();
  const { t } = useI18n();

  return (
    <section
      className={styles.root}
      aria-labelledby={sectionId}
    >
      <div className={`ds-container ${styles.inner}`}>
        <div className={styles.intro}>
          <blockquote className={styles.quote}>
            <p className={styles.quoteText} id={sectionId}>
              {t("catalog.brandValuesQuote")}
            </p>
          </blockquote>
          <p className={styles.statement}>
            {t("catalog.brandValuesStatement")}
          </p>
        </div>

        <div className={styles.pillarsBlock}>
          <hr className={styles.divider} />

          <ul className={styles.pillars}>
            {PILLARS.map(({ id, titleKey, labelKey }) => (
              <li key={id} className={styles.pillar}>
                <h3 className={styles.pillarTitle}>{t(titleKey)}</h3>
                <p className={styles.pillarLabel}>{t(labelKey)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
