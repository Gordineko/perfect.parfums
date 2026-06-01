import { getAllBlogPosts, getBlogPostsPage } from "@entities/blog";
import BlogListPage from "@pages/blog-list-page";
import {
  createI18nServer,
  getAllCategory,
  getLocalizedFooter,
  getMessages,
} from "@shared";
import PageHeader from "@shared/ui/PageHeader";
import Footer from "@widgets/Footer";
import { Suspense } from "react";

import styles from "./blog.module.scss";

export default async function BlogPage({ params, searchParams }) {
  const { locale = "ua" } = await params;
  const resolvedSearchParams = await searchParams;
  const page =
    typeof resolvedSearchParams?.page === "string"
      ? Number(resolvedSearchParams.page)
      : 1;

  const categories = await getAllCategory();
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const footerData = getLocalizedFooter(t);
  const pageTitle = t("breadcrumbs.blog");

  const blogData = getBlogPostsPage({ page });
  const allPosts = getAllBlogPosts();

  return (
    <div className={styles.pageShell}>
      <div className={styles.page}>
        <PageHeader
          locale={locale}
          breadcrumbsLabels={{
            home: t("breadcrumbs.home"),
            page: t("breadcrumbs.page"),
          }}
          breadcrumbsItems={[{ label: pageTitle }]}
          showTitle={false}
          plainBreadcrumbs
        />

        <Suspense fallback={null}>
          <BlogListPage
            locale={locale}
            initialData={blogData}
            allPosts={allPosts}
          />
        </Suspense>
      </div>

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <div className="container products-layout-wrapper__inner" />
        <Footer categories={categories} locale={locale} data={footerData} />
      </section>
    </div>
  );
}
