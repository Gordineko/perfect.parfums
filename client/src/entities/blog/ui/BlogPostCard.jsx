"use client";

import { formatBlogDate } from "../model/formatBlogDate";
import styles from "./BlogPostCard.module.scss";

import Image from "next/image";
import Link from "next/link";

export default function BlogPostCard({
  post,
  locale = "ua",
  href,
  variant = "row",
}) {
  if (!post) return null;

  const dateLabel = formatBlogDate(post.publishedAt, locale);

  return (
    <article className={`${styles.card} ${styles[`card--${variant}`]}`}>
      <Link href={href} className={styles.link}>
        <div className={styles.media}>
          <Image
            src={post.image}
            alt=""
            width={280}
            height={220}
            className={styles.image}
            sizes="(max-width: 767px) 84px, (max-width: 1249px) 140px, 280px"
          />
        </div>

        <div className={styles.body}>
          <div className={styles.bodyMain}>
            <h2 className={styles.title}>{post.title}</h2>
            <p className={styles.category}>{post.categoryLabel}</p>
            <p className={styles.excerpt}>{post.excerpt}</p>
          </div>
          <time className={styles.date} dateTime={post.publishedAt}>
            {dateLabel}
          </time>
        </div>
      </Link>
    </article>
  );
}
