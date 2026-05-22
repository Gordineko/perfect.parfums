export function isLikelyMongoId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export function wishlistItemGroupId(row) {
  if (!row || typeof row !== "object") {
    return null;
  }
  const candidates = [row.groupId, row.group?._id, row._id];
  for (const c of candidates) {
    const s = c != null ? String(c).trim() : "";
    if (s && isLikelyMongoId(s)) {
      return s;
    }
  }
  return null;
}

export function wishlistRowKey(row) {
  const mongo = wishlistItemGroupId(row);
  if (mongo) {
    return mongo;
  }
  const fallback = row?._id != null ? String(row._id).trim() : "";
  return fallback.length ? fallback : null;
}

export function collectWishlistGroupIdsFromItems(items) {
  const out = [];
  const seen = new Set();
  if (!Array.isArray(items)) {
    return out;
  }
  for (const row of items) {
    const gid = wishlistItemGroupId(row);
    if (!gid || seen.has(gid)) {
      continue;
    }
    seen.add(gid);
    out.push(gid);
  }
  return out;
}

export function serverWishlistGroupIdSet(serverArr) {
  const set = new Set();
  if (!Array.isArray(serverArr)) {
    return set;
  }
  for (const row of serverArr) {
    const id = row?._id != null ? String(row._id).trim() : "";
    if (id) {
      set.add(id);
    }
  }
  return set;
}

export function wishlistContainsGroupForProduct(items, product) {
  const arr = Array.isArray(items) ? items : [];
  const key = wishlistRowKey(product);
  if (!key) {
    return false;
  }
  return arr.some((row) => wishlistRowKey(row) === key);
}
