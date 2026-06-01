import { QUERY_VALUE } from "../consts/query-params";

import { localePath } from "./localePath";

export function buildCatalogSearchResultsHref(locale, query) {
  const trimmed = String(query ?? "").trim();
  if (!trimmed) {
    return null;
  }
  const qs = new URLSearchParams();
  qs.set(QUERY_VALUE, trimmed);
  return `${localePath(locale, "/categories/all")}?${qs.toString()}`;
}
