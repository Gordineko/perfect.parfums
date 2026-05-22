export function makeOptionKey(optionValues = []) {
  // ✅ без JSON.stringify => не будет "\"orange\"|30"
  return optionValues.map((v) => String(v)).join("|");
}

export function makeOptionMapFromAxes({ axes = [], optionValues = [] }) {
  // axes: [{axisId:"A1"}, {axisId:"A2"}]
  const map = {};
  for (let i = 0; i < axes.length; i++) {
    const axisId = axes[i]?.axisId;
    if (!axisId) continue;
    const value = optionValues[i];
    // null/undefined не пишем
    if (value === undefined || value === null) continue;
    map[axisId] = value;
  }
  return map;
}
