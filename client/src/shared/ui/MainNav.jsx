"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { categoryTreeItemHref } from "../lib/categoryTreeHref";
import { isNavLinkActive } from "../lib/isNavLinkActive";
import { useOnClickOutside } from "../lib/useOnClickOutside";

function isCatalogNavItem(item) {
  return item?.id === "catalog";
}

const MainNav = ({
  locale = "ua",
  navItems = [],
  categories,
  catalogTreeRoots,
  catalogDropdown,
  onNavigate,
}) => {
  const pathname = usePathname();

  const handleNavigate = useCallback(() => {
    onNavigate?.();
  }, [onNavigate]);

  if (categories) {
    const limited = (categories.items ?? []).slice(0, 3);
    return (
      <ul className="main-nav">
        {limited.map((item, index) => (
          <li
            key={item._id ?? item.slug ?? index}
            className="main-nav__item"
          >
            <Link
              href={categoryTreeItemHref(locale, item)}
              className="main-nav__button"
              onClick={handleNavigate}
            >
              <p className="main-nav__text">
                {item?.title?.[locale] ??
                  item?.title?.ua ??
                  item?.slug ??
                  ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  const previewRoots = Array.isArray(catalogTreeRoots)
    ? catalogTreeRoots.slice(0, 3)
    : [];

  const desktopCatalogDisabled =
    catalogTreeRoots !== undefined && catalogTreeRoots !== null;

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const catalogLiRef = useRef(null);

  const closeCatalog = useCallback(() => setIsCatalogOpen(false), []);
  const toggleCatalog = useCallback(
    () => setIsCatalogOpen((v) => !v),
    [],
  );

  useOnClickOutside(catalogLiRef, closeCatalog, isCatalogOpen);

  useEffect(() => {
    if (!isCatalogOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeCatalog();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isCatalogOpen, closeCatalog]);

  const handleDropdownClickCapture = useCallback(
    (e) => {
      const target = e?.target;
      if (!target || typeof target.closest !== "function") return;
      if (target.closest("a")) {
        closeCatalog();
        onNavigate?.();
      }
    },
    [closeCatalog, onNavigate],
  );

  return (
    <ul className="main-nav">
      {navItems.map((item) => {
        const showCatalogDropdown =
          desktopCatalogDisabled &&
          isCatalogNavItem(item);

        if (showCatalogDropdown) {
          return (
            <li
              key={item.id}
              ref={catalogLiRef}
              className={[
                "main-nav__item",
                "main-nav__item--dropdown",
                isCatalogOpen ? "is-open" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className="main-nav__button main-nav__button--catalog-trigger"
                aria-haspopup="dialog"
                aria-expanded={isCatalogOpen ? "true" : "false"}
                onClick={toggleCatalog}
              >
                <p className="main-nav__text">{item.label}</p>
              </button>
              {previewRoots.length > 0 ? (
                <div
                  className="main-nav__dropdown"
                  onClickCapture={handleDropdownClickCapture}
                >
                  {catalogDropdown ?? (
                    <ul className="main-nav__dropdown-list">
                      {previewRoots.map((cat) => (
                        <li key={cat._id ?? cat.slug}>
                          <Link
                            href={categoryTreeItemHref(locale, cat)}
                            className="main-nav__dropdown-link"
                            onClick={handleNavigate}
                          >
                            {cat?.title?.[locale] ??
                              cat?.title?.ua ??
                              cat?.slug ??
                              ""}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </li>
          );
        }

        const isActive = isNavLinkActive(pathname, item.href);

        return (
          <li key={item.id} className="main-nav__item">
            <Link
              href={item.href}
              className={[
                "main-nav__button",
                isActive ? "main-nav__button--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={handleNavigate}
              aria-current={isActive ? "page" : undefined}
            >
              <p className="main-nav__text">{item.label}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default MainNav;
