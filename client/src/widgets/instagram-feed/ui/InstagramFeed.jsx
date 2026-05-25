"use client";

import { useI18n } from "@shared";
import Image from "next/image";
import { useId } from "react";

import {
  INSTAGRAM_FEED_IMAGES,
  INSTAGRAM_PROFILE_URL,
} from "../model/instagramFeedImages";
import styles from "./InstagramFeed.module.scss";

export default function InstagramFeed() {
  const sectionId = useId();
  const { t } = useI18n();

  return (
    <section className={styles.root} aria-labelledby={sectionId}>
      <div className={`ds-container ${styles.inner}`}>
        <header className={styles.header}>
          <h2 className={styles.title} id={sectionId}>
            {t("instagramFeed.title")}
          </h2>
          <a
            className={styles.username}
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("instagramFeed.profileAria")}
          >
            {t("instagramFeed.username")}
          </a>
        </header>

        <ul className={styles.grid}>
          {INSTAGRAM_FEED_IMAGES.map((image, index) => (
            <li key={image.id} className={styles.item}>
              <a
                className={styles.card}
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("instagramFeed.postAria", { n: index + 1 })}
              >
                <Image
                  className={styles.image}
                  src={image.src}
                  alt={t("instagramFeed.imageAlt", { n: index + 1 })}
                  fill
                  sizes="(max-width: 767.98px) 50vw, (max-width: 1249.98px) 25vw, 25vw"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
