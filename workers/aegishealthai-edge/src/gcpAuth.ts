import { isPlainObject, parseJsonSafely } from "./payloadSecurity";

export type GcpServiceAccountKey = {
  client_email: string;
  private_key: string;
  token_uri?: string;
  project_id?: string;
};

const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";
const GCP_CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const TOKEN_REFRESH_MARGIN_SEC = 120;

const gcpTokenCache = new Map<
  string,
  { token: string; expiresAtMs: number; projectId?: string }
>();

export function resetGcpTokenCacheForTest(): void {
  gcpTokenCache.clear();
}

export function parseServiceAccountKey(rawJson: string): GcpServiceAccountKey | null {
  const parsed = parseJsonSafely(rawJson);
  if (!parsed.ok) return null;
  const data = parsed.data;

  const clientEmail = typeof data.client_email === "string" ? data.client_email.trim() : "";
  const privateKey = typeof data.private_key === "string" ? data.private_key.trim() : "";
  if (!clientEmail || !clientEmail.includes("@")) return null;
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) return null;

  let tokenUri: string | undefined;
  if (data.token_uri !== undefined) {
    if (typeof data.token_uri !== "string" || !data.token_uri.startsWith("https://")) {
      return null;
    }
    tokenUri = data.token_uri.trim();
  }

  const projectId =
    typeof data.project_id === "string" && data.project_id.trim().length > 0
      ? data.project_id.trim()
      : undefined;

  return {
    client_email: clientEmail,
    private_key: privateKey,
    token_uri: tokenUri,
    project_id: projectId,
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function utf8ToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

function decodePkcs8Pem(pem: string): ArrayBuffer {
  const withoutHeader = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "");
  let cleanB64 = "";
  for (let i = 0; i < withoutHeader.length; i++) {
    const ch = withoutHeader[i];
    if (ch !== "\r" && ch !== "\n" && ch !== " " && ch !== "\t") {
      cleanB64 += ch;
    }
  }
  const binary = atob(cleanB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function getGcpAccessToken(
  saJson: string,
): Promise<{ token: string; projectId?: string }> {
  const key = parseServiceAccountKey(saJson);
  if (!key) {
    throw new Error("Invalid GCP service account JSON configuration");
  }

  const nowMs = Date.now();
  const cached = gcpTokenCache.get(key.client_email);
  if (cached && cached.expiresAtMs > nowMs) {
    return { token: cached.token, projectId: cached.projectId };
  }

  const tokenUri = key.token_uri || DEFAULT_TOKEN_URI;
  const nowSec = Math.floor(nowMs / 1000);
  const headerB64 = utf8ToBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimB64 = utf8ToBase64Url(
    JSON.stringify({
      iss: key.client_email,
      scope: GCP_CLOUD_PLATFORM_SCOPE,
      aud: tokenUri,
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  );
  const signingInput = `${headerB64}.${claimB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    decodePkcs8Pem(key.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const assertion = `${signingInput}.${bytesToBase64Url(new Uint8Array(signatureBuffer))}`;

  const tokenRes = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`GCP OAuth2 token exchange failed with HTTP ${tokenRes.status}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: unknown;
    expires_in?: unknown;
  };
  if (typeof tokenData.access_token !== "string" || tokenData.access_token.length === 0) {
    throw new Error("GCP OAuth2 response missing access_token");
  }

  const expiresInSec =
    typeof tokenData.expires_in === "number" && Number.isFinite(tokenData.expires_in)
      ? tokenData.expires_in
      : 3600;
  const effectiveTtlSec = Math.max(60, expiresInSec - TOKEN_REFRESH_MARGIN_SEC);

  gcpTokenCache.set(key.client_email, {
    token: tokenData.access_token,
    expiresAtMs: nowMs + effectiveTtlSec * 1000,
    projectId: key.project_id,
  });

  return { token: tokenData.access_token, projectId: key.project_id };
}

const LEGACY_VERTEX_FLASH_ALIASES = new Set([
  "",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
]);

const LEGACY_VERTEX_PRO_ALIASES = new Set([
  "gemini-3.1-pro-preview",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
]);

export function resolveVertexModel(requestedModel: string): string {
  const trimmed = requestedModel.trim();
  if (LEGACY_VERTEX_FLASH_ALIASES.has(trimmed)) {
    return "gemini-4-hydrogen";
  }
  if (LEGACY_VERTEX_PRO_ALIASES.has(trimmed)) {
    return "gemini-4-argon";
  }
  return trimmed;
}

export function normalizeVertexContents(contents: unknown): unknown {
  if (typeof contents === "string") {
    return [{ role: "user", parts: [{ text: contents }] }];
  }
  if (Array.isArray(contents)) {
    return contents.map((item) => {
      if (typeof item === "string") {
        return { role: "user", parts: [{ text: item }] };
      }
      if (isPlainObject(item) && typeof item.role !== "string") {
        return { ...item, role: "user" };
      }
      return item;
    });
  }
  return contents;
}

export function normalizeVertexSystemInstruction(si: unknown): unknown {
  if (si === undefined || si === null) return undefined;
  if (typeof si === "string") {
    return { role: "user", parts: [{ text: si }] };
  }
  if (isPlainObject(si)) {
    if (typeof si.text === "string" && !si.parts) {
      return { role: "user", parts: [{ text: si.text }] };
    }
    if (typeof si.role !== "string" && si.parts) {
      return { ...si, role: "user" };
    }
  }
  return si;
}

export function sanitizeDiscoverySnippet(raw: string): string {
  if (!raw) return "";
  const bounded = raw.slice(0, 8192);
  let stripped = "";
  let inTag = false;
  for (let i = 0; i < bounded.length; i++) {
    const ch = bounded[i];
    if (ch === "<") {
      inTag = true;
      continue;
    }
    if (ch === ">") {
      if (inTag) {
        inTag = false;
        continue;
      }
    }
    if (!inTag) {
      stripped += ch;
    }
  }

  const decoded = stripped
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");

  let collapsed = "";
  let prevSpace = true;
  for (let i = 0; i < decoded.length; i++) {
    const ch = decoded[i];
    const isWs = ch === " " || ch === "\t" || ch === "\r" || ch === "\n";
    if (isWs) {
      if (!prevSpace) {
        collapsed += " ";
        prevSpace = true;
      }
    } else {
      collapsed += ch;
      prevSpace = false;
    }
  }

  return collapsed.trim().slice(0, 1000);
}
