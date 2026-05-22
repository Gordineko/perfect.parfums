export function isSizeFacet(metaKey, meta) {
  const key = String(metaKey ?? "").toLowerCase();
  const ua = meta?.title?.ua?.toLowerCase() ?? "";
  const en = meta?.title?.en?.toLowerCase() ?? "";
  const combined = `${key} ${ua} ${en}`;
  return /(insole|sole|stel|stelk|rozmir|розмір|size_cm|sizesm|foot)/i.test(
    combined,
  );
}

export function isColorFacet(metaKey, meta) {
  const key = String(metaKey ?? "").toLowerCase();
  const ua = meta?.title?.ua?.toLowerCase() ?? "";
  const en = meta?.title?.en?.toLowerCase() ?? "";
  const combined = `${key} ${ua} ${en}`;
  return (
    key === "color" ||
    key === "colour" ||
    /(color|colour|колір)/i.test(combined)
  );
}

export function getColorHexFromBucket(bucket) {
  const candidates = [bucket?.value, bucket?.value?.value];
  for (const v of candidates) {
    if (v && typeof v === "object") {
      if (v.hex) return v.hex;
      if (v.colorHex) return v.colorHex;
      if (v.color) return v.color;
    }
  }
  return null;
}

export function getBucketLabel(bucket, locale, filterType) {
  if (filterType === "group") {
    return (
      bucket?.value?.label?.[locale] ??
      bucket?.value?.label?.ua ??
      String(bucket?.value?.value ?? "")
    );
  }
  return (
    bucket?.label?.[locale] ??
    bucket?.label?.ua ??
    String(bucket?.value ?? "")
  );
}

export function getBucketValueString(bucket, filterType) {
  if (filterType === "group") {
    return String(bucket?.value?.value ?? "");
  }
  return String(bucket?.value ?? "");
}

export function getBucketCount(bucket) {
  return (
    bucket?.doc_count ??
    bucket?.count ??
    bucket?.docCount ??
    null
  );
}

export function isVariantFacet(metaKey, meta) {
  return isSizeFacet(metaKey, meta) || isColorFacet(metaKey, meta);
}

export function toggleSelectionInRecord(record, key, value, checked) {
  const currentValue = record[key];

  if (checked) {
    if (Array.isArray(currentValue)) {
      if (!currentValue.includes(value)) {
        record[key] = [...currentValue, value];
      }
    } else if (currentValue !== undefined) {
      record[key] = [currentValue, value];
    } else {
      record[key] = value;
    }
    return;
  }

  if (Array.isArray(currentValue)) {
    const filtered = currentValue.filter((v) => v !== value);
    if (filtered.length === 0) {
      delete record[key];
    } else if (filtered.length === 1) {
      record[key] = filtered[0];
    } else {
      record[key] = filtered;
    }
  } else if (currentValue === value) {
    delete record[key];
  }
}

export function isFacetMultiSelectType(type) {
  return (
    type === "multiselect" ||
    type === "select" ||
    type === "number" ||
    type === "string"
  );
}
