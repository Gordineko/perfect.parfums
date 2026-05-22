"use client";

import { sortCategoriesBySort } from "@features/catalog-filter";
import { categoryTreeItemHref } from "@shared/lib/categoryTreeHref";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

function stableKey(cat) {
  if (!cat || typeof cat !== "object") return "";
  if (cat._id != null) return String(cat._id);
  if (cat.id != null) return String(cat.id);
  if (cat.slug != null) return String(cat.slug);
  return "";
}

function titleFor(cat, locale) {
  return (
    cat?.title?.[locale] ??
    cat?.title?.ua ??
    cat?.title?.uk ??
    cat?.title?.en ??
    cat?.slug ??
    ""
  );
}

function Chevron({ open }) {
  return (
    <svg
      className={open ? "burger-catalog__chevron is-open" : "burger-catalog__chevron"}
      width="11"
      height="7"
      viewBox="0 0 11 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0.664551 5.33789L5.16455 1.33789L9.66455 5.33789"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function Node({ cat, locale, depth, openMap, onToggle, onNavigate }) {
  const children = Array.isArray(cat?.children) ? cat.children : [];
  const hasChildren = children.length > 0;
  const key = stableKey(cat);
  const isOpen = Boolean(openMap[key]);
  const href = categoryTreeItemHref(locale, cat);
  const title = titleFor(cat, locale);

  return (
    <li className="burger-catalog__node" data-depth={depth}>
      <div className="burger-catalog__row">
        {hasChildren ? (
          <button
            type="button"
            className="burger-catalog__toggle"
            aria-expanded={isOpen ? "true" : "false"}
            aria-label={title}
            onClick={(e) => {
              e.preventDefault();
              onToggle(key);
            }}
          >
            <Chevron open={isOpen} />
          </button>
        ) : (
          <span className="burger-catalog__toggle-spacer" aria-hidden="true" />
        )}

        <Link
          href={href}
          className="burger-catalog__link"
          onClick={() => onNavigate?.()}
        >
          {title}
        </Link>
      </div>

      {hasChildren && isOpen ? (
        <ul className="burger-catalog__list">
          {sortCategoriesBySort(children).map((child) => (
            <Node
              key={stableKey(child) || titleFor(child, locale)}
              cat={child}
              locale={locale}
              depth={depth + 1}
              openMap={openMap}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function BurgerMenuCatalogTree({
  locale = "ua",
  roots = [],
  onNavigate,
}) {
  const sortedRoots = useMemo(
    () => sortCategoriesBySort(Array.isArray(roots) ? roots : []),
    [roots],
  );

  const [openMap, setOpenMap] = useState({});
  const toggle = useCallback((key) => {
    if (!key) return;
    setOpenMap((prev) => ({ ...prev, [key]: !(prev?.[key] ?? false) }));
  }, []);

  return (
    <nav className="burger-catalog" aria-label="Catalog">
      <ul className="burger-catalog__list burger-catalog__list--root">
        {sortedRoots.map((cat) => (
          <Node
            key={stableKey(cat) || titleFor(cat, locale)}
            cat={cat}
            locale={locale}
            depth={0}
            openMap={openMap}
            onToggle={toggle}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}

