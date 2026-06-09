import { BLOG_FILTER_ALL } from "./blogCategories";
import { MOCK_BLOG_POSTS } from "./mockBlogPosts";

export const BLOG_PAGE_SIZE = 4;

function normalizePage(page, pages) {
  const safePage = Number(page) || 1;
  return Math.min(Math.max(1, safePage), pages);
}

function filterPosts(category) {
  if (!category || category === BLOG_FILTER_ALL) {
    return [...MOCK_BLOG_POSTS];
  }

  return MOCK_BLOG_POSTS.filter(
    (post) => post.filterCategory === category,
  );
}

/**
 * Список статей з пагінацією та фільтром.
 * Замінити тіло функції на API-запит, коли бекенд буде готовий.
 */
export function getBlogPostsPage({
  category = BLOG_FILTER_ALL,
  page = 1,
  pageSize = BLOG_PAGE_SIZE,
} = {}) {
  const filtered = filterPosts(category);
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = normalizePage(page, pages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    page: currentPage,
    pages,
    limit: pageSize,
    total,
    category,
  };
}

export function getAllBlogPosts() {
  return [...MOCK_BLOG_POSTS];
}

export function getBlogPostBySlug(slug) {
  if (!slug) return null;
  return MOCK_BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export function getRelatedBlogPosts(slug, limit = 3) {
  const current = getBlogPostBySlug(slug);
  if (!current) return [];

  const sameCategory = MOCK_BLOG_POSTS.filter(
    (post) =>
      post.slug !== slug &&
      post.filterCategory === current.filterCategory,
  );

  const fallback = MOCK_BLOG_POSTS.filter((post) => post.slug !== slug);

  const merged = [...sameCategory];
  fallback.forEach((post) => {
    if (!merged.some((item) => item.id === post.id)) {
      merged.push(post);
    }
  });

  return merged.slice(0, limit);
}

export function getAllBlogSlugs() {
  return MOCK_BLOG_POSTS.map((post) => post.slug);
}
