"use client";

import "swiper/css";

import { BREAKPOINTS, useI18n } from "@shared";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import styles from "./SeasonCollections.module.scss";
import { createSlides } from "../config/Slides";

const COLLECTIONS = [
  {
    id: "elegant",
    title: "Elegant",
    label: "LIMITED EDITION",
    image: "/img/collection-elegant.png",
    href: "elegant",
  },
  {
    id: "sport",
    title: "Sport",
    label: "FOR BETTER EXPERIENCE",
    image: "/img/collection-sport.png",
    href: "sport",
  },
  {
    id: "casual",
    title: "Casual",
    label: "SPRING SUMMER '26",
    image: "/img/collection-casual.png",
    href: "casual",
  },
];

function CollectionCard({ collection, locale, viewLookbookLabel }) {
  const imageSrc =
    typeof collection?.image === "string" &&
    collection.image.trim().length > 0
      ? collection.image
      : null;

  return (
    <Link
      href={`/${locale}/categories/${collection.href}`}
      className={styles.card}
    >
      <div className={styles.cardMedia}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={collection.title}
            fill
            sizes="(min-width: 1250px) 484px, (min-width: 768px) 50vw, 50vw"
            className={styles.cardImg}
          />
        ) : null}
        <div className={styles.cardOverlay}>
          <p className={styles.cardLabel}>{collection.label}</p>
          <h3 className={styles.cardTitle}>{collection.title}</h3>
          <span className={styles.cardCta}>{viewLookbookLabel}</span>
        </div>
      </div>
    </Link>
  );
}

export default function SeasonCollections({ locale = "ua", categories }) {
  const { t } = useI18n();
  const [swiper, setSwiper] = useState(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const collections = useMemo(
    () => createSlides(categories, locale),
    [categories, locale],
  );
  console.log(collections, "collections");
  console.log(categories, "categories");
  const slides = useMemo(
    () => [
      ...collections,
      ...collections.map((collection) => ({
        ...collection,
        id: `${collection.id}-repeat`,
      })),
    ],
    [collections],
  );

  const syncNavState = (instance) => {
    setAtStart(instance.isBeginning);
    setAtEnd(instance.isEnd);
  };

  return (
    <section className={styles.root} aria-labelledby="season-collections-title">
      <div className={`ds-container ${styles.inner}`}>
        <div className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{t("home.seasonEyebrow")}</p>
            <h2
              id="season-collections-title"
              className={`${styles.title} t-section-title`}
            >
              {t("home.seasonTitle")}
            </h2>
          </div>

          <div className={styles.sliderNav}>
            <button
              type="button"
              className={styles.control}
              onClick={() => swiper?.slidePrev()}
              disabled={atStart}
              aria-label={t("common.back")}
            >
              <span className={styles.controlArrow}>←</span>
              <span>{t("common.back")}</span>
            </button>
            <button
              type="button"
              className={styles.control}
              onClick={() => swiper?.slideNext()}
              disabled={atEnd}
              aria-label={t("common.next")}
            >
              <span>{t("common.next")}</span>
              <span className={styles.controlArrow}>→</span>
            </button>
          </div>
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <Swiper
          className={styles.swiper}
          slidesPerView={2}
          spaceBetween={16}
          speed={650}
          onSwiper={(instance) => {
            setSwiper(instance);
            syncNavState(instance);
          }}
          onSlideChange={syncNavState}
          onReachBeginning={() => setAtStart(true)}
          onReachEnd={() => setAtEnd(true)}
          onFromEdge={(instance) => {
            setAtStart(instance.isBeginning);
            setAtEnd(instance.isEnd);
          }}
          breakpoints={{
            [BREAKPOINTS.tablet]: {
              slidesPerView: 2.5,
              spaceBetween: 24,
            },
            [BREAKPOINTS.desktop]: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
          }}
        >
          {slides.map((collection) => (
            <SwiperSlide key={collection.id}>
              <CollectionCard
                collection={collection}
                locale={locale}
                viewLookbookLabel={t("home.viewLookbook")}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
