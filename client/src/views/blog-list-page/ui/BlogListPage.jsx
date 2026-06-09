"use client";

import { BlogPostCard } from "@entities/blog";
import CatalogPagination from "@features/catalog-pagination/ui/CatalogPagination";
import { localePath, useI18n } from "@shared";
import { useState } from "react";

import styles from "./BlogListPage.module.scss";

export default function BlogListPage({ locale, initialData, allPosts = [] }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const isFirstPage = initialData.page === 1;
  const posts = expanded ? allPosts : initialData.items;
  const remainingCount = Math.max(allPosts.length - initialData.items.length, 0);
  const showExpandButton = !expanded && isFirstPage && remainingCount > 0;
  const showPagination = !expanded && initialData.pages > 1;

  return (
    <div className={styles.page}>
      <div className="container">
        {posts.length === 0 ? (
          <p className={styles.empty}>{t("blogPage.empty")}</p>
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => (
              <li key={post.id} className={styles.listItem}>
                <BlogPostCard
                  post={post}
                  locale={locale}
                  href={localePath(locale, `/blog/${post.slug}`)}
                />
              </li>
            ))}
          </ul>
        )}

        {showExpandButton ? (
          <div className={styles.showMore}>
            <button
              type="button"
              className={styles.showMoreButton}
              onClick={() => setExpanded(true)}
            >
              {t("blogPage.showMore", { count: remainingCount })}
            </button>
          </div>
        ) : null}

        {showPagination ? (
          <div className={styles.pagination}>
            <CatalogPagination
              data={{
                page: initialData.page,
                pages: initialData.pages,
                limit: initialData.limit,
              }}
              showLoadMore={false}
              variant="compact"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
