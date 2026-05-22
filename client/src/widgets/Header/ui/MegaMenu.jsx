"use client";

import Image from "next/image";
import Link from "next/link";

import {
  BOYS_MEGA_MENU,
  COLLECTION_MEGA_ITEMS,
  GIRLS_MEGA_MENU,
  MEGA_MENU_IDS,
  megaMenuCategoryHref,
  pickLocalizedText,
} from "../config/megaMenuConfig";
import { createSlides } from "../../season-collections/config/Slides";

import styles from "./MegaMenu.module.scss";

const CATALOG_CONFIG = {
  [MEGA_MENU_IDS.GIRLS]: GIRLS_MEGA_MENU,
  [MEGA_MENU_IDS.BOYS]: BOYS_MEGA_MENU,
};

function MegaMenuColumn({ title, children }) {
  return (
    <div>
      <p className={styles.columnTitle}>{title}</p>
      <ul className={styles.linkList}>{children}</ul>
    </div>
  );
}

function MegaMenuLink({ href, children, onNavigate }) {
  return (
    <li>
      <Link href={href} className={styles.menuLink} onClick={onNavigate}>
        {children}
      </Link>
    </li>
  );
}

function CatalogMegaMenu({ locale, config, columnTitles, onNavigate }) {
  const { categories, byAge, banner } = config;

  return (
    <div className={styles.catalogPanel}>
      <div className={styles.catalogMain}>
        <MegaMenuColumn title={columnTitles.categories}>
          {categories.map((item) => (
            <MegaMenuLink
              key={item.id}
              href={megaMenuCategoryHref(locale, item.href)}
              onNavigate={onNavigate}
            >
              {pickLocalizedText(item.label, locale)}
            </MegaMenuLink>
          ))}
        </MegaMenuColumn>

        <MegaMenuColumn title={columnTitles.byAge}>
          {byAge.map((item) => (
            <MegaMenuLink
              key={item.id}
              href={megaMenuCategoryHref(locale, item.href)}
              onNavigate={onNavigate}
            >
              {pickLocalizedText(item.label, locale)}
            </MegaMenuLink>
          ))}
        </MegaMenuColumn>
      </div>

      {banner ? (
        <Link
          href={megaMenuCategoryHref(locale, banner.href)}
          className={styles.banner}
          onClick={onNavigate}
        >
          <div className={styles.bannerMedia}>
            <Image
              src={banner.image}
              alt={pickLocalizedText(banner.caption, locale)}
              fill
              sizes="(min-width: 1250px) 320px, 40vw"
              className={styles.bannerImg}
            />
          </div>
          <p className={styles.bannerCaption}>
            {pickLocalizedText(banner.caption, locale)}
          </p>
        </Link>
      ) : null}
    </div>
  );
}

function CollectionsMegaMenu({ locale, categories, onNavigate }) {
  const dynamicItems = createSlides(categories, locale);
  const items = dynamicItems.length
    ? dynamicItems
    : COLLECTION_MEGA_ITEMS;

  return (
    <ul className={styles.collectionsGrid}>
      {items.map((item) => {
        const title =
          typeof item.title === "string"
            ? item.title
            : pickLocalizedText(item.title, locale);
        const imageSrc =
          typeof item.image === "string" && item.image.trim().length > 0
            ? item.image
            : null;

        return (
        <li key={item.id}>
          <Link
            href={megaMenuCategoryHref(locale, item.href)}
            className={styles.collectionCard}
            onClick={onNavigate}
          >
            <div className={styles.collectionMedia}>
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={title}
                  fill
                  sizes="(min-width: 1250px) 280px, 25vw"
                  className={styles.collectionImg}
                />
              ) : null}
            </div>
            <p className={styles.collectionTitle}>
              {title}
            </p>
          </Link>
        </li>
        );
      })}
    </ul>
  );
}

function MegaMenuContent({ variant, locale, categories, columnTitles, onNavigate }) {
  if (variant === MEGA_MENU_IDS.COLLECTIONS) {
    return (
      <CollectionsMegaMenu
        locale={locale}
        categories={categories}
        onNavigate={onNavigate}
      />
    );
  }

  const catalogConfig = CATALOG_CONFIG[variant];
  if (!catalogConfig) return null;

  return (
    <CatalogMegaMenu
      locale={locale}
      config={catalogConfig}
      columnTitles={columnTitles}
      onNavigate={onNavigate}
    />
  );
}

export default function MegaMenu(props) {
  
  return (
    <div className={styles.panel}>
      <div className={styles.panelInner}>
        <MegaMenuContent {...props} />
      </div>
    </div>
  );
}
