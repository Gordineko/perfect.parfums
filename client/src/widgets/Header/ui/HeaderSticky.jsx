"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import styles from "./Header.module.scss";

export default function HeaderSticky({ lightHeader, navBar }) {
  const lightRef = useRef(null);
  const navRef = useRef(null);
  const sentinelRef = useRef(null);
  const [isPinned, setIsPinned] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const [isNotFoundPage, setIsNotFoundPage] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isNotFoundPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPinned(!entry.isIntersecting),
      { root: null, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isNotFoundPage]);

  useEffect(() => {
    const syncNotFound = () => {
      setIsNotFoundPage(
        document.documentElement.classList.contains("is-not-found-page"),
      );
    };

    syncNotFound();
    const observer = new MutationObserver(syncNotFound);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const lightEl = lightRef.current;
    const navEl = navRef.current;
    if (!lightEl) return;

    const syncMetrics = () => {
      const lightHeight = Math.ceil(lightEl.getBoundingClientRect().height);
      const navH = navEl ? Math.ceil(navEl.getBoundingClientRect().height) : 0;

      setNavHeight(navH);
      document.documentElement.style.setProperty(
        "--header-light-height",
        `${lightHeight}px`,
      );
      document.documentElement.style.setProperty("--header-nav-height", `${navH}px`);
      document.documentElement.style.setProperty(
        "--header-offset",
        `${lightHeight + navH}px`,
      );
      document.documentElement.style.setProperty(
        "--header-offset-compact",
        `${navH}px`,
      );
    };

    syncMetrics();
    const observer = new ResizeObserver(syncMetrics);
    observer.observe(lightEl);
    if (navEl) observer.observe(navEl);

    return () => observer.disconnect();
  }, [isNotFoundPage, isPinned]);

  return (
    <div
      className={clsx(styles.siteHeader, isNotFoundPage && styles.siteHeaderNotFound)}
    >
      <div ref={lightRef} className={styles.lightHeader}>
        {lightHeader}
      </div>

      {!isNotFoundPage ? (
        <>
          <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
          {isPinned && navHeight > 0 ? (
            <div
              className={styles.navPlaceholder}
              style={{ height: navHeight }}
              aria-hidden="true"
            />
          ) : null}
          <div
            ref={navRef}
            className={clsx(styles.burgundyBar, isPinned && styles.burgundyPinned)}
          >
            {navBar}
          </div>
        </>
      ) : null}
    </div>
  );
}
