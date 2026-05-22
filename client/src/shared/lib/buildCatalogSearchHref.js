import { QUERY_VALUE } from "../consts/query-params";

/**
 * Catalog URL for global text search. Path segment is `all` so
 * `categories/[...slug]` does not treat `search` as a category slug (404).
 */
export function buildCatalogSearchResultsHref(locale, query) {
  const loc = String(locale ?? "ua").trim() || "ua";
  const trimmed = String(query ?? "").trim();
  if (!trimmed) {
    return null;
  }
  const qs = new URLSearchParams();
  qs.set(QUERY_VALUE, trimmed);
  return `/${loc}/categories/all?${qs.toString()}`;
}
