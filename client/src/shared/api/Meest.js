const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const getOptionValue = (item) =>
  item?.Ref ||
  item?.ref ||
  item?.id ||
  item?.ID ||
  item?.uuid ||
  item?.code ||
  item?.Code ||
  item?.value ||
  "";

const getOptionLabel = (item) =>
  item?.Description ||
  item?.description ||
  item?.name ||
  item?.Name ||
  item?.title ||
  item?.Title ||
  item?.label ||
  "";

const normalizeOptions = (items) =>
  items
    .map((item) => ({
      Ref: String(getOptionValue(item) || "").trim(),
      Description: String(getOptionLabel(item) || "").trim(),
    }))
    .filter((item) => item.Ref && item.Description);

const request = async (path, payload = {}) => {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_BASE}/meest/${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Meest API error: ${response.status}`);
  }

  const data = await response.json();
  return normalizeOptions(extractItems(data));
};

export const getMeestCountries = () => request("countries");

export const getMeestAreas = (countryRef) => request("areas", { countryRef });

export const getMeestCities = (areaRef, options = {}) =>
  request("cities", {
    areaRef,
    countryRef: options.countryRef,
  });

export const getMeestBranches = (cityRef, options = {}) =>
  request("branches", {
    cityRef,
    areaRef: options.areaRef,
    countryRef: options.countryRef,
  });
