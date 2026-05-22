"use client";

import { useRouter } from "next/navigation";
import React from "react";

import Split from "./common/Split";
import styles from "./Breadcrumbs.module.scss";

const Breadcrumbs = ({
  locale,
  labels = { home: "Home", page: "Page" },
  items,
  categoryName,
  categoryLink,
  subcategoryLink,
  subcategoryName,
  productName,
  pageName,
  className,
  embedInPage = false,
  hideHome = false,
}) => {
  const router = useRouter();
  const go = (path) => router.push(path);
  const normalizedItems = Array.isArray(items)
    ? items.filter((x) => x && typeof x.label === "string" && x.label.trim().length)
    : null;

  const rootClass = [
    styles.root,
    embedInPage ? styles.rootEmbedded : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={rootClass} aria-label="Breadcrumb">
      <div className={`ds-container ${styles.inner}`}>
        {!hideHome ? (
          <>
            <button
              type="button"
              className={styles.link}
              onClick={() => go(`/${locale}`)}
            >
              {labels.home}
            </button>
            <Split />
          </>
        ) : null}

        {normalizedItems ? (
          normalizedItems.map((item, index) => {
            const isLast = index === normalizedItems.length - 1;
            const canGo = !isLast && typeof item.path === "string" && item.path.trim().length;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {canGo ? (
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => go(item.path)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    className={`${styles.link} ${styles.linkCurrent}`}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast ? <Split /> : null}
              </React.Fragment>
            );
          })
        ) : categoryName ? (
          <>
            {subcategoryName || productName ? (
              <button
                type="button"
                className={styles.link}
                onClick={() =>
                  go(`/${locale}/categories/${categoryLink}`)
                }
              >
                {categoryName}
              </button>
            ) : (
              <span className={`${styles.link} ${styles.linkCurrent}`}>
                {categoryName}
              </span>
            )}

            {subcategoryName ? (
              <>
                <Split />
                {productName ? (
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() =>
                      go(
                        `/${locale}/categories/${categoryLink}/${subcategoryLink}`,
                      )
                    }
                  >
                    {subcategoryName}
                  </button>
                ) : (
                  <span className={`${styles.link} ${styles.linkCurrent}`}>
                    {subcategoryName}
                  </span>
                )}
              </>
            ) : null}

            {productName ? (
              <>
                <Split />
                <span className={`${styles.link} ${styles.linkCurrent}`}>
                  {productName}
                </span>
              </>
            ) : null}
          </>
        ) : (
          <span className={`${styles.link} ${styles.linkCurrent}`}>
            {pageName ?? labels.page}
          </span>
        )}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
