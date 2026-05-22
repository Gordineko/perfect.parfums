function normalizePresetKey(preset) {
  if (preset && typeof preset === "object") {
    return String(preset.value ?? "");
  }

  return String(preset ?? "");
}

export function mergeAxisPresetValues(existingValues = [], incomingValues = []) {
  const result = [];
  const indexByKey = new Map();

  function upsert(rawPreset) {
    const key = normalizePresetKey(rawPreset);
    if (!key) return;

    const currentIndex = indexByKey.get(key);
    if (currentIndex === undefined) {
      indexByKey.set(key, result.length);
      result.push(rawPreset);
      return;
    }

    const currentPreset = result[currentIndex];
    if (
      (!currentPreset || typeof currentPreset !== "object") &&
      rawPreset &&
      typeof rawPreset === "object"
    ) {
      result[currentIndex] = rawPreset;
    }
  }

  existingValues.forEach(upsert);
  incomingValues.forEach(upsert);

  return result;
}

export function mergeVariationTemplateAxes(existingAxes = [], incomingAxes = []) {
  const incomingById = new Map(
    incomingAxes
      .filter((axis) => axis?.axisId)
      .map((axis) => [String(axis.axisId), axis])
  );

  const result = [];

  for (const axis of existingAxes || []) {
    if (!axis?.axisId) continue;

    const axisId = String(axis.axisId);
    const incomingAxis = incomingById.get(axisId);

    if (!incomingAxis) {
      result.push(axis);
      continue;
    }

    result.push({
      ...axis,
      title: {
        ua: axis?.title?.ua || incomingAxis?.title?.ua || "",
        en: axis?.title?.en || incomingAxis?.title?.en || "",
      },
      type: axis?.type || incomingAxis?.type || "string",
      unit: axis?.unit ?? incomingAxis?.unit ?? null,
      valuesPreset: mergeAxisPresetValues(
        axis?.valuesPreset || [],
        incomingAxis?.valuesPreset || []
      ),
    });

    incomingById.delete(axisId);
  }

  for (const axis of incomingAxes || []) {
    if (!axis?.axisId) continue;
    if (!incomingById.has(String(axis.axisId))) continue;
    result.push(axis);
  }

  return result;
}