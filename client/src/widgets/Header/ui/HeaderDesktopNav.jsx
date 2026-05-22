"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MEGA_MENU_IDS } from "../config/megaMenuConfig";

import MegaMenu from "./MegaMenu";
import headerStyles from "./Header.module.scss";
import styles from "./HeaderDesktopNav.module.scss";

const CLOSE_DELAY_MS = 180;
const DESKTOP_NAV_MEDIA = "(min-width: 768px)";

const MEGA_NAV_ITEMS = [
  { id: MEGA_MENU_IDS.GIRLS, labelKey: "girls" },
  { id: MEGA_MENU_IDS.BOYS, labelKey: "boys" },
  { id: MEGA_MENU_IDS.COLLECTIONS, labelKey: "collections" },
];

export default function HeaderDesktopNav({ locale, labels, categories }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isDesktopNav, setIsDesktopNav] = useState(false);
  const closeTimerRef = useRef(null);
  const wrapRef = useRef(null);

  const categoryRoots = useMemo(() => {
    if (Array.isArray(categories?.items)) return categories.items;
    if (Array.isArray(categories)) return categories;
    return [];
  }, [categories]);

  const menuHasChildren = useMemo(() => {
    const out = {};
    for (const item of categoryRoots) {
      const slug = String(item?.slug ?? "").trim().toLowerCase();
      if (!slug) continue;
      out[slug] = Array.isArray(item?.children) && item.children.length > 0;
    }
    return out;
  }, [categoryRoots]);

  const canOpenMenu = useCallback(
    (menuId) => Boolean(menuHasChildren[String(menuId).toLowerCase()]),
    [menuHasChildren],
  );

  const clearCloseTimer = useCallback(() => {
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setOpenMenuId(null);
  }, [clearCloseTimer]);

  const openMenu = useCallback(
    (menuId) => {
      if (!canOpenMenu(menuId)) {
        closeMenu();
        return;
      }
      clearCloseTimer();
      setOpenMenuId(menuId);
    },
    [canOpenMenu, clearCloseTimer, closeMenu],
  );

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenMenuId(null);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const columnTitles = {
    categories: labels.megaCategories,
    byAge: labels.megaByAge,
  };

  useEffect(() => {
    const desktopMq = window.matchMedia(DESKTOP_NAV_MEDIA);

    const syncDesktopNav = () => {
      const enabled = desktopMq.matches;
      setIsDesktopNav(enabled);
      if (!enabled) closeMenu();
    };

    syncDesktopNav();
    desktopMq.addEventListener("change", syncDesktopNav);
    return () => desktopMq.removeEventListener("change", syncDesktopNav);
  }, [closeMenu]);

  useEffect(() => {
    if (openMenuId && !canOpenMenu(openMenuId)) {
      closeMenu();
    }
  }, [canOpenMenu, closeMenu, openMenuId]);

  useEffect(() => {
    if (!isDesktopNav) return undefined;

    const header = wrapRef.current?.closest("header");
    if (!header) return undefined;

    const syncHeaderBottom = () => {
      document.documentElement.style.setProperty(
        "--header-bottom",
        `${header.getBoundingClientRect().bottom}px`,
      );
    };

    syncHeaderBottom();
    window.addEventListener("resize", syncHeaderBottom);
    window.addEventListener("scroll", syncHeaderBottom, { passive: true });

    return () => {
      window.removeEventListener("resize", syncHeaderBottom);
      window.removeEventListener("scroll", syncHeaderBottom);
    };
  }, [isDesktopNav]);

  const handleWrapMouseLeave = useCallback(
    (event) => {
      const dropdown = wrapRef.current?.querySelector("[data-mega-dropdown]");
      const next = event.relatedTarget;
      if (next instanceof Node && dropdown?.contains(next)) return;
      scheduleClose();
    },
    [scheduleClose],
  );

  if (!isDesktopNav) return null;

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      onMouseLeave={handleWrapMouseLeave}
    >
      <nav className={headerStyles.nav} aria-label="Navigation">
        <Link className={headerStyles.link} href={`/${locale}/categories/all?isNew=true`}>
          {labels.new}
        </Link>

        {MEGA_NAV_ITEMS.map(({ id, labelKey }) => {
          const isOpen = openMenuId === id;
          const isEnabled = canOpenMenu(id);
          const isCollections = id === MEGA_MENU_IDS.COLLECTIONS;

          if (!isEnabled) {
            return (
              <Link
                key={id}
                className={clsx(headerStyles.link, styles.trigger)}
                href={`/${locale}/categories/${id}`}
                onMouseEnter={closeMenu}
                onFocus={closeMenu}
              >
                {labels[labelKey]}
              </Link>
            );
          }

          if (isCollections) {
            return (
              <Link
                key={id}
                className={clsx(
                  headerStyles.link,
                  styles.trigger,
                  isOpen && styles.triggerActive,
                )}
                href={`/${locale}/categories/${id}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
                onMouseEnter={() => openMenu(id)}
                onFocus={() => openMenu(id)}
              >
                {labels[labelKey]}
              </Link>
            );
          }

          return (
            <button
              key={id}
              type="button"
              className={clsx(
                headerStyles.link,
                styles.trigger,
                isOpen && styles.triggerActive,
              )}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onMouseEnter={() => openMenu(id)}
              onFocus={() => openMenu(id)}
            >
              {labels[labelKey]}
            </button>
          );
        })}
      </nav>

      <div
        data-mega-dropdown
        className={clsx(styles.dropdown, openMenuId && styles.dropdownOpen)}
        onMouseEnter={clearCloseTimer}
        aria-hidden={!openMenuId}
      >
        <div className={styles.dropdownBridge} aria-hidden />
        {openMenuId ? (
          <MegaMenu
          categories={categories}
            variant={openMenuId}
            locale={locale}
            columnTitles={columnTitles}
            onNavigate={closeMenu}
          />
        ) : null}
      </div>
    </div>
  );
}
