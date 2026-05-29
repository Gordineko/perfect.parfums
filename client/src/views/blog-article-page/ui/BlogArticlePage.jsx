import {
  BlogArticleContent,
  BlogPostCard,
  formatBlogDate,
} from "@entities/blog";
import { localePath } from "@shared/lib/localePath";

import styles from "./BlogArticlePage.module.scss";

import Image from "next/image";

export default function BlogArticlePage({
  locale,
  post,
  relatedPosts = [],
  labels,
}) {
  if (!post) return null;

  const dateLabel = formatBlogDate(post.publishedAt, locale);

  return (
    <article className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <time className={styles.date} dateTime={post.publishedAt}>
            {dateLabel}
          </time>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.category}>{post.categoryLabel}</p>
        </header>

        <div className={styles.hero}>
          <Image
            src={post.image}
            alt=""
            width={1200}
            height={720}
            className={styles.heroImage}
            priority
            sizes="(max-width: 767px) 100vw, (max-width: 1249px) 90vw, 1200px"
          />
        </div>

        <BlogArticleContent blocks={post.content} />

        {relatedPosts.length > 0 ? (
          <section className={styles.related} aria-labelledby="blog-related-title">
            <h2 className={styles.relatedTitle} id="blog-related-title">
              {labels.readAlso}
            </h2>

            <ul className={styles.relatedGrid}>
              {relatedPosts.map((item) => (
                <li key={item.id}>
                  <BlogPostCard
                    post={item}
                    locale={locale}
                    variant="grid"
                    href={localePath(locale, `/blog/${item.slug}`)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
