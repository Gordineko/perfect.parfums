import {
    QUERY_CATEGORY_IDS,
    QUERY_Q,
    QUERY_VALUE,
} from "../consts/query-params";
import { normalizeCategoryIdsForCardsQuery } from "../lib/categoryIdsQuery";

export const CATALOG_PRODUCTS_PAGE_SIZE = 24;

export const CATALOG_GRID_PRIORITY_IMAGE_COUNT = 4;

function firstQueryString(v) {
    if (v == null) return "";
    if (Array.isArray(v)) {
        return v.length ? String(v[0]) : "";
    }
    return String(v);
}

function normalizeCardsQueryParams(params = {}) {
    if (!params || typeof params !== "object") {
        return {};
    }
    const out = { ...params };
    const fromValueRaw = firstQueryString(out[QUERY_VALUE]).trim();
    const fromValue = fromValueRaw !== "" ? fromValueRaw : null;
    const fromQRaw = firstQueryString(out[QUERY_Q]).trim();
    const fromQ = fromQRaw !== "" ? fromQRaw : null;
    delete out[QUERY_VALUE];
    delete out[QUERY_Q];
    const q = fromValue ?? fromQ;
    if (q) {
        out[QUERY_Q] = q;
    }
    if (Object.prototype.hasOwnProperty.call(out, QUERY_CATEGORY_IDS)) {
        const normalized = normalizeCategoryIdsForCardsQuery(
            out[QUERY_CATEGORY_IDS],
        );
        if (normalized === undefined) {
            delete out[QUERY_CATEGORY_IDS];
        } else {
            out[QUERY_CATEGORY_IDS] = normalized;
        }
    }
    return out;
}

function resolveCatalogLang(locale) {
    const l = String(locale ?? "ua").toLowerCase();
    if (l === "en") {
        return "en";
    }
    return "ua";
}

function mergeCatalogQuery(norm = {}, locale = "ua") {
    const lang = resolveCatalogLang(locale);
    const defaults = {
        status: "active",
        lang,
        preview: true,
        depth: 2,
        maxValuesPerAxis: 6,
        includeOffers: "preview",
        sort: "updated_desc",
        page: "1",
    };
    const out = { ...defaults };
    for (const [key, value] of Object.entries(norm || {})) {
        if (value === undefined || value === null) {
            continue;
        }
        if (key === QUERY_CATEGORY_IDS) {
            const n = normalizeCategoryIdsForCardsQuery(value);
            if (n !== undefined) {
                out[key] = n;
            }
            continue;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) {
                continue;
            }
            out[key] = value.length === 1 ? value[0] : value;
        } else if (typeof value === "string" && value.trim() === "") {
            continue;
        } else {
            out[key] = value;
        }
    }
    return out;
}

function mergeFacetQuery(norm = {}) {
    const defaults = {
        status: "active",
    };
    const out = { ...defaults };
    for (const [key, value] of Object.entries(norm || {})) {
        if (value === undefined || value === null) {
            continue;
        }
        if (key === QUERY_CATEGORY_IDS) {
            const n = normalizeCategoryIdsForCardsQuery(value);
            if (n !== undefined) {
                out[key] = n;
            }
            continue;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) {
                continue;
            }
            out[key] = value.length === 1 ? value[0] : value;
        } else if (typeof value === "string" && value.trim() === "") {
            continue;
        } else {
            out[key] = value;
        }
    }
    return out;
}

export async function getAllProductsForSwiper() {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base || String(base).trim() === "") {
        console.warn(
            "getAllProductsForSwiper: NEXT_PUBLIC_API_URL не задано — рекомендовані товари порожні.",
        );
        return { items: [] };
    }

    const url = `${String(base).replace(/\/$/, "")}/catalog/cards?includeOffers=preview&isSale=true&limit=20`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 120 },
        });
        if (!response.ok) {
            console.warn(
                "getAllProductsForSwiper: відповідь не OK",
                response.status,
                response.statusText,
            );
            return { items: [] };
        }
        const data = await response.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        return { ...data, items };
    } catch (e) {
        console.warn(
            "getAllProductsForSwiper: fetch не вдався:",
            e instanceof Error ? e.message : e,
        );
        return { items: [] };
    }
}

