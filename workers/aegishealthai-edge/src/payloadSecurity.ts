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

export function stripForbiddenKeys(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) return {};
  const clean: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    if (!FORBIDDEN_PROTO_KEYS.has(key)) {
      clean[key] = value[key];
    }
  }
  return clean;
}

export function parseJsonSafely(
  rawText: string,
): { ok: true; data: Record<string, unknown> } | { ok: false; status: number; error: string } {
  let sawForbiddenKey = false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText, (key, val) => {
      if (FORBIDDEN_PROTO_KEYS.has(key)) {
        sawForbiddenKey = true;
      }
      return val;
    });
  } catch {
    return { ok: false, status: 400, error: "Malformed JSON body" };
  }

  if (sawForbiddenKey || !isPlainObject(parsed) || hasForbiddenKeys(parsed)) {
    return { ok: false, status: 400, error: "Invalid or forbidden JSON payload structure" };
  }

  return { ok: true, data: parsed };
}

export async function parseSafeJsonBody(
  request: Request,
  maxBytes: number,
  allowEmpty: boolean = false,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  const rawText = await request.text();
  if (rawText.length > maxBytes) {
    return { ok: false, status: 413, error: `Request payload exceeds ${maxBytes} byte limit` };
  }
  if (allowEmpty && rawText.trim().length === 0) {
    return { ok: true, data: {} };
  }
  return parseJsonSafely(rawText);
}
