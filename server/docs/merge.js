import fs from "fs";
import YAML from "yamljs";
import yaml from "js-yaml";

const base = YAML.load("./swagger.mergedv3.yaml");
const user = YAML.load("./reviews.yaml");

const IAM_ROUTE_PREFIXES = [
  "/auth/",
  "/user",
  "/checkout",
  "/guest-checkout",
  "/create-mono-payment",
  "/webhook-mono",
  "/create-mono-installment",
  "/webhook-mono-installment",
  "/sync-installments-confirm",
];

function normalizePathKey(pathKey) {
  if (pathKey === "/catalog/ping") return null;

  if (pathKey === "/service/health") {
    return "/health";
  }

  if (IAM_ROUTE_PREFIXES.some((prefix) => pathKey === prefix || pathKey.startsWith(prefix))) {
    return pathKey.startsWith("/iam/") ? pathKey : `/iam${pathKey}`;
  }

  return pathKey;
}

function normalizePaths(paths = {}) {
  const normalized = {};

  for (const [pathKey, pathValue] of Object.entries(paths)) {
    const nextKey = normalizePathKey(pathKey);
    if (!nextKey) continue;

    if (nextKey === "/health") {
      normalized[nextKey] = {
        ...pathValue,
        get: pathValue?.get
          ? {
              ...pathValue.get,
              servers: [{ url: "/" }],
            }
          : pathValue?.get,
      };
      continue;
    }

    normalized[nextKey] = pathValue;
  }

  return normalized;
}

const merged = {
  ...base,
  paths: {
    ...normalizePaths(base.paths || {}),
    ...normalizePaths(user.paths || {}),
  },
  components: {
    ...(base.components || {}),
    schemas: {
      ...(base.components?.schemas || {}),
      ...(user.components?.schemas || {}),
    },
  },
};

fs.writeFileSync("./swagger.mergedv4.yaml", yaml.dump(merged, { noRefs: true }));
console.log("swagger.mergedv4.yaml created");