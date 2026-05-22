export const normalizeUaPhoneDigits = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  let normalized = digits;
  if (!normalized.startsWith("380")) {
    normalized = `380${normalized.replace(/^380/, "")}`;
  }
  return normalized.slice(0, 12);
};

export const formatUaPhone = (value) => {
  const d = normalizeUaPhoneDigits(value);
  if (!d) return "";

  const cc = d.slice(0, 3);
  const op = d.slice(3, 5);
  const p1 = d.slice(5, 8);
  const p2 = d.slice(8, 10);
  const p3 = d.slice(10, 12);

  let res = `+${cc}`;
  if (op) res += ` (${op}`;
  if (op.length === 2) res += `)`;
  if (p1) res += ` ${p1}`;
  if (p2) res += ` ${p2}`;
  if (p3) res += ` ${p3}`;
  return res;
};

export const toUaE164Phone = (value) => {
  const digits = normalizeUaPhoneDigits(value);
  return digits ? `+${digits}` : "";
};

