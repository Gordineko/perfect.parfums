// src/Modules/Article/Controllers/articles.controller.js
import mongoose from "mongoose";
import { articleService } from "../Services/Articles.service.js";
import { slugify, ensureUniqueSlug } from "./_slugify.js";

// ===== helpers

const pickLang = (q) => {
  const lang = String(q.lang || "").toLowerCase();
  return lang === "en" ? "en" : "uk";
};

function normalizeSort(sortRaw, lang = "uk") {
  const raw = String(sortRaw || "").trim();
  if (!raw) return "-publishedAt";

  const colon = raw.split(":");
  if (colon.length === 2) {
    const [field, dir] = colon;
    const isDesc = String(dir).toLowerCase() === "desc";
    if (field === "category") return (isDesc ? "-" : "") + `category.${lang}`;
    return (isDesc ? "-" : "") + field;
  }

  const isDesc = raw.startsWith("-");
  const field = isDesc ? raw.slice(1) : raw;
  if (field === "category") return (isDesc ? "-" : "") + `category.${lang}`;
  return raw;
}

function buildFilter(q) {
  const f = {};
  const lang = pickLang(q);

  if (q.category) f[`category.${lang}`] = q.category;
  if (q.tag) f[`tags.${lang}`] = String(q.tag);

  if (q.active != null) {
    const val = String(q.active).toLowerCase();
    f.isActive = ["1", "true", "yes", "on"].includes(val);
  }

  if (q.from) {
    f.publishedAt = { ...(f.publishedAt || {}), $gte: new Date(q.from) };
  }
  if (q.to) {
    f.publishedAt = { ...(f.publishedAt || {}), $lte: new Date(q.to) };
  }

  return f;
}

function coerceBoolean(value, defaultValue = undefined) {
  if (value === undefined) return defaultValue;
  const v = String(value).toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return defaultValue;
}

export function normalizeTags(input) {
  // already array
  if (Array.isArray(input)) {
    return input
      .flatMap((t) => {
        if (typeof t === "string") return [t];
        if (t && typeof t === "object") return [t.ua || t.uk || t.en || ""];
        return [];
      })
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }

  // string input (could be "tag1, tag2" OR "[ { uk: '1'... } ]")
  const s = String(input || "").trim();
  if (!s) return [];

  // simple csv
  if (!s.includes("{")) {
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }

  // try to extract values from "{ ua|uk|en: '...' }"
  const out = [];
  const re = /(ua|uk|en)\s*:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(s))) out.push(m[2]);

  return out.map((x) => x.trim()).filter(Boolean);
}


function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

// ===== controller

export function articlesController(router) {
  // LIST
  router.get("/", async (req, res, next) => {
    try {
      const lang = pickLang(req.query);
      const filter = buildFilter(req.query);

      const page = Number(req.query.page || 1) || 1;
      const limit = Number(req.query.limit || 20) || 20;
      const sort = normalizeSort(req.query.sort, lang);
      const select = req.query.select || "";
      const count =
        req.query.count != null ? coerceBoolean(req.query.count, false) : false;
      const search = req.query.q || "";
      const preferCategory = req.query.preferCategory;

      const out = await articleService.list(filter, {
        page,
        limit,
        sort,
        select,
        count,
        search,
        lang,
        preferCategory,
      });

      res.json(out);
    } catch (e) {
      next(e);
    }
  });

  // PUBLIC: one article by slug
  router.get("/:slug", async (req, res, next) => {
    try {
      const doc = await articleService.getBySlug(req.params.slug);

      if (!doc || doc.isActive === false) {
        return res.status(404).json({ message: "Not found" });
      }

      res.json(doc);
    } catch (e) {
      next(e);
    }
  });

  // CREATE (admin)
  router.post("/", async (req, res, next) => {
    try {
      const payload = { ...req.body };

      if (payload.publishedAt) payload.publishedAt = new Date(payload.publishedAt);
      if (payload.tags) payload.tags = normalizeTags(payload.tags);

      if (payload.isActive !== undefined) {
        payload.isActive = coerceBoolean(payload.isActive, true);
      }

      let incoming = payload.slug && String(payload.slug).trim();
      if (!incoming) {
        const base = (payload.title && (payload.title.uk || payload.title.en)) || "";
        incoming = slugify(base);
      } else {
        incoming = slugify(incoming);
      }

      payload.slug = await ensureUniqueSlug(
        incoming,
        (s) => articleService.existsBySlug(s)
      );

      const created = await articleService.create(payload);
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  });

  // ✅ UPDATE (admin) – поддерживаем и id, и slug
  router.patch("/:idOrSlug", async (req, res, next) => {
    try {
      const key = String(req.params.idOrSlug || "").trim();
      const patch = { ...req.body };

      // найдём документ, чтобы:
      // 1) исключать его _id при ensureUniqueSlug
      // 2) корректно обновлять по slug
      const existing = await articleService.getByIdOrSlug(key);
      if (!existing) return res.status(404).json({ message: "Not found" });

      if (patch.publishedAt) patch.publishedAt = new Date(patch.publishedAt);
      if (patch.tags) patch.tags = normalizeTags(patch.tags);

      if (patch.isActive !== undefined) {
        patch.isActive = coerceBoolean(patch.isActive, true);
      }

      // slug recalculation + uniqueness (exclude current _id)
      if (!patch.slug && patch.title && (patch.title.uk || patch.title.en)) {
        const base = patch.title.uk || patch.title.en;
        patch.slug = await ensureUniqueSlug(
          slugify(base),
          (s) => articleService.existsBySlug(s, existing._id)
        );
      } else if (patch.slug) {
        patch.slug = await ensureUniqueSlug(
          slugify(patch.slug),
          (s) => articleService.existsBySlug(s, existing._id)
        );
      }

      // обновляем по тому, что пришло (id или slug)
      const updated = await articleService.updateByIdOrSlug(key, patch);
      res.json(updated);
    } catch (e) {
      next(e);
    }
  });

  // DELETE (admin)
  router.delete("/:id", async (req, res, next) => {
    try {
      const out = await articleService.remove(req.params.id);
      res.json(out);
    } catch (e) {
      next(e);
    }
  });
}