export async function getSaleCatalogCards() {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base || String(base).trim() === "") {
        return {
            ok: false,
            items: [],
            status: 0,
            message: "NEXT_PUBLIC_API_URL не задано",
        };
    }

    const url = `${String(base).replace(/\/$/, "")}/catalog/cards?includeOffers=preview&isSale=true&limit=20`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 120 },
        });

        if (!response.ok) {
            let message = `Помилка сервера (${response.status})`;
            try {
                const errBody = await response.json();
                if (errBody?.message) {
                    message = String(errBody.message);
                }
            } catch {}
            return {
                ok: false,
                items: [],
                status: response.status,
                message,
            };
        }

        const data = await response.json();
        const items = Array.isArray(data?.items)
            ? data.items
            : [];

        return {
            ok: true,
            items,
            status: response.status,
            message: "",
        };
    } catch (e) {
        return {
            ok: false,
            items: [],
            status: 0,
            message:
                e instanceof Error
                    ? e.message
                    : "Не вдалося завантажити акційні товари",
        };
    }
}

export async function getNewCatalogCards() {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base || String(base).trim() === "") {
        return {
            ok: false,
            items: [],
            status: 0,
            message: "NEXT_PUBLIC_API_URL не задано",
        };
    }

    const url = `${String(base).replace(/\/$/, "")}/catalog/cards?includeOffers=preview&isNew=true&limit=20`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 120 },
        });

        if (!response.ok) {
            let message = `Помилка сервера (${response.status})`;
            try {
                const errBody = await response.json();
                if (errBody?.message) {
                    message = String(errBody.message);
                }
            } catch {}
            return {
                ok: false,
                items: [],
                status: response.status,
                message,
            };
        }

        const data = await response.json();
        const items = Array.isArray(data?.items)
            ? data.items
            : [];

        return {
            ok: true,
            items,
            status: response.status,
            message: "",
        };
    } catch (e) {
        return {
            ok: false,
            items: [],
            status: 0,
            message:
                e instanceof Error
                    ? e.message
                    : "Не вдалося завантажити новинки",
        };
    }
}

export async function getPopularCatalogCards() {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base || String(base).trim() === "") {
        return {
            ok: false,
            items: [],
            status: 0,
            message: "NEXT_PUBLIC_API_URL не задано",
        };
    }

    const url = `${String(base).replace(/\/$/, "")}/catalog/cards?includeOffers=preview&isPopular=true&limit=20`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 120 },
        });

        if (!response.ok) {
            let message = `Помилка сервера (${response.status})`;
            try {
                const errBody = await response.json();
                if (errBody?.message) {
                    message = String(errBody.message);
                }
            } catch {}
            return {
                ok: false,
                items: [],
                status: response.status,
                message,
            };
        }

        const data = await response.json();
        const items = Array.isArray(data?.items)
            ? data.items
            : [];

        return {
            ok: true,
            items,
            status: response.status,
            message: "",
        };
    } catch (e) {
        return {
            ok: false,
            items: [],
            status: 0,
            message:
                e instanceof Error
                    ? e.message
                    : "Не вдалося завантажити популярні товари",
        };
    }
}

