import express from "express";

const MEEST_API_BASE_URL =
  process.env.MEEST_API_BASE_URL || "https://api.meest.com/v3.0/openAPI";
const MEEST_API_TOKEN = String(process.env.MEEST_API_TOKEN || "").trim();
const MEEST_DEFAULT_COUNTRY_ID = String(
  process.env.MEEST_DEFAULT_COUNTRY_ID || "c35b6195-4ea3-11de-8591-001d600938f8"
).trim();
const MEEST_DEFAULT_COUNTRY_CODE = String(
  process.env.MEEST_DEFAULT_COUNTRY_CODE || "UA"
)
  .trim()
  .toUpperCase();
const MEEST_DEFAULT_COUNTRY_NAME = String(
  process.env.MEEST_DEFAULT_COUNTRY_NAME || "УКРАЇНА"
).trim();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => UUID_RE.test(String(value || ""));

const asText = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }
  return "";
};

const DEFAULT_MEEST_COUNTRIES = [
  { Ref: "UA", Description: "УКРАЇНА", countryID: "c35b6195-4ea3-11de-8591-001d600938f8" },
  { Ref: "PL", Description: "ПОЛЬЩА" },
  { Ref: "DE", Description: "НІМЕЧЧИНА" },
  { Ref: "CZ", Description: "ЧЕХІЯ" },
  { Ref: "SK", Description: "СЛОВАЧЧИНА" },
  { Ref: "RO", Description: "РУМУНІЯ" },
  { Ref: "HU", Description: "УГОРЩИНА" },
  { Ref: "LT", Description: "ЛИТВА" },
  { Ref: "LV", Description: "ЛАТВІЯ" },
  { Ref: "EE", Description: "ЕСТОНІЯ" },
  { Ref: "MD", Description: "МОЛДОВА" },
  { Ref: "BG", Description: "БОЛГАРІЯ" },
  { Ref: "GR", Description: "ГРЕЦІЯ" },
  { Ref: "IT", Description: "ІТАЛІЯ" },
  { Ref: "ES", Description: "ІСПАНІЯ" },
  { Ref: "PT", Description: "ПОРТУГАЛІЯ" },
  { Ref: "FR", Description: "ФРАНЦІЯ" },
  { Ref: "NL", Description: "НІДЕРЛАНДИ" },
  { Ref: "BE", Description: "БЕЛЬГІЯ" },
  { Ref: "AT", Description: "АВСТРІЯ" },
  { Ref: "GB", Description: "ВЕЛИКА БРИТАНІЯ" },
  { Ref: "IE", Description: "ІРЛАНДІЯ" },
  { Ref: "US", Description: "США" },
  { Ref: "CA", Description: "КАНАДА" },
];

const parseCountriesFromEnv = () => {
  const raw = String(process.env.MEEST_COUNTRIES_JSON || "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        Ref: asText(item?.Ref, item?.countryCode).toUpperCase(),
        Description: asText(item?.Description, item?.countryName),
        countryID: asText(item?.countryID, item?.id),
      }))
      .filter((item) => item.Ref && item.Description);
  } catch {
    return [];
  }
};

const getConfiguredCountries = () => {
  const fromEnv = parseCountriesFromEnv();
  const fromDefaults = DEFAULT_MEEST_COUNTRIES.filter(
    (item) =>
      !fromEnv.some((x) => String(x.Ref || "").toUpperCase() === String(item.Ref || "").toUpperCase())
  );
  const merged = [...fromEnv, ...fromDefaults];
  const hasDefault = fromEnv.some(
    (item) =>
      item.Ref === MEEST_DEFAULT_COUNTRY_CODE ||
      item.countryID === MEEST_DEFAULT_COUNTRY_ID
  );

  if (!hasDefault) {
    merged.unshift({
      Ref: MEEST_DEFAULT_COUNTRY_CODE,
      Description: MEEST_DEFAULT_COUNTRY_NAME,
      countryID: MEEST_DEFAULT_COUNTRY_ID,
    });
  }

  return merged;
};

const buildStaticCountries = () => {
  try {
    const regionCodes = Intl.supportedValuesOf("region");
    const names = new Intl.DisplayNames(["uk", "en"], { type: "region" });

    const staticCountries = regionCodes
      .map((code) => ({
        Ref: String(code || "").toUpperCase(),
        Description: asText(names.of(code), code),
      }))
      .filter((item) => item.Ref && item.Description)
      .sort((a, b) => a.Description.localeCompare(b.Description, "uk"));

    const configured = getConfiguredCountries();
    const map = new Map();

    for (const item of staticCountries) {
      map.set(item.Ref, item);
    }

    for (const item of configured) {
      const ref = String(item.Ref || "").toUpperCase();
      if (!ref) continue;
      map.set(ref, {
        Ref: ref,
        Description: item.Description,
        countryID: item.countryID,
      });
    }

    return Array.from(map.values());
  } catch {
    return getConfiguredCountries();
  }
};

const STATIC_COUNTRIES = buildStaticCountries();

const normalizeCountries = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    Ref: asText(item?.alfaCode2, item?.countryCode, item?.countryID, item?.id).toUpperCase(),
    Description: asText(
      item?.countryDescr?.descrUA,
      item?.countryDescr?.descrEN,
      item?.countryName,
      item?.countryCode
    ),
    countryID: asText(item?.countryID),
  }));

