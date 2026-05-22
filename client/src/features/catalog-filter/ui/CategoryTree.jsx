"use client";

import { categoryNodeFullSlug, categoryTreeItemHref } from "@shared";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  categoryNodeProductCount,
  findCategoryAncestorChainBySlug,
  resolveCategoryFacetCount,
  sortCategoriesBySort,
} from "../lib/categoryTreeFlatten";
import { FilterAccordionChevron } from "./FilterAccordionChevron";

function categoryStableKey(cat) {
  if (!cat || typeof cat !== "object") {
    return "";
  }
  if (cat._id != null) {
    return String(cat._id);
  }
  if (cat.slug != null) {
    return String(cat.slug);
  }
  return categoryNodeFullSlug(cat) || "";
}

export default function CategoryTree({
  locale,
  roots,
  filters,
  routeCategoryPath,
  onNavigate,
  sectionTitle,
}) {
  const autoOpenIds = useMemo(() => {
    const chain = findCategoryAncestorChainBySlug(
      roots,
      routeCategoryPath,
    );
    const next = new Set();
    if (chain && chain.length > 1) {
      for (let i = 0; i < chain.length - 1; i++) {
        const id = categoryStableKey(chain[i]);
        if (id) {
          next.add(id);
        }
      }
    }
    return next;
  }, [roots, routeCategoryPath]);

  const [openOverride, setOpenOverride] = useState({});

  useEffect(() => {
    setOpenOverride({});
  }, [routeCategoryPath]);

  const isBranchOpen = (cat) => {
    const key = categoryStableKey(cat);
    if (!key) {
      return false;
    }
    if (openOverride[key] !== undefined) {
      return openOverride[key];
    }
    return autoOpenIds.has(key);
  };

  const toggleBranch = (cat) => {
    const key = categoryStableKey(cat);
    if (!key) {
      return;
    }
    setOpenOverride((prev) => {
      const cur =
        prev[key] !== undefined
          ? prev[key]
          : autoOpenIds.has(key);
      return { ...prev, [key]: !cur };
    });
  };

  const renderNodes = (nodes) => {
    const sorted = sortCategoriesBySort(nodes || []);
    return sorted.map((cat) => {
      const key = cat._id ?? cat.slug ?? categoryNodeFullSlug(cat);
      const title =
        cat?.title?.[locale] ??
        cat?.title?.ua ??
        cat?.slug ??
        "";
      const facetCount = resolveCategoryFacetCount(filters, cat._id);
      const fallback = categoryNodeProductCount(cat);
      const n =
        facetCount != null
          ? facetCount
          : fallback != null
            ? Number(fallback)
            : null;
      const countDisplay =
        n != null && Number.isFinite(n)
          ? Math.max(0, Math.round(n))
          : null;
      const href = categoryTreeItemHref(locale, cat);
      const fs = categoryNodeFullSlug(cat);
      const isActive =
        Boolean(fs) &&
        routeCategoryPath &&
        routeCategoryPath !== "all" &&
        fs === routeCategoryPath;
      const rawChildren = cat.children;
      const children = Array.isArray(rawChildren)
        ? rawChildren
        : [];
      const hasChildren = children.length > 0;

      return (
        <li key={key} className="filters__category-node">
          {hasChildren ? (
            <>
              <div className="filters__category-row">
                <button
                  type="button"
                  className="filters__category-toggle"
                  aria-expanded={isBranchOpen(cat)}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleBranch(cat);
                  }}
                  aria-label={title}
                >
                  <FilterAccordionChevron
                    className={
                      isBranchOpen(cat)
                        ? "filters__category-toggle-chevron filters__category-toggle-chevron--open"
                        : "filters__category-toggle-chevron"
                    }
                  />
                </button>
                <Link
                  href={href}
                  className={
                    isActive
                      ? "filters__category-link filters__category-link--active"
                      : "filters__category-link"
                  }
                  onClick={() => onNavigate?.()}
                >
                  <span className="filters__category-link-title">
                    {title}
                  </span>
                  {countDisplay != null ? (
                    <span className="filters__category-link-count">
                      {` (${countDisplay})`}
                    </span>
                  ) : null}
                </Link>
              </div>
              {isBranchOpen(cat) ? (
                <ul className="filters__category-tree-nested">
                  {renderNodes(children)}
                </ul>
              ) : null}
            </>
          ) : (
            <Link
              href={href}
              className={
                isActive
                  ? "filters__category-link filters__category-link--active filters__category-link--leaf"
                  : "filters__category-link filters__category-link--leaf"
              }
              onClick={() => onNavigate?.()}
            >
              <span className="filters__category-link-title">
                {title}
              </span>
              {countDisplay != null ? (
                <span className="filters__category-link-count">
                  {` (${countDisplay})`}
                </span>
              ) : null}
            </Link>
          )}
        </li>
      );
    });
  };

  return (
    <nav
      className="filters__category-tree-wrap"
      aria-label={sectionTitle || "Categories"}
    >
      <ul className="filters__category-tree">{renderNodes(roots)}</ul>
    </nav>
  );
}