export async function getAllProducts(params = {}, categoryId, locale = "ua", options = {}) {
    const { throwOnHttpError = false } = options;
    try {
        const queryParams = new URLSearchParams();
        const paramsNorm = normalizeCardsQueryParams(params);
        const merged = mergeCatalogQuery(paramsNorm, locale);

        if (categoryId !== undefined) {
            queryParams.append("categoryId", categoryId);
            queryParams.append("categoryInclude", "branch");
        }

        for (const [key, value] of Object.entries(merged)) {
            if (value === undefined || value === null) {
                continue;
            }
            if (key === QUERY_CATEGORY_IDS) {
                const json = normalizeCategoryIdsForCardsQuery(value);
                if (json !== undefined) {
                    queryParams.append(key, json);
                }
                continue;
            }
            if (Array.isArray(value)) {
                const first = value.length ? value[0] : undefined;
                if (first === undefined) {
                    continue;
                }
                let stringValue;
                if (typeof first === "object") {
                    stringValue = JSON.stringify(first);
                } else {
                    stringValue = String(first);
                }
                queryParams.append(key, stringValue);
                continue;
            }
            let stringValue;
            if (typeof value === "object") {
                stringValue = JSON.stringify(value);
            } else {
                stringValue = String(value);
            }
            queryParams.append(key, stringValue);
        }

        if (!queryParams.has("limit")) {
            queryParams.set("limit", String(CATALOG_PRODUCTS_PAGE_SIZE));
        }

        const url = `${process.env.NEXT_PUBLIC_API_URL}/catalog/cards?${queryParams.toString()}`;

        const emptyCards = () => ({
            items: [],
            meta: {
                total: 0,
                page: 1,
                pages: 0,
                limit: CATALOG_PRODUCTS_PAGE_SIZE,
            },
        });

        if (!process.env.NEXT_PUBLIC_API_URL) {
            if (throwOnHttpError) {
                throw new Error("NEXT_PUBLIC_API_URL is not configured");
            }
            return emptyCards();
        }

        const response = await fetch(url);

        if (!response.ok) {
            if (throwOnHttpError && response.status >= 500) {
                throw new Error(
                    `Catalog cards failed with status ${response.status}`,
                );
            }
            return emptyCards();
        }

        const data = await response.json();
        if (!data || typeof data !== "object") {
            if (throwOnHttpError) {
                throw new Error("Catalog cards returned invalid JSON");
            }
            return emptyCards();
        }
        if (!Array.isArray(data.items)) {
            return { ...data, items: [] };
        }
        return data;
    } catch (error) {
        if (throwOnHttpError) {
            throw error instanceof Error ? error : new Error(String(error));
        }
        return {
            items: [],
            meta: {
                total: 0,
                page: 1,
                pages: 0,
                limit: CATALOG_PRODUCTS_PAGE_SIZE,
            },
        };
    }
}

export async function getAllFilters(params = {}, categoryId, _locale = "ua") {
    try {
        const queryParams = new URLSearchParams();
        const paramsNorm = normalizeCardsQueryParams(params);
        const merged = mergeFacetQuery(paramsNorm);

        for (const [key, value] of Object.entries(merged)) {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => queryParams.append(key, v));
                } else {
                    queryParams.append(key, String(value));
                }
            }
        }

        queryParams.append("sticky", "true");
        if (categoryId !== undefined) {
            queryParams.append("categoryId", categoryId);
            queryParams.append("categoryInclude", "branch");
        }

        const url = `${process.env.NEXT_PUBLIC_API_URL}/catalog/facets?${queryParams.toString()}`;

        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            return { facets: {} };
        }

        const json = await response.json();
        return json && typeof json === "object"
            ? json
            : { facets: {} };
    } catch (error) {
        return { facets: {} };
    }
}

export async function getCharacteristicsMeta(params = {}) {
    try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        if (!base || String(base).trim() === "") {
            return null;
        }

        const queryParams = new URLSearchParams();
        if (params.status != null && String(params.status).trim() !== "") {
            queryParams.set("status", String(params.status));
        }

        const qs = queryParams.toString();
        const url = `${String(base).replace(/\/$/, "")}/catalog/characteristics/meta${qs ? `?${qs}` : ""}`;

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch {
        return null;
    }
}

export async function getProductBySlug(slug) {
    try {
        if (!process.env.NEXT_PUBLIC_API_URL) {
            console.warn("NEXT_PUBLIC_API_URL is not defined");
            return null;
        }

        if (!slug) {
            console.warn("Slug is required to fetch PDP");
            return null;
        }

        const encoded = encodeURIComponent(String(slug).trim());
        const url = `${process.env.NEXT_PUBLIC_API_URL}/catalog/groups/${encoded}`;

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Product with slug "${slug}" not found (404)`);
                return null;
            }
            throw new Error(`Failed to fetch product PDP. Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching PDP by slug:", error);
        return null;
    }
}