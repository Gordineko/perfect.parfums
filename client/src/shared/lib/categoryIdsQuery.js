import { QUERY_CATEGORY_IDS } from "../consts/query-params";

export function normalizeCategoryIdsForCardsQuery(raw) {
    if (raw === undefined || raw === null) {
        return undefined;
    }
    let ids = [];
    if (Array.isArray(raw)) {
        ids = raw.map((x) => String(x).trim()).filter(Boolean);
    } else {
        const s = String(raw).trim();
        if (!s) {
            return undefined;
        }
        if (s.startsWith("[")) {
            try {
                const p = JSON.parse(s);
                ids = Array.isArray(p)
                    ? p.map((x) => String(x).trim()).filter(Boolean)
                    : [];
            } catch {
                return undefined;
            }
        } else {
            ids = [s];
        }
    }
    return ids.length ? JSON.stringify(ids) : undefined;
}

export function parseCategoryIdsFromSearchParams(searchParamsLike) {
    if (!searchParamsLike) {
        return [];
    }
    const multi =
        typeof searchParamsLike.getAll === "function"
            ? searchParamsLike.getAll(QUERY_CATEGORY_IDS)
            : [];
    if (multi.length > 1) {
        return multi.map(String).filter(Boolean);
    }
    const raw =
        multi.length === 1
            ? multi[0]
            : searchParamsLike.get?.(QUERY_CATEGORY_IDS);
    if (raw == null || String(raw).trim() === "") {
        return [];
    }
    const s = String(raw).trim();
    if (s.startsWith("[")) {
        try {
            const p = JSON.parse(s);
            return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [s];
}

export function parseCategoryIdsFromResolvedSearch(resolved) {
    if (!resolved || typeof resolved !== "object") {
        return [];
    }
    const norm = normalizeCategoryIdsForCardsQuery(
        resolved[QUERY_CATEGORY_IDS],
    );
    if (!norm) {
        return [];
    }
    try {
        const p = JSON.parse(norm);
        return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
    } catch {
        return [];
    }
}
