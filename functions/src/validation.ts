const FORBIDDEN_PROTO_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function hasForbiddenKeys(value: unknown, maxDepth: number = 20): boolean {
  if (maxDepth < 0 || typeof value !== "object" || value === null) {
    return false;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasForbiddenKeys(item, maxDepth - 1)) return true;
    }
    return false;
  }
  for (const key of Object.getOwnPropertyNames(value)) {
    if (FORBIDDEN_PROTO_KEYS.has(key)) {
      return true;
    }
    if (hasForbiddenKeys((value as Record<string, unknown>)[key], maxDepth - 1)) {
      return true;
    }
  }
  return false;
}

export function sanitizePlainObject(value: unknown, maxDepth: number = 10): Record<string, unknown> {
  if (maxDepth < 0 || !isPlainObject(value)) return {};
  const out: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    if (FORBIDDEN_PROTO_KEYS.has(key)) continue;
    const child = value[key];
    if (Array.isArray(child)) {
      out[key] = child.map((item) => (isPlainObject(item) ? sanitizePlainObject(item, maxDepth - 1) : item));
    } else if (isPlainObject(child)) {
      out[key] = sanitizePlainObject(child, maxDepth - 1);
    } else {
      out[key] = child;
    }
  }
  return out;
}
