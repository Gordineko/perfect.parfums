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
        <span className="active-filter-tags__value">{tag.value}</span>
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
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1.24316 0.766113L12.7325 12.7659"
            stroke="#11110F"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M0.733398 12.7659L12.2227 0.766121"
            stroke="#11110F"
            strokeWidth="1.5"
            strokeLinecap="round"
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
