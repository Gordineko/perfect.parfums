"use client";

import { sortCategoriesBySort } from "@features/catalog-filter";
import { categoryTreeItemHref } from "@shared/lib/categoryTreeHref";
import { useI18n } from "@shared/i18n/use-i18n";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import styles from "./Header.module.scss";

const CLOSE_DELAY_MS = 180;

function categoryKey(cat) {
  if (!cat || typeof cat !== "object") return "";
  if (cat._id != null) return String(cat._id);
  if (cat.id != null) return String(cat.id);
  if (cat.slug != null) return String(cat.slug);
  return "";
}

function categoryTitle(cat, locale) {
  return (
    cat?.title?.[locale] ??
    cat?.title?.ua ??
    cat?.title?.uk ??
    cat?.title?.en ??
    cat?.slug ??
    ""
  );
}

export default function HeaderCategoryNav({ locale, categories }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [openId, setOpenId] = useState(null);
  const closeTimerRef = useRef(null);

  const roots = useMemo(() => {
    const raw = Array.isArray(categories?.items)
      ? categories.items
      : Array.isArray(categories)
        ? categories
        : [];
    return sortCategoriesBySort(raw);
  }, [categories]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenId(null);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const openWith = useCallback(
    (id) => {
      clearCloseTimer();
      setOpenId(id);
    },
    [clearCloseTimer],
  );

  if (roots.length === 0) return null;

  return (
    <nav
      className={styles.categoryNav}
      aria-label={t("header.categoryNavAria")}
      onMouseLeave={scheduleClose}
    >
      <div className="container">
        <ul className={styles.categoryList}>
          {roots.map((cat) => {
            const href = categoryTreeItemHref(locale, cat);
            const title = categoryTitle(cat, locale);
            const key = categoryKey(cat) || title;
            const children = Array.isArray(cat?.children) ? cat.children : [];
            const hasChildren = children.length > 0;
            const isActive =
              typeof pathname === "string" &&
              (pathname === href || pathname.startsWith(`${href}/`));
            const isOpen = hasChildren && openId === key;

            return (
              <li
                key={key}
                className={styles.categoryItem}
                onMouseEnter={() =>
                  hasChildren ? openWith(key) : setOpenId(null)
                }
                onFocus={() =>
                  hasChildren ? openWith(key) : setOpenId(null)
                }
              >
                <Link
                  href={href}
                  className={clsx(
                    styles.categoryLink,
                    isActive && styles.categoryLinkActive,
                  )}
                  aria-haspopup={hasChildren ? "true" : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                >
                  {title}
                </Link>

                {hasChildren ? (
                  <div
                    className={clsx(
                      styles.categoryDropdown,
                      isOpen && styles.categoryDropdownOpen,
                    )}
                    onMouseEnter={clearCloseTimer}
                    onMouseLeave={scheduleClose}
                    aria-hidden={!isOpen}
                  >
                    <ul className={styles.categorySubList}>
                      {sortCategoriesBySort(children).map((child) => {
                        const childHref = categoryTreeItemHref(locale, child);
                        const childTitle = categoryTitle(child, locale);
                        return (
                          <li key={categoryKey(child) || childTitle}>
                            <Link
                              href={childHref}
                              className={styles.categorySubLink}
                            >
                              {childTitle}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
