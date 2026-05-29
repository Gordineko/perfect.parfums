import {
  getAllBlogSlugs,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@entities/blog";
import BlogArticlePage from "@pages/blog-article-page";
import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
  localePath,
} from "@shared";
import PageHeader from "@shared/ui/PageHeader";
import Footer from "@widgets/Footer";
import { notFound } from "next/navigation";

import styles from "../blog.module.scss";

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Блог" };
  }

  return {
    title: `${post.title} | Perfect Parfums`,
    description: post.excerpt,
  };
}

export default async function BlogArticleRoute({ params }) {
  const { locale = "ua", slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const categories = await getAllCategory();
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);
  const blogTitle = t("breadcrumbs.blog");
  const relatedPosts = getRelatedBlogPosts(slug, 3);

  return (
    <div className={styles.pageShell}>
      <div className={styles.page}>
        <PageHeader
          locale={locale}
          breadcrumbsLabels={{
            home: t("breadcrumbs.home"),
            page: t("breadcrumbs.page"),
          }}
          breadcrumbsItems={[
            { label: blogTitle, path: localePath(locale, "/blog") },
            { label: post.title },
          ]}
          showTitle={false}
          plainBreadcrumbs
        />

        <BlogArticlePage
          locale={locale}
          post={post}
          relatedPosts={relatedPosts}
          labels={{ readAlso: t("blogArticle.readAlso") }}
        />
      </div>

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <div className="container products-layout-wrapper__inner" />
        <Footer categories={categories} locale={locale} data={footerData} />
      </section>
    </div>
  );
}
