// bench-facets.mjs
import { performance } from "node:perf_hooks";

const BASE = process.env.BASE_URL ?? "http://localhost:5005";
const PATH = process.env.PATH_URL ?? "/v1/catalog/facets";
const RUNS = Number(process.env.RUNS ?? 5);

// Укажи здесь параметры запроса (или передавай через ENV ниже)
const params = {
  status: "active",
  categoryId: process.env.CATEGORY_ID ?? "",       // например: "65f...."
  categoryInclude: process.env.CATEGORY_INC ?? "branch",
  q: process.env.Q ?? "",

  onlyAvailable: process.env.ONLY_AVAIL ?? "",     // "true" / "false"
  priceMin: process.env.PRICE_MIN ?? "",
  priceMax: process.env.PRICE_MAX ?? "",

  // JSON-строки (важно: именно строка)
  char: process.env.CHAR ?? "",         // например: {"brand":["Nike","Puma"]}
  offerChar: process.env.OFFER_CHAR ?? "",

  opt: process.env.OPT ?? "",           // например: {"axisId1":["S","M"]}
  sticky: process.env.STICKY ?? "",     // "true" / "false"
};

function buildUrl(base, path, obj) {
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const s = String(v);
    if (!s) continue;
    url.searchParams.set(k, s);
  }
  return url.toString();
}

function ms(n) {
  return Math.round(n * 100) / 100;
}

function stats(values) {
  const arr = [...values].sort((a, b) => a - b);
  const sum = arr.reduce((a, b) => a + b, 0);
  const avg = sum / arr.length;
  const p50 = arr[Math.floor(arr.length * 0.5)];
  const p90 = arr[Math.floor(arr.length * 0.9)];
  return { min: arr[0], p50, p90, max: arr[arr.length - 1], avg };
}

async function oneRun(url) {
  const t0 = performance.now();

  // request start
  const res = await fetch(url, { method: "GET" });

  // TTFB ~ момент когда заголовки пришли (fetch резолвится после headers)
  const tHeaders = performance.now();

  // читаем тело (это может быть заметно, если JSON большой)
  const text = await res.text();
  const tEnd = performance.now();

  let size = text.length;
  let jsonOk = true;
  try { JSON.parse(text); } catch { jsonOk = false; }

  return {
    ok: res.ok,
    status: res.status,
    t_total: tEnd - t0,
    t_ttfb: tHeaders - t0,
    t_body: tEnd - tHeaders,
    size,
    jsonOk,
  };
}

(async () => {
  const url = buildUrl(BASE, PATH, params);
  console.log("URL:", url);

  const totals = [];
  const ttfbs = [];
  const bodys = [];

  for (let i = 1; i <= RUNS; i++) {
    const r = await oneRun(url);
    totals.push(r.t_total);
    ttfbs.push(r.t_ttfb);
    bodys.push(r.t_body);

    console.log(
      `#${i} status=${r.status} ok=${r.ok} jsonOk=${r.jsonOk} size=${r.size}B ` +
      `TTFB=${ms(r.t_ttfb)}ms body=${ms(r.t_body)}ms total=${ms(r.t_total)}ms`
    );
  }

  const sTotal = stats(totals);
  const sTtfb = stats(ttfbs);
  const sBody = stats(bodys);

  console.log("\n=== SUMMARY (ms) ===");
  console.log("TTFB :", Object.fromEntries(Object.entries(sTtfb).map(([k,v]) => [k, ms(v)])));
  console.log("BODY :", Object.fromEntries(Object.entries(sBody).map(([k,v]) => [k, ms(v)])));
  console.log("TOTAL:", Object.fromEntries(Object.entries(sTotal).map(([k,v]) => [k, ms(v)])));
})();