export function createContainer() {
  const map = new Map();

  return {
    set: (key, value) => map.set(key, value),
    has: (key) => map.has(key),
    get: (key) => {
      if (!map.has(key)) throw new Error(`Dependency not found: ${String(key)}`);
      return map.get(key);
    },
  };
}