const normalizeAreas = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    Ref: asText(item?.regionID, item?.id),
    Description: asText(
      item?.regionDescr?.descrUA,
      item?.regionDescr?.descrEN,
      item?.regionName
    ),
  }));

const normalizeCities = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    Ref: asText(item?.cityID, item?.id),
    Description: asText(
      item?.cityDescr?.descrUA,
      item?.cityDescr?.descrEN,
      item?.cityName
    ),
  }));

const normalizeBranches = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    Ref: asText(item?.branchID, item?.id),
    Description: asText(
      item?.branchDescr?.descrUA,
      item?.branchDescr?.descrEN,
      item?.branchDescr,
      item?.branchName
    ),
  }));

const toItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

async function callMeest(methodPath, body = {}) {
  if (!MEEST_API_TOKEN) {
    const err = new Error("MEEST_API_TOKEN is not configured");
    err.status = 500;
    throw err;
  }

  const response = await fetch(`${MEEST_API_BASE_URL}/${methodPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      token: MEEST_API_TOKEN,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(text || `Meest API error: ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

async function lookupCountryInMeest(countryCode, countryName) {
  const namesToTry = [asText(countryName), asText(countryName).toUpperCase()].filter(Boolean);
  const requests = [];

  for (const name of namesToTry) {
    requests.push({ filters: { countryDescr: name } });
    requests.push({ filters: { countryName: name } });
    requests.push({ filters: { countryDescr: `%${name}%` } });
    requests.push({ filters: { countryName: `%${name}%` } });
  }

  for (const body of requests) {
    try {
      const payload = await callMeest("countrySearch", body);
      const countries = normalizeCountries(toItems(payload));

      const exactByCode = countries.find(
        (item) => asText(item.Ref).toUpperCase() === countryCode
      );
      if (exactByCode?.countryID) return exactByCode;

      const first = countries[0];
      if (first?.countryID) return first;
    } catch {
      // Try next name variant.
    }
  }

  return null;
}

async function resolveCountryFilters(input = {}) {
  const rawRef = asText(input?.countryRef, input?.countryId, input?.countryCode);

  if (!rawRef && MEEST_DEFAULT_COUNTRY_ID) {
    return {
      countryID: MEEST_DEFAULT_COUNTRY_ID,
      countryDescr: MEEST_DEFAULT_COUNTRY_NAME,
    };
  }

  if (!rawRef) return null;

  if (isUuid(rawRef)) {
    return { countryID: rawRef, countryDescr: asText(input?.countryName) };
  }

  const normalizedCode = rawRef.toUpperCase();

  const configured = STATIC_COUNTRIES;
  const matched = configured.find(
    (item) =>
      item.Ref.toUpperCase() === normalizedCode ||
      item.Description.toUpperCase() === normalizedCode
  );

  if (matched?.countryID) {
    return {
      countryID: matched.countryID,
      countryDescr: matched.Description,
    };
  }

  const lookedUp = await lookupCountryInMeest(normalizedCode, matched?.Description || rawRef);
  if (lookedUp?.countryID) {
    return {
      countryID: lookedUp.countryID,
      countryDescr: lookedUp.Description || matched?.Description || rawRef,
    };
  }

  if (normalizedCode === MEEST_DEFAULT_COUNTRY_CODE && MEEST_DEFAULT_COUNTRY_ID) {
    return {
      countryID: MEEST_DEFAULT_COUNTRY_ID,
      countryDescr: MEEST_DEFAULT_COUNTRY_NAME,
    };
  }

  return {
    countryDescr: rawRef,
  };
}

export function registerMeest(api) {
  const router = express.Router();

  router.post("/countries", async (_req, res, next) => {
    try {
      const data = STATIC_COUNTRIES;
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post("/areas", async (req, res, next) => {
    try {
      const filters = await resolveCountryFilters(req.body || {});
      if (!filters) {
        return res.status(400).json({ message: "countryRef is required" });
      }

      const payload = await callMeest("regionSearch", {
        filters,
      });
      const data = normalizeAreas(toItems(payload)).filter(
        (x) => x.Ref && x.Description
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post("/cities", async (req, res, next) => {
    try {
      const areaRef = asText(req.body?.areaRef, req.body?.regionId, req.body?.regionID);
      if (!areaRef) {
        return res.status(400).json({ message: "areaRef is required" });
      }

      const countryFilters = await resolveCountryFilters(req.body || {});

      const payload = await callMeest("citySearch", {
        filters: {
          ...(countryFilters || {}),
          regionID: areaRef,
        },
        isDirectory: true,
      });
      const data = normalizeCities(toItems(payload)).filter(
        (x) => x.Ref && x.Description
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post("/branches", async (req, res, next) => {
    try {
      const cityRef = asText(req.body?.cityRef, req.body?.city_id, req.body?.cityId);
      if (!cityRef) {
        return res.status(400).json({ message: "cityRef is required" });
      }

      const areaRef = asText(req.body?.areaRef, req.body?.regionId, req.body?.regionID);
      const countryFilters = await resolveCountryFilters(req.body || {});

      const payload = await callMeest("branchSearch", {
        filters: {
          ...(countryFilters || {}),
          ...(areaRef ? { regionID: areaRef } : {}),
          cityID: cityRef,
        },
        getCobranding: true,
      });
      const data = normalizeBranches(toItems(payload)).filter(
        (x) => x.Ref && x.Description
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  api.use("/meest", router);
}
