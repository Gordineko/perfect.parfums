"use client";

import {
  QUERY_CATEGORY_IDS,
  QUERY_CHAR,
  QUERY_OFFER_CHAR,
  QUERY_ONLY_AVAILABLE,
  QUERY_OPT,
  QUERY_PAGE,
  QUERY_PRICE_MAX,
  QUERY_PRICE_MIN,
} from "@shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import {
  labelForMetaTechnicalValue,
  prepareFilterableMetaItems,
  resolveSectionTitle,
} from "../lib/characteristicsMetaHelpers";

function findGroupFacet(filters, metaKey) {
  const gc = filters?.facets?.groupCharacteristics ?? {};
  for (const [, item] of Object.entries(gc)) {
    const k = item?.meta?.key ?? "";
    if (k === metaKey) return item;
  }
  return null;
}

function findOfferFacet(filters, metaKey) {
  const oc = filters?.facets?.offerCharacteristics ?? {};
  for (const [, item] of Object.entries(oc)) {
    const k = item?.meta?.key ?? "";
    if (k === metaKey) return item;
  }
  return null;
}

function findFacetForMetaKey(filters, metaKey) {
  return (
    findGroupFacet(filters, metaKey) ??
    findOfferFacet(filters, metaKey)
  );
}

function labelFromGroupBucket(facet, valueStr, locale) {
  for (const b of facet?.buckets ?? []) {
    if (String(b?.value?.value) === valueStr) {
      return (
        b?.value?.label?.[locale] ??
        b?.value?.label?.ua ??
        valueStr
      );
    }
  }
  return valueStr;
}

function labelFromOfferBucket(facet, valueStr, locale) {
  for (const b of facet?.buckets ?? []) {
    if (String(b?.value) === valueStr) {
      return (
        b?.label?.[locale] ??
        b?.label?.ua ??
        valueStr
      );
    }
  }
  return valueStr;
}

function labelVariantValue(filters, metaKey, valueStr, locale) {
  const groupFacet = findGroupFacet(filters, metaKey);
  if (groupFacet) {
    return labelFromGroupBucket(groupFacet, valueStr, locale);
  }
  const offerFacet = findOfferFacet(filters, metaKey);
  if (offerFacet) {
    return labelFromOfferBucket(offerFacet, valueStr, locale);
  }
  return valueStr;
}

function expandValues(obj) {
  const out = [];
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item != null) out.push([k, String(item)]);
      });
    } else if (v != null) {
      out.push([k, String(v)]);
    }
  }
  return out;
}

function parseJsonParam(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function withColon(label) {
  const t = String(label ?? "").trim();
  if (!t) return "";
  return t.endsWith(":") ? t : `${t}:`;
}

function pushQuery(router, pathname, params) {
  const qs = params.toString();
  router.push(qs ? `${pathname}?${qs}` : pathname, {
    scroll: false,
  });
}

export default function ActiveFilterTags({
  filters,
  characteristicsMeta,
  locale,
  priceLabel,
  panelLabel,
  clearLabel,
  removeFilterAriaLabel,
  variant = "default",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const removeCharValue = useCallback(
    (metaKey, valueStr) => {
      const params = new URLSearchParams(searchParams.toString());
      const char = parseJsonParam(params.get(QUERY_CHAR));
      const next = { ...char };
      const cur = next[metaKey];
      if (Array.isArray(cur)) {
        const filtered = cur.filter(
          (x) => String(x) !== valueStr,
        );
        if (filtered.length === 0) delete next[metaKey];
        else if (filtered.length === 1) {
          next[metaKey] = filtered[0];
        } else {
          next[metaKey] = filtered;
        }
      } else if (String(cur) === valueStr) {
        delete next[metaKey];
      }
      if (Object.keys(next).length === 0) {
        params.delete(QUERY_CHAR);
      } else {
        params.set(QUERY_CHAR, JSON.stringify(next));
      }
      params.delete(QUERY_PAGE);
      pushQuery(router, pathname, params);
    },
    [pathname, router, searchParams],
  );

  const removeOfferValue = useCallback(
    (metaKey, valueStr) => {
      const params = new URLSearchParams(searchParams.toString());
      const offerChar = parseJsonParam(
        params.get(QUERY_OFFER_CHAR),
      );
      const next = { ...offerChar };
      const cur = next[metaKey];
      if (Array.isArray(cur)) {
        const filtered = cur.filter(
          (x) => String(x) !== valueStr,
        );
        if (filtered.length === 0) delete next[metaKey];
        else if (filtered.length === 1) {
          next[metaKey] = filtered[0];
        } else {
          next[metaKey] = filtered;
        }
      } else if (String(cur) === valueStr) {
        delete next[metaKey];
      }
      if (Object.keys(next).length === 0) {
        params.delete(QUERY_OFFER_CHAR);
      } else {
        params.set(QUERY_OFFER_CHAR, JSON.stringify(next));
      }
      params.delete(QUERY_PAGE);
      pushQuery(router, pathname, params);
    },
    [pathname, router, searchParams],
  );

  const removeOptValue = useCallback(
    (metaKey, valueStr) => {
      const params = new URLSearchParams(searchParams.toString());
      const opt = parseJsonParam(params.get(QUERY_OPT));
      const next = { ...opt };
      const cur = next[metaKey];
      if (Array.isArray(cur)) {
        const filtered = cur.filter(
          (x) => String(x) !== valueStr,
        );
        if (filtered.length === 0) delete next[metaKey];
        else if (filtered.length === 1) {
          next[metaKey] = filtered[0];
        } else {
          next[metaKey] = filtered;
        }
      } else if (String(cur) === valueStr) {
        delete next[metaKey];
      }
      if (Object.keys(next).length === 0) {
        params.delete(QUERY_OPT);
      } else {
        params.set(QUERY_OPT, JSON.stringify(next));
      }
      params.delete(QUERY_PAGE);
      pushQuery(router, pathname, params);
    },
    [pathname, router, searchParams],
  );

  const filterableMetaItems = useMemo(
    () => prepareFilterableMetaItems(characteristicsMeta),
    [characteristicsMeta],
  );

  const filterableMetaKeys = useMemo(
    () =>
      new Set(
        filterableMetaItems
          .map((x) => x?.key)
          .filter(Boolean),
      ),
    [filterableMetaItems],
  );

  const tags = useMemo(() => {
    const list = [];

    const char = parseJsonParam(searchParams.get(QUERY_CHAR));
    const offerChar = parseJsonParam(
      searchParams.get(QUERY_OFFER_CHAR),
    );
    const opt = parseJsonParam(searchParams.get(QUERY_OPT));

    const metaItems = filterableMetaItems;

    for (const [metaKey, valueStr] of expandValues(char)) {
      if (!filterableMetaKeys.has(metaKey)) {
        continue;
      }
      const facet = findGroupFacet(filters, metaKey);
      const rawTitle = resolveSectionTitle(
        metaItems,
        metaKey,
        locale,
        facet,
      );
      const fromMeta = labelForMetaTechnicalValue(
        metaItems,
        metaKey,
        valueStr,
        locale,
      );
      const valLabel =
        fromMeta !== String(valueStr)
          ? fromMeta
          : labelFromGroupBucket(facet, valueStr, locale);
      list.push({
        id: `char:${metaKey}:${valueStr}`,
        title: withColon(rawTitle),
        value: valLabel,
        kind: "char",
        metaKey,
        valueStr,
      });
    }

    for (const [metaKey, valueStr] of expandValues(offerChar)) {
      if (!filterableMetaKeys.has(metaKey)) {
        continue;
      }
      const facet = findOfferFacet(filters, metaKey);
      const rawTitle = resolveSectionTitle(
        metaItems,
        metaKey,
        locale,
        facet,
      );
      const fromMeta = labelForMetaTechnicalValue(
        metaItems,
        metaKey,
        valueStr,
        locale,
      );
      const valLabel =
        fromMeta !== String(valueStr)
          ? fromMeta
          : labelFromOfferBucket(facet, valueStr, locale);
      list.push({
        id: `offer:${metaKey}:${valueStr}`,
        title: withColon(rawTitle),
        value: valLabel,
        kind: "offer",
        metaKey,
        valueStr,
      });
    }

    for (const [metaKey, valueStr] of expandValues(opt)) {
      const facetMeta =
        findFacetForMetaKey(filters, metaKey);
      const rawTitle =
        facetMeta?.meta?.title?.[locale] ??
        facetMeta?.meta?.title?.ua ??
        metaKey;
      const valLabel = labelVariantValue(
        filters,
        metaKey,
        valueStr,
        locale,
      );
      list.push({
        id: `opt:${metaKey}:${valueStr}`,
        title: withColon(rawTitle),
        value: valLabel,
        kind: "opt",
        metaKey,
        valueStr,
      });
    }

    const priceMin = searchParams.get(QUERY_PRICE_MIN);
    const priceMax = searchParams.get(QUERY_PRICE_MAX);
    if (priceMin || priceMax) {
      list.push({
        id: "price",
        title: withColon(priceLabel),
        value: `${priceMin ?? "—"} — ${priceMax ?? "—"}`,
        kind: "price",
      });
    }

    return list;
  }, [
    filterableMetaItems,
    filterableMetaKeys,
    filters,
    locale,
    priceLabel,
    searchParams,
  ]);

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(QUERY_CHAR);
    params.delete(QUERY_OFFER_CHAR);
    params.delete(QUERY_OPT);
    params.delete(QUERY_PRICE_MIN);
    params.delete(QUERY_PRICE_MAX);
    params.delete(QUERY_CATEGORY_IDS);
    params.delete(QUERY_ONLY_AVAILABLE);
    params.delete(QUERY_PAGE);
    pushQuery(router, pathname, params);
  }, [pathname, router, searchParams]);

  if (tags.length === 0) return null;

  const tagList = tags.map((tag) => (
    <li className="active-filter-tags__item" key={tag.id}>
      <span className="active-filter-tags__body">
        <>
          <span className="active-filter-tags__title">
            {tag.title}
          </span>{" "}
          <span className="active-filter-tags__value">
            {tag.value}
          </span>
        </>
      </span>
      <button
        type="button"
        className="active-filter-tags__remove"
        onClick={() => {
          if (tag.kind === "char") {
            removeCharValue(tag.metaKey, tag.valueStr);
          } else if (tag.kind === "offer") {
            removeOfferValue(tag.metaKey, tag.valueStr);
          } else if (tag.kind === "opt") {
            removeOptValue(tag.metaKey, tag.valueStr);
          } else if (tag.kind === "price") {
            const params = new URLSearchParams(
              searchParams.toString(),
            );
            params.delete(QUERY_PRICE_MIN);
            params.delete(QUERY_PRICE_MAX);
            params.delete(QUERY_PAGE);
            pushQuery(router, pathname, params);
          }
        }}
        aria-label={removeFilterAriaLabel}
      >
        <svg
          className="active-filter-tags__remove-icon"
          width="7"
          height="7"
          viewBox="0 0 7 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.859644 0.140356C0.765343 0.0492769 0.639042 -0.00112031 0.507944 1.89013e-05C0.376845 0.00115811 0.251439 0.0537426 0.158735 0.146447C0.0660308 0.239151 0.0134463 0.364557 0.0123071 0.495655C0.0111679 0.626754 0.0615651 0.753055 0.152644 0.847356L2.79914 3.49386L0.152644 6.14036C0.104889 6.18648 0.0667979 6.24165 0.0405934 6.30265C0.0143889 6.36366 0.000595787 6.42927 1.88784e-05 6.49566C-0.00055803 6.56204 0.0120928 6.62788 0.0372333 6.68933C0.0623737 6.75078 0.0995003 6.80661 0.146447 6.85355C0.193393 6.9005 0.249219 6.93763 0.310667 6.96277C0.372115 6.98791 0.437955 7.00056 0.504345 6.99998C0.570734 6.9994 0.636344 6.98561 0.697346 6.95941C0.758348 6.9332 0.813521 6.89511 0.859644 6.84736L3.50614 4.20086L6.15264 6.84736C6.24695 6.93843 6.37325 6.98883 6.50434 6.98769C6.63544 6.98655 6.76085 6.93397 6.85355 6.84126C6.94626 6.74856 6.99884 6.62315 6.99998 6.49206C7.00112 6.36096 6.95072 6.23466 6.85964 6.14036L4.21314 3.49386L6.85964 0.847356C6.95072 0.753055 7.00112 0.626754 6.99998 0.495655C6.99884 0.364557 6.94626 0.239151 6.85355 0.146447C6.76085 0.0537426 6.63544 0.00115811 6.50434 1.89013e-05C6.37325 -0.00112031 6.24695 0.0492769 6.15264 0.140356L3.50614 2.78686L0.859644 0.140356Z"
            fill="var(--color-black)"
          />
        </svg>
      </button>
    </li>
  ));

  if (variant === "modal") {
    return (
      <div className="active-filter-tags active-filter-tags--modal">
        <div className="active-filter-tags__modal-row">
          <span className="active-filter-tags__panel-label">
            {panelLabel}
          </span>
          <button
            type="button"
            className="active-filter-tags__clear active-filter-tags__clear--text"
            onClick={clearAll}
          >
            {clearLabel}
          </button>
        </div>
        <ul className="active-filter-tags__list">{tagList}</ul>
      </div>
    );
  }

  return (
    <div className="active-filter-tags">
      <span className="active-filter-tags__panel-label">
        {panelLabel}
      </span>
      <ul className="active-filter-tags__list">{tagList}</ul>
      <button
        type="button"
        className="active-filter-tags__clear"
        onClick={clearAll}
      >
        {clearLabel}
      </button>
    </div>
  );
}
