/**
 * Cloudflare Worker: aegishealthai-edge
 * Endpoints:
 * - POST /api/ai/generate -> Proxies Gemini API with Firebase Auth & App Check verification
 * - GET  /api/health      -> Health probe
 *
 * Authentication Strategy:
 * 1. Primary: Firebase ID Token (JWT RS256 cryptographically verified via Google JWKs)
 * 2. Secondary: Firebase App Check (reCAPTCHA v3 verified via X-Firebase-AppCheck)
 *
 * There is NO shared-secret / static bearer path: only a verified Firebase ID
 * token authenticates a request (the former EDGE_SHARED_SECRET fallback was
 * removed because a copy of that bearer once shipped in the public bundle).
 *
 * Client aborts are propagated to the upstream Gemini fetch via request.signal
 * (requires the `enable_request_signal` compatibility flag, set in wrangler.json).
 *
 * Specialist Lounge requests (feature flag "specialist", sent by the SPA as the
 * `aegisFeature` body field or `X-Aegis-Feature` header) additionally get a
 * server-side maxOutputTokens ceiling and a patient-directed-dosing output
 * guard (see ./dosingGuard.ts). Other routes (e.g. report extraction) are
 * never passed through the guard.
 */

import {
  LOUNGE_FEATURE,
  applyLoungeOutputGuard,
  clampLoungeGenerationConfig,
  resolveFeature,
} from "./dosingGuard";
import {
  isPlainObject,
  parseJsonSafely,
  parseSafeJsonBody,
} from "./payloadSecurity";
import {
  getGcpAccessToken,
  normalizeVertexContents,
  normalizeVertexSystemInstruction,
  resolveVertexModel,
  sanitizeDiscoverySnippet,
} from "./gcpAuth";

export interface Env {
  GEMINI_API_KEY?: string;
  GCP_VERTEX_SA_JSON?: string;
  GCP_VERTEX_LOCATION?: string;
  DISCOVERY_ENGINE_ID?: string;
  DISCOVERY_ENGINE_LOCATION?: string;
  NVIDIA_NIM_API_KEY?: string;
  BEDROCK_MANTLE_API_KEY?: string;
  BEDROCK_MANTLE_ENDPOINT?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_ENFORCE?: string;
  LAB_WEBHOOK_SECRET?: string;
  FIREBASE_PROJECT_ID?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CF_AI_GATEWAY_ID?: string;
  CF_AIG_TOKEN?: string;
  IP_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  USER_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

const DEFAULT_FIREBASE_PROJECT_ID = "aegis-health-app-90697";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const ALLOWED_ORIGINS = new Set([
  "https://aegishealthai.co.in",
  "https://www.aegishealthai.co.in",
  "https://aegis-health-app-90697.web.app",
  "https://aegis-health-app-90697.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:4173",
]);

// In-memory JWK cache with 6-hour TTL
let jwksCache: { keys: any[]; fetchedAt: number } | null = null;
const JWKS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseJwtParts(token: string): { header: Record<string, unknown>; payload: Record<string, unknown>; signatureBytes: Uint8Array; signedData: Uint8Array } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const headerJson = decoder.decode(base64UrlToUint8Array(parts[0]));
    const payloadJson = decoder.decode(base64UrlToUint8Array(parts[1]));
    const parsedHeader = parseJsonSafely(headerJson);
    const parsedPayload = parseJsonSafely(payloadJson);
    if (!parsedHeader.ok || !parsedPayload.ok) {
      return null;
    }
    const signatureBytes = base64UrlToUint8Array(parts[2]);
    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    return {
      header: parsedHeader.data,
      payload: parsedPayload.data,
      signatureBytes,
      signedData,
    };
  } catch {
    return null;
  }
}

async function getGooglePublicKeys(): Promise<any[]> {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return jwksCache.keys;
  }

  try {
    const res = await (fetch as any)(GOOGLE_JWKS_URL, {
      cf: { cacheTtl: 21600, cacheEverything: true },
    });
    if (!res.ok) throw new Error(`Failed to fetch Google JWKs: HTTP ${res.status}`);
    const data = await res.json() as { keys: any[] };
    jwksCache = { keys: data.keys, fetchedAt: now };
    return data.keys;
  } catch (err) {
    console.error("[Auth] Error fetching Google JWKs:", err);
    return jwksCache?.keys || [];
  }
}

/**
 * Cryptographically verifies a Firebase ID Token using native WebCrypto RS256
 */
async function verifyFirebaseIdToken(token: string, projectId: string): Promise<{ valid: boolean; uid?: string; email?: string; error?: string }> {
  const parsed = parseJwtParts(token);
  if (!parsed) return { valid: false, error: "Malformed JWT" };

  const { header, payload, signatureBytes, signedData } = parsed;

  if (
    header.alg !== "RS256" ||
    typeof header.kid !== "string" ||
    header.kid.length === 0 ||
    header.kid.length > 128
  ) {
    return { valid: false, error: "Invalid JWT header algorithm or missing key ID" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (payload.iss !== expectedIssuer) {
    return { valid: false, error: `Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}` };
  }
  if (payload.aud !== projectId) {
    return { valid: false, error: `Invalid audience: expected ${projectId}, got ${payload.aud}` };
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 128) {
    return { valid: false, error: "Missing or invalid JWT subject (sub)" };
  }
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= nowSec) {
    return { valid: false, error: "Token has expired" };
  }
  if (typeof payload.iat !== "number" || !Number.isFinite(payload.iat) || payload.iat > nowSec + 300) {
    return { valid: false, error: "Token issued-at (iat) is in the future" };
  }
  if (typeof payload.auth_time !== "number" || !Number.isFinite(payload.auth_time) || payload.auth_time > nowSec + 300) {
    return { valid: false, error: "Token auth_time is in the future" };
  }

  const keys = await getGooglePublicKeys();
  const matchingJwk = keys.find((k) => k && typeof k === "object" && k.kid === header.kid);
  if (
    !matchingJwk ||
    matchingJwk.kty !== "RSA" ||
    (matchingJwk.alg && matchingJwk.alg !== "RS256") ||
    (matchingJwk.use && matchingJwk.use !== "sig")
  ) {
    return { valid: false, error: `No valid RSA public key found for kid ${header.kid}` };
  }

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      matchingJwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const verified = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureBytes,
      signedData,
    );

    if (!verified) {
      return { valid: false, error: "Cryptographic signature mismatch" };
    }

    return {
      valid: true,
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch (cryptoErr: any) {
    return { valid: false, error: `Crypto verification failed: ${cryptoErr?.message}` };
  }
}

interface TurnstileVerifyResult {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

const ALLOWED_TURNSTILE_HOSTNAMES = new Set([
  "aegishealthai.co.in",
  "www.aegishealthai.co.in",
  "aegis-health-app-90697.web.app",
  "aegis-health-app-90697.firebaseapp.com",
  "localhost",
  "127.0.0.1",
]);

async function verifyTurnstileToken(
  token: string,
  secret: string,
  remoteIp?: string,
): Promise<{ valid: boolean; result?: TurnstileVerifyResult; error?: string }> {
  if (!token || typeof token !== "string" || token.length > 2048) {
    return { valid: false, error: "Missing or malformed Turnstile token" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!res.ok) {
      return { valid: false, error: `Turnstile siteverify HTTP ${res.status}` };
    }

    const data = (await res.json()) as TurnstileVerifyResult;
    if (!data.success) {
      return {
        valid: false,
        result: data,
        error: `Turnstile verification failed: ${(data["error-codes"] || []).join(", ")}`,
      };
    }

    // Verify hostname if provided
    if (data.hostname && !ALLOWED_TURNSTILE_HOSTNAMES.has(data.hostname)) {
      return {
        valid: false,
        result: data,
        error: `Turnstile hostname rejected: ${data.hostname}`,
      };
    }

    return { valid: true, result: data };
  } catch (err: any) {
    return { valid: false, error: `Turnstile request error: ${err?.message}` };
  }
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (a: ArrayBufferView, b: ArrayBufferView) => boolean;
  };
  if (typeof subtle.timingSafeEqual === "function") {
    return subtle.timingSafeEqual(a, b);
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function verifyWebhookHmacSha256(
  payload: string,
  signatureHeader: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret || !signatureHeader) return false;
  const normalizedHex = signatureHeader.trim().toLowerCase().replace(/^sha256=/, "");
  if (!/^[0-9a-f]{64}$/.test(normalizedHex)) return false;

  const providedBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    providedBytes[i] = parseInt(normalizedHex.slice(i * 2, i * 2 + 2), 16);
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expectedSig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload)),
  );
  return timingSafeEqualBytes(expectedSig, providedBytes);
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_ENTRIES = 10_000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function resetRateLimitersForTest(): void {
  rateLimitStore.clear();
}

export function resetJwksCacheForTest(): void {
  jwksCache = null;
}

function evictRateLimitEntries(now: number): void {
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetAt <= now) {
      rateLimitStore.delete(k);
    }
  }
  while (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitStore.keys().next().value;
    if (oldestKey === undefined) break;
    rateLimitStore.delete(oldestKey);
  }
}

async function enforceRateLimit(
  binding: { limit(options: { key: string }): Promise<{ success: boolean }> } | undefined,
  key: string,
  maxRequests: number,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  if (binding) {
    try {
      const outcome = await binding.limit({ key });
      if (!outcome.success) {
        return { allowed: false, retryAfterSec: Math.ceil(windowMs / 1000) };
      }
    } catch (err) {
      console.warn("[RateLimit] Cloudflare binding error, falling back to isolate limiter:", err);
    }
  }

  const now = Date.now();
  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt <= now) {
    if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
      evictRateLimitEntries(now);
    }
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
}

function getVerifiedClientIp(request: Request): string {
  // Always trust Cloudflare's verified edge header; never read spoofable X-Forwarded-For.
  return request.headers.get("CF-Connecting-IP")?.trim() || "unknown";
}

const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, private",
  "Pragma": "no-cache",
};

function withNoStoreHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);
  headers.set("Pragma", NO_STORE_HEADERS.Pragma);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function rateLimitExceededResponse(
  retryAfterSec: number,
  corsHeaders: Record<string, string>,
  requestId: string,
): Response {
  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please wait before retrying.",
      request_id: requestId,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        ...NO_STORE_HEADERS,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://aegishealthai.co.in";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id, X-Firebase-AppCheck, X-Turnstile-Token, cf-turnstile-response, X-Aegis-Feature",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const corsHeaders = getCorsHeaders(request);
    const url = new URL(request.url);
    const requestId = request.headers.get("X-Request-Id") || crypto.randomUUID();

    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2b. RFC 9116 security.txt (static public metadata; only cacheable Edge route)
    if (url.pathname === "/.well-known/security.txt" || url.pathname === "/security.txt") {
      const securityTxt = [
        "Contact: mailto:founder@aegishealthai.co.in",
        "Expires: 2027-12-31T23:59:59.000Z",
        "Preferred-Languages: en, mr, hi",
        "Canonical: https://aegishealthai.co.in/.well-known/security.txt",
        "Policy: https://aegishealthai.co.in/security.html",
        "Acknowledgments: https://aegishealthai.co.in/security.html#acknowledgments",
        "Hiring: https://aegishealthai.co.in/about.html",
        "",
      ].join("\n");

      return new Response(securityTxt, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const response = await handleDynamicRoute(request, env, corsHeaders, url, requestId);
    return withNoStoreHeaders(response);
  },
};

async function fetchWithGatewayFailover(
  gatewayUrl: string,
  gatewayHeaders: Record<string, string>,
  directUrl: string,
  directHeaders: Record<string, string>,
  payload: string,
  clientSignal: AbortSignal | undefined,
  label: string,
): Promise<{ response: Response; usedGateway: boolean }> {
  try {
    const gwResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: gatewayHeaders,
      body: payload,
      signal: clientSignal,
    });

    if (!gwResponse.ok && (gwResponse.status >= 502 || gwResponse.status === 401)) {
      console.warn(`[AIGateway] ${label} gateway returned HTTP ${gwResponse.status}, failing over to direct endpoint`);
      const directResponse = await fetch(directUrl, {
        method: "POST",
        headers: directHeaders,
        body: payload,
        signal: clientSignal,
      });
      return { response: directResponse, usedGateway: false };
    }

    return { response: gwResponse, usedGateway: true };
  } catch (gatewayErr) {
    if (clientSignal?.aborted) throw gatewayErr;
    console.warn(`[AIGateway] ${label} gateway fetch exception, failing over to direct endpoint:`, gatewayErr);
    const directResponse = await fetch(directUrl, {
      method: "POST",
      headers: directHeaders,
      body: payload,
      signal: clientSignal,
    });
    return { response: directResponse, usedGateway: false };
  }
}

async function handleDynamicRoute(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  url: URL,
  requestId: string,
): Promise<Response> {
    // 2. Health probe
    if (url.pathname === "/api/health" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          vertexAiConfigured: Boolean(env.GCP_VERTEX_SA_JSON),
          clinicalSearchConfigured: Boolean(env.GCP_VERTEX_SA_JSON),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2c. Standalone Turnstile Token Verification
    if (url.pathname === "/api/turnstile/verify" && request.method === "POST") {
      const clientIp = getVerifiedClientIp(request);
      const ipLimit = await enforceRateLimit(env.IP_RATE_LIMITER, `turnstile:ip:${clientIp}`, 30);
      if (!ipLimit.allowed) {
        return rateLimitExceededResponse(ipLimit.retryAfterSec, corsHeaders, requestId);
      }

      if (!env.TURNSTILE_SECRET) {
        return new Response(
          JSON.stringify({ error: "Configuration Error", message: "TURNSTILE_SECRET is not configured on edge", request_id: requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const parsedTurnstile = await parseSafeJsonBody(request, 8 * 1024, true);
      if (!parsedTurnstile.ok) {
        return new Response(
          JSON.stringify({ success: false, error: parsedTurnstile.error, request_id: requestId }),
          { status: parsedTurnstile.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const payload = parsedTurnstile.data;
      if (payload.token !== undefined && (typeof payload.token !== "string" || payload.token.length > 2048)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid Turnstile token field", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const token = (typeof payload.token === "string" ? payload.token : "") || request.headers.get("X-Turnstile-Token") || "";
      const remoteIp = clientIp !== "unknown" ? clientIp : undefined;

      const verifyResult = await verifyTurnstileToken(token, env.TURNSTILE_SECRET, remoteIp);
      if (!verifyResult.valid) {
        return new Response(
          JSON.stringify({ success: false, error: verifyResult.error, request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: true, details: verifyResult.result, request_id: requestId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. AI Generation Route
    if (url.pathname === "/api/ai/generate" && request.method === "POST") {
      const verifiedClientIp = getVerifiedClientIp(request);
      const ipLimit = await enforceRateLimit(env.IP_RATE_LIMITER, `ai:ip:${verifiedClientIp}`, 60);
      if (!ipLimit.allowed) {
        return rateLimitExceededResponse(ipLimit.retryAfterSec, corsHeaders, requestId);
      }

      const authHeader = request.headers.get("Authorization") || "";
      const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

      if (!bearerToken) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: "Missing Authorization Bearer token", request_id: requestId }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
      let authenticated = false;
      let authMethod = "none";
      let userUid: string | undefined;

      // Firebase ID Token (JWT RS256) is the ONLY accepted credential.
      if (bearerToken.includes(".")) {
        const verifyResult = await verifyFirebaseIdToken(bearerToken, projectId);
        if (verifyResult.valid) {
          authenticated = true;
          authMethod = "firebase_jwt";
          userUid = verifyResult.uid;
        } else {
          console.warn(`[Auth] JWT verification failed for request ${requestId}:`, verifyResult.error);
        }
      }

      if (!authenticated) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            message: "Invalid or expired credentials. Please provide a verified Firebase ID token.",
            request_id: requestId,
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (userUid) {
        const userLimit = await enforceRateLimit(env.USER_RATE_LIMITER, `ai:uid:${userUid}`, 40);
        if (!userLimit.allowed) {
          return rateLimitExceededResponse(userLimit.retryAfterSec, corsHeaders, requestId);
        }
      }

      // 3a. Turnstile Bot Verification (Additive Bot Defense)
      const turnstileToken =
        request.headers.get("X-Turnstile-Token") ||
        request.headers.get("cf-turnstile-response") ||
        "";
      const clientIp = verifiedClientIp !== "unknown" ? verifiedClientIp : undefined;
      let turnstileVerified = false;

      if (env.TURNSTILE_SECRET) {
        if (turnstileToken) {
          const turnstileResult = await verifyTurnstileToken(
            turnstileToken,
            env.TURNSTILE_SECRET,
            clientIp,
          );
          if (!turnstileResult.valid) {
            return new Response(
              JSON.stringify({
                error: "Forbidden",
                message: `Turnstile bot verification failed: ${turnstileResult.error}`,
                request_id: requestId,
              }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          turnstileVerified = true;
        } else if (env.TURNSTILE_ENFORCE === "true") {
          return new Response(
            JSON.stringify({
              error: "Forbidden",
              message: "Missing Turnstile verification token",
              request_id: requestId,
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      // Read & validate client payload (prototype-pollution guard + field schema)
      const parsedGenerate = await parseSafeJsonBody(request, 6 * 1024 * 1024);
      if (!parsedGenerate.ok) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: parsedGenerate.error, request_id: requestId }),
          { status: parsedGenerate.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const body = parsedGenerate.data;

      if (body.model !== undefined && (typeof body.model !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(body.model))) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid model identifier", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (body.contents !== undefined && !Array.isArray(body.contents) && typeof body.contents !== "string") {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid contents payload", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (body.generationConfig !== undefined && !isPlainObject(body.generationConfig)) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid generationConfig object", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (body.systemInstruction !== undefined && !isPlainObject(body.systemInstruction) && typeof body.systemInstruction !== "string") {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid systemInstruction", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (body.safetySettings !== undefined && !Array.isArray(body.safetySettings)) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid safetySettings array", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const feature = resolveFeature(request.headers.get("X-Aegis-Feature"), body);
      const isLounge = feature === LOUNGE_FEATURE;

      const model = typeof body.model === "string" && body.model ? body.model : "gemini-4-hydrogen";
      const apiKey = env.GEMINI_API_KEY;
      const hasVertexCreds = Boolean(env.GCP_VERTEX_SA_JSON);

      if (!hasVertexCreds && !apiKey) {
        return new Response(
          JSON.stringify({ error: "Server Configuration Error", message: "No Gemini or Vertex AI credentials configured on edge", request_id: requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const accountId = env.CLOUDFLARE_ACCOUNT_ID || "ca163e8753d019d7dfa1937535d7ea57";
      const gatewayId = env.CF_AI_GATEWAY_ID || "aegishealthai";
      const effectiveGenerationConfig = isLounge
        ? clampLoungeGenerationConfig(body.generationConfig)
        : body.generationConfig;

      // Propagate client disconnect / Stop to the upstream call so we
      // stop spending tokens on a reply nobody will read.
      const clientSignal: AbortSignal | undefined = request.signal ?? undefined;
      const clientClosedResponse = () =>
        new Response(
          JSON.stringify({ error: "Client Closed Request", code: "CLIENT_ABORTED", request_id: requestId }),
          { status: 499, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

      let upstreamResponse: Response | undefined;
      let usedGateway = true;
      let providerUsed: "vertex-ai" | "google-ai-studio" = "google-ai-studio";

      // Primary: Vertex AI via Cloudflare AI Gateway (draws from GCP Startup credits & enterprise privacy)
      if (env.GCP_VERTEX_SA_JSON) {
        try {
          const tokenInfo = await getGcpAccessToken(env.GCP_VERTEX_SA_JSON);
          const vertexProjectId = tokenInfo.projectId || projectId;
          const vertexLocation = env.GCP_VERTEX_LOCATION || "global";
          const vertexModel = resolveVertexModel(model);

          const vertexPayload = JSON.stringify({
            contents: normalizeVertexContents(body.contents),
            generationConfig: effectiveGenerationConfig,
            systemInstruction: normalizeVertexSystemInstruction(body.systemInstruction),
            safetySettings: body.safetySettings,
          });

          const vertexGatewayHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            "User-Agent": "AegisHealthAI-Edge/2.0",
            "Authorization": `Bearer ${tokenInfo.token}`,
            // Privacy: never cache clinical requests/responses (PHI) or store bodies in AI Gateway logs.
            "cf-aig-collect-log-payload": "false",
            "cf-aig-skip-cache": "true",
          };
          if (env.CF_AIG_TOKEN) {
            vertexGatewayHeaders["cf-aig-authorization"] = `Bearer ${env.CF_AIG_TOKEN}`;
          }
          const directVertexHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            "User-Agent": "AegisHealthAI-Edge/2.0",
            "Authorization": `Bearer ${tokenInfo.token}`,
          };

          const callVertexModel = (targetVertexModel: string) => {
            const gwUrl =
              `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/google-vertex-ai/v1/projects/${encodeURIComponent(vertexProjectId)}/locations/${encodeURIComponent(vertexLocation)}/publishers/google/models/${encodeURIComponent(targetVertexModel)}:generateContent`;
            const directUrl =
              `https://aiplatform.googleapis.com/v1/projects/${encodeURIComponent(vertexProjectId)}/locations/${encodeURIComponent(vertexLocation)}/publishers/google/models/${encodeURIComponent(targetVertexModel)}:generateContent`;
            return fetchWithGatewayFailover(
              gwUrl,
              vertexGatewayHeaders,
              directUrl,
              directVertexHeaders,
              vertexPayload,
              clientSignal,
              `VertexAI(${targetVertexModel})`,
            );
          };

          let vertexAttempt = await callVertexModel(vertexModel);

          // If gemini-4-carbon / gemini-4-neon returns 403 on this billing account, degrade cleanly to verified gemini-4-argon on Vertex AI.
          if (
            vertexAttempt.response.status === 403 &&
            (vertexModel === "gemini-4-carbon" || vertexModel === "gemini-4-neon") &&
            !clientSignal?.aborted
          ) {
            console.warn(`[VertexAI] ${vertexModel} returned 403 (tier eligibility), degrading cleanly to gemini-4-argon`);
            vertexAttempt = await callVertexModel("gemini-4-argon");
          }

          const shouldFallbackToAiStudio =
            Boolean(apiKey) &&
            !clientSignal?.aborted &&
            (vertexAttempt.response.status === 404 ||
              vertexAttempt.response.status === 403 ||
              vertexAttempt.response.status >= 500);

          if (shouldFallbackToAiStudio) {
            console.warn(`[VertexAI] Returned HTTP ${vertexAttempt.response.status}, falling back to Google AI Studio`);
          } else {
            upstreamResponse = vertexAttempt.response;
            usedGateway = vertexAttempt.usedGateway;
            providerUsed = "vertex-ai";
          }
        } catch (vertexErr) {
          if (clientSignal?.aborted) return clientClosedResponse();
          console.warn("[VertexAI] Exception invoking Vertex AI, checking Google AI Studio fallback:", vertexErr);
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "Bad Gateway", message: "Vertex AI request failed and GEMINI_API_KEY fallback is unset", request_id: requestId }),
              { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        }
      }

      // Secondary / Fallback: Google AI Studio via Cloudflare AI Gateway -> Direct Google AI Studio
      if (!upstreamResponse) {
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Server Configuration Error", message: "GEMINI_API_KEY is unset on edge", request_id: requestId }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/google-ai-studio/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        const directGoogleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

        const payload = JSON.stringify({
          contents: body.contents,
          generationConfig: effectiveGenerationConfig,
          systemInstruction: body.systemInstruction,
          safetySettings: body.safetySettings,
        });

        const gatewayHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "AegisHealthAI-Edge/2.0",
          "x-goog-api-key": apiKey,
          // Privacy: never cache clinical requests/responses (PHI) or store bodies in AI Gateway logs.
          "cf-aig-collect-log-payload": "false",
          "cf-aig-skip-cache": "true",
        };
        if (env.CF_AIG_TOKEN) {
          gatewayHeaders["cf-aig-authorization"] = `Bearer ${env.CF_AIG_TOKEN}`;
        }
        const directHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "AegisHealthAI-Edge/2.0",
          "x-goog-api-key": apiKey,
        };

        try {
          const studioAttempt = await fetchWithGatewayFailover(
            gatewayUrl,
            gatewayHeaders,
            directGoogleUrl,
            directHeaders,
            payload,
            clientSignal,
            "GoogleAIStudio",
          );
          upstreamResponse = studioAttempt.response;
          usedGateway = studioAttempt.usedGateway;
          providerUsed = "google-ai-studio";
        } catch (directErr) {
          if (clientSignal?.aborted) return clientClosedResponse();
          throw directErr;
        }
      }

      let upstreamData = await upstreamResponse.json() as any;

      // Catch Google geographical location restrictions (e.g. India Anycast routing to unsupported region)
      const errorMsg = String(upstreamData?.error?.message || "");
      if (errorMsg.includes("User location is not supported") || upstreamResponse.status === 403 && errorMsg.includes("location")) {
        return new Response(
          JSON.stringify({
            error: "Location restriction encountered",
            message: "Google AI endpoint reported geographical restriction. Retry in progress.",
            code: "LOCATION_UNSUPPORTED",
            request_id: requestId,
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "1" } },
        );
      }

      const aigCacheStatus = upstreamResponse.headers.get("cf-aig-cache-status") || "BYPASS";

      // Lounge-only output guard: replace patient-directed dosing with a fixed safe reply.
      let outputGuard = "off";
      if (isLounge && upstreamResponse.ok) {
        const guarded = applyLoungeOutputGuard(upstreamData, body.contents);
        upstreamData = guarded.payload;
        outputGuard = guarded.replaced ? "replaced" : "pass";
        if (guarded.replaced) {
          // Category only — never log model or user text (PHI).
          console.warn(`[OutputGuard] Lounge reply replaced (${guarded.reason}) for request ${requestId}`);
        }
      }

      return new Response(JSON.stringify(upstreamData), {
        status: upstreamResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Auth-Method": authMethod,
          "X-Request-Id": requestId,
          "X-AI-Provider": providerUsed,
          "X-AI-Gateway": usedGateway ? gatewayId : "direct-fallback",
          "X-AI-Cache-Status": aigCacheStatus,
          "X-Turnstile-Status": turnstileVerified ? "verified" : (env.TURNSTILE_SECRET ? "unverified" : "disabled"),
          "X-Aegis-Output-Guard": outputGuard,
        },
      });
    }

    // 3b. Vertex AI Search / Discovery Engine Clinical Protocol Search Route
    if (url.pathname === "/api/ai/clinical-search" && request.method === "POST") {
      const verifiedClientIp = getVerifiedClientIp(request);
      const ipLimit = await enforceRateLimit(env.IP_RATE_LIMITER, `clinical-search:ip:${verifiedClientIp}`, 60);
      if (!ipLimit.allowed) {
        return rateLimitExceededResponse(ipLimit.retryAfterSec, corsHeaders, requestId);
      }

      const authHeader = request.headers.get("Authorization") || "";
      const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (!bearerToken) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: "Missing Authorization Bearer token", request_id: requestId }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
      let authenticated = false;
      let userUid: string | undefined;

      if (bearerToken.includes(".")) {
        const verifyResult = await verifyFirebaseIdToken(bearerToken, projectId);
        if (verifyResult.valid) {
          authenticated = true;
          userUid = verifyResult.uid;
        } else {
          console.warn(`[Auth] JWT verification failed for clinical search ${requestId}:`, verifyResult.error);
        }
      }

      if (!authenticated) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            message: "Invalid or expired credentials. Please provide a verified Firebase ID token.",
            request_id: requestId,
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (userUid) {
        const userLimit = await enforceRateLimit(env.USER_RATE_LIMITER, `clinical-search:uid:${userUid}`, 40);
        if (!userLimit.allowed) {
          return rateLimitExceededResponse(userLimit.retryAfterSec, corsHeaders, requestId);
        }
      }

      const parsedSearch = await parseSafeJsonBody(request, 16 * 1024);
      if (!parsedSearch.ok) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: parsedSearch.error, request_id: requestId }),
          { status: parsedSearch.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const body = parsedSearch.data;

      if (typeof body.query !== "string") {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "query must be a non-empty string", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const trimmedQuery = body.query.trim();
      if (trimmedQuery.length === 0 || trimmedQuery.length > 300) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "query length must be between 1 and 300 characters", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      let pageSize = 5;
      if (body.pageSize !== undefined) {
        if (typeof body.pageSize !== "number" || !Number.isFinite(body.pageSize)) {
          return new Response(
            JSON.stringify({ error: "Bad Request", message: "Invalid pageSize parameter", request_id: requestId }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        pageSize = Math.max(1, Math.min(10, Math.floor(body.pageSize)));
      }

      let includeSummary = true;
      if (body.includeSummary !== undefined) {
        if (typeof body.includeSummary !== "boolean") {
          return new Response(
            JSON.stringify({ error: "Bad Request", message: "Invalid includeSummary flag", request_id: requestId }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        includeSummary = body.includeSummary;
      }

      if (!env.GCP_VERTEX_SA_JSON) {
        return new Response(
          JSON.stringify({ error: "Service Unavailable", message: "Clinical search credentials are not configured on edge", request_id: requestId }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const clientSignal: AbortSignal | undefined = request.signal ?? undefined;
      try {
        const tokenInfo = await getGcpAccessToken(env.GCP_VERTEX_SA_JSON);
        const searchProjectId = tokenInfo.projectId || projectId;
        const engineLocation = env.DISCOVERY_ENGINE_LOCATION || "global";
        const engineId = env.DISCOVERY_ENGINE_ID || "aegis-clinical-search";

        const searchUrl =
          `https://discoveryengine.googleapis.com/v1/projects/${encodeURIComponent(searchProjectId)}/locations/${encodeURIComponent(engineLocation)}/collections/default_collection/engines/${encodeURIComponent(engineId)}/servingConfigs/default_search:search`;

        const searchPayload: Record<string, unknown> = {
          query: trimmedQuery,
          pageSize,
          contentSearchSpec: {
            snippetSpec: { returnSnippet: true },
            ...(includeSummary
              ? {
                  summarySpec: {
                    summaryResultCount: Math.min(pageSize, 5),
                    includeCitations: true,
                    ignoreAdversarialQuery: true,
                  },
                }
              : {}),
          },
        };

        const searchRes = await fetch(searchUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenInfo.token}`,
            "x-goog-user-project": searchProjectId,
            "Content-Type": "application/json",
            "User-Agent": "AegisHealthAI-Edge/2.0",
          },
          body: JSON.stringify(searchPayload),
          signal: clientSignal,
        });

        if (!searchRes.ok) {
          const errStatus = searchRes.status >= 500 ? 502 : searchRes.status;
          return new Response(
            JSON.stringify({ error: "Clinical Search Error", message: `Discovery Engine returned HTTP ${searchRes.status}`, request_id: requestId }),
            { status: errStatus, headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": "discovery-engine" } },
          );
        }

        const rawData = (await searchRes.json()) as {
          totalSize?: unknown;
          summary?: {
            summaryText?: unknown;
            summaryWithMetadata?: {
              summary?: unknown;
              references?: Array<{ title?: unknown; document?: unknown }>;
            };
          };
          results?: Array<{
            id?: unknown;
            document?: {
              id?: unknown;
              derivedStructData?: {
                title?: unknown;
                link?: unknown;
                snippets?: Array<{ snippet?: unknown }>;
              };
            };
            retrievalSignals?: {
              semanticRelevanceScore?: unknown;
            };
          }>;
        };

        const mappedResults = Array.isArray(rawData.results)
          ? rawData.results.map((item) => {
              const doc = item.document;
              const derived = doc?.derivedStructData;
              const rawTitle = typeof derived?.title === "string" ? derived.title : (typeof doc?.id === "string" ? doc.id : "Clinical Protocol");
              const rawSnippet = typeof derived?.snippets?.[0]?.snippet === "string" ? derived.snippets[0].snippet : "";
              const uri = typeof derived?.link === "string" ? derived.link : "";
              const relevanceScore = typeof item.retrievalSignals?.semanticRelevanceScore === "number"
                ? item.retrievalSignals.semanticRelevanceScore
                : undefined;

              return {
                id: String(item.id || doc?.id || ""),
                title: sanitizeDiscoverySnippet(rawTitle),
                uri,
                snippet: sanitizeDiscoverySnippet(rawSnippet),
                ...(relevanceScore !== undefined ? { relevanceScore } : {}),
              };
            })
          : [];

        const rawSummaryText =
          typeof rawData.summary?.summaryWithMetadata?.summary === "string"
            ? rawData.summary.summaryWithMetadata.summary
            : (typeof rawData.summary?.summaryText === "string" ? rawData.summary.summaryText : "");
        const summary = sanitizeDiscoverySnippet(rawSummaryText);

        const references = Array.isArray(rawData.summary?.summaryWithMetadata?.references)
          ? rawData.summary.summaryWithMetadata.references.map((ref) => ({
              title: sanitizeDiscoverySnippet(typeof ref.title === "string" ? ref.title : ""),
              document: typeof ref.document === "string" ? ref.document : "",
            }))
          : [];

        const totalSize = typeof rawData.totalSize === "number" ? rawData.totalSize : mappedResults.length;

        return new Response(
          JSON.stringify({
            query: trimmedQuery,
            engine: engineId,
            source: "discovery-engine",
            totalSize,
            summary,
            references,
            results: mappedResults,
            request_id: requestId,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "X-Request-Id": requestId,
              "X-AI-Provider": "discovery-engine",
            },
          },
        );
      } catch (err) {
        if (clientSignal?.aborted) {
          return new Response(
            JSON.stringify({ error: "Client Closed Request", code: "CLIENT_ABORTED", request_id: requestId }),
            { status: 499, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        console.error(`[ClinicalSearch] Error on request ${requestId}:`, err);
        return new Response(
          JSON.stringify({ error: "Clinical Search Error", message: "Failed to query clinical search index", request_id: requestId }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": "discovery-engine" } },
        );
      }
    }

        // 4. NVIDIA NIM Proxy Route
    if (url.pathname === "/api/ai/nim" && request.method === "POST") {
      const clientIp = getVerifiedClientIp(request);
      const ipLimit = await enforceRateLimit(env.IP_RATE_LIMITER, `ai:ip:${clientIp}`, 60);
      if (!ipLimit.allowed) {
        return rateLimitExceededResponse(ipLimit.retryAfterSec, corsHeaders, requestId);
      }

      const authHeader = request.headers.get("Authorization") || "";
      const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

      if (!bearerToken) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: "Missing Authorization Bearer token", request_id: requestId }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
      let authenticated = false;
      let userUid: string | undefined;

      if (bearerToken.includes(".")) {
        const verifyResult = await verifyFirebaseIdToken(bearerToken, projectId);
        if (verifyResult.valid) {
          authenticated = true;
          userUid = verifyResult.uid;
        } else {
          console.warn(`[Auth] JWT verification failed for NIM request ${requestId}:`, verifyResult.error);
        }
      }

      if (!authenticated) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            message: "Invalid or expired credentials. Please provide a verified Firebase ID token.",
            request_id: requestId,
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (userUid) {
        const userLimit = await enforceRateLimit(env.USER_RATE_LIMITER, `ai:uid:${userUid}`, 40);
        if (!userLimit.allowed) {
          return rateLimitExceededResponse(userLimit.retryAfterSec, corsHeaders, requestId);
        }
      }

      const nimKey = env.NVIDIA_NIM_API_KEY;
      if (!nimKey) {
        return new Response(
          JSON.stringify({
            error: "Service Misconfiguration",
            message: "NVIDIA NIM API key is not configured on edge server.",
            request_id: requestId,
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const clientSignal: AbortSignal | undefined = request.signal ?? undefined;
      const parsedNim = await parseSafeJsonBody(request, 1024 * 1024);
      if (!parsedNim.ok) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: parsedNim.error, request_id: requestId }),
          { status: parsedNim.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const nimRaw = parsedNim.data;
      if (typeof nimRaw.model !== "string" || !/^[a-zA-Z0-9./:_-]{1,120}$/.test(nimRaw.model)) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid NIM model identifier", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!Array.isArray(nimRaw.messages) || nimRaw.messages.length === 0 || nimRaw.messages.length > 100) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "NIM request requires non-empty messages array (max 100)", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const nimPayload: Record<string, unknown> = {
        model: nimRaw.model,
        messages: nimRaw.messages,
      };
      if (typeof nimRaw.temperature === "number" && Number.isFinite(nimRaw.temperature)) {
        nimPayload.temperature = Math.max(0, Math.min(2, nimRaw.temperature));
      }
      if (typeof nimRaw.top_p === "number" && Number.isFinite(nimRaw.top_p)) {
        nimPayload.top_p = Math.max(0, Math.min(1, nimRaw.top_p));
      }
      if (typeof nimRaw.max_tokens === "number" && Number.isFinite(nimRaw.max_tokens)) {
        nimPayload.max_tokens = Math.max(1, Math.min(16384, Math.floor(nimRaw.max_tokens)));
      }
      if (typeof nimRaw.stream === "boolean") {
        nimPayload.stream = nimRaw.stream;
      }
      if (isPlainObject(nimRaw.response_format)) {
        nimPayload.response_format = nimRaw.response_format;
      }

      const upstreamResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${nimKey}`,
        },
        body: JSON.stringify(nimPayload),
        signal: clientSignal,
      });

      const data = await upstreamResponse.text();
      return new Response(data, {
        status: upstreamResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          "X-Provider": "nvidia-nim",
        },
      });
    }

    // 5. Amazon Bedrock Mantle Model Catalog Route
    if (url.pathname === "/api/ai/bedrock/models" && request.method === "GET") {
      const activeModels = [
        {
          id: "deepseek.v3.2",
          name: "DeepSeek V3.2",
          tier: "reasoning",
          provider: "DeepSeek",
          contextWindow: "128K",
          description: "Frontier clinical reasoning, medical second-opinion & differential diagnosis",
        },
        {
          id: "mistral.mistral-large-3-675b-instruct",
          name: "Mistral Large 3 (675B)",
          tier: "flagship",
          provider: "Mistral",
          contextWindow: "128K",
          description: "Flagship medical comprehension and multi-lingual differential diagnosis",
        },
        {
          id: "zai.glm-5",
          name: "GLM-5",
          tier: "flagship",
          provider: "Z.AI",
          contextWindow: "200K",
          description: "Advanced diagnostic reasoning & treatment guidelines",
        },
        {
          id: "zai.glm-4.7-flash",
          name: "GLM 4.7 Flash",
          tier: "fast",
          provider: "Z.AI",
          contextWindow: "200K",
          description: "Ultra-fast triage, patient chat, and high-speed queries ($0.07/1M tokens)",
        },
        {
          id: "moonshotai.kimi-k2-thinking",
          name: "Kimi K2 Thinking",
          tier: "reasoning",
          provider: "Moonshot AI",
          contextWindow: "256K",
          description: "Deep chain-of-thought clinical reasoning & multi-step pathology analysis",
        },
        {
          id: "writer.palmyra-vision-7b",
          name: "Palmyra Vision 7B",
          tier: "vision",
          provider: "Writer",
          contextWindow: "4K",
          description: "Specialized medical prescription, handwritten notes & lab report OCR",
        },
        {
          id: "qwen.qwen3-vl-235b-a22b-instruct",
          name: "Qwen3 VL (235B)",
          tier: "vision",
          provider: "Qwen",
          contextWindow: "235K",
          description: "Multimodal medical image & chart analysis",
        },
        {
          id: "openai.gpt-oss-safeguard-120b",
          name: "GPT OSS Safeguard (120B)",
          tier: "safety",
          provider: "OpenAI",
          contextWindow: "128K",
          description: "Clinical safety guardrail and hallucination auditor",
        },
      ];

      return new Response(
        JSON.stringify({ models: activeModels, count: activeModels.length, status: "available" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 6. Amazon Bedrock Mantle Multi-Model Proxy Route
    if ((url.pathname === "/api/ai/bedrock" || url.pathname === "/api/bedrock/converse") && request.method === "POST") {
      const clientIp = getVerifiedClientIp(request);
      const ipLimit = await enforceRateLimit(env.IP_RATE_LIMITER, `ai:ip:${clientIp}`, 60);
      if (!ipLimit.allowed) {
        return rateLimitExceededResponse(ipLimit.retryAfterSec, corsHeaders, requestId);
      }

      const authHeader = request.headers.get("Authorization") || "";
      const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

      if (!bearerToken) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: "Missing Authorization Bearer token", request_id: requestId }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
      let authenticated = false;
      let userUid: string | undefined;

      if (bearerToken.includes(".")) {
        const verifyResult = await verifyFirebaseIdToken(bearerToken, projectId);
        if (verifyResult.valid) {
          authenticated = true;
          userUid = verifyResult.uid;
        } else {
          console.warn(`[Auth] JWT verification failed for Bedrock request ${requestId}:`, verifyResult.error);
        }
      }

      if (!authenticated) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            message: "Invalid or expired credentials. Please provide a verified Firebase ID token.",
            request_id: requestId,
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (userUid) {
        const userLimit = await enforceRateLimit(env.USER_RATE_LIMITER, `ai:uid:${userUid}`, 40);
        if (!userLimit.allowed) {
          return rateLimitExceededResponse(userLimit.retryAfterSec, corsHeaders, requestId);
        }
      }

      const bedrockKey = env.BEDROCK_MANTLE_API_KEY;
      if (!bedrockKey) {
        return new Response(
          JSON.stringify({
            error: "Service Misconfiguration",
            message: "BEDROCK_MANTLE_API_KEY is not configured on edge server.",
            request_id: requestId,
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const clientSignal: AbortSignal | undefined = request.signal ?? undefined;
      const parsedBedrock = await parseSafeJsonBody(request, 1024 * 1024);
      if (!parsedBedrock.ok) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: parsedBedrock.error, request_id: requestId }),
          { status: parsedBedrock.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const rawBody = parsedBedrock.data;

      const endpoint = env.BEDROCK_MANTLE_ENDPOINT || "https://bedrock-mantle.us-east-1.api.aws/v1";
      const targetModel = rawBody.model ?? "deepseek.v3.2";
      if (typeof targetModel !== "string" || !/^[a-zA-Z0-9._:-]{1,120}$/.test(targetModel)) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid Bedrock model identifier", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (rawBody.messages !== undefined && (!Array.isArray(rawBody.messages) || rawBody.messages.length > 100)) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid messages array", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (rawBody.prompt !== undefined && typeof rawBody.prompt !== "string") {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid prompt field", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (rawBody.systemPrompt !== undefined && typeof rawBody.systemPrompt !== "string") {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid systemPrompt field", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (rawBody.stream !== undefined && typeof rawBody.stream !== "boolean") {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Invalid stream flag", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const messages = Array.isArray(rawBody.messages)
        ? rawBody.messages
        : [
            ...(typeof rawBody.systemPrompt === "string" && rawBody.systemPrompt
              ? [{ role: "system", content: rawBody.systemPrompt }]
              : []),
            ...(typeof rawBody.prompt === "string" && rawBody.prompt
              ? [{ role: "user", content: rawBody.prompt }]
              : []),
          ];

      if (messages.length === 0) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Bedrock request requires messages or prompt", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const rawTemp = typeof rawBody.temperature === "number" && Number.isFinite(rawBody.temperature)
        ? Math.max(0, Math.min(2, rawBody.temperature))
        : 0.2;
      const rawMaxTokens = rawBody.max_tokens ?? rawBody.maxTokens;
      const clampedMaxTokens = typeof rawMaxTokens === "number" && Number.isFinite(rawMaxTokens)
        ? Math.max(1, Math.min(16384, Math.floor(rawMaxTokens)))
        : 2048;

      // Normalize OpenAI format with allowlisted keys
      const upstreamPayload: Record<string, unknown> = {
        model: targetModel,
        messages,
        temperature: rawTemp,
        max_tokens: clampedMaxTokens,
      };

      if (typeof rawBody.stream === "boolean") {
        upstreamPayload.stream = rawBody.stream;
      }

      const upstreamResponse = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${bedrockKey}`,
          "User-Agent": "AegisHealthAI-Edge/2.0",
        },
        body: JSON.stringify(upstreamPayload),
        signal: clientSignal,
      });

      const responseText = await upstreamResponse.text();
      return new Response(responseText, {
        status: upstreamResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          "X-Provider": "aws-bedrock-mantle",
          "X-Model-Used": targetModel,
        },
      });
    }

    // 7. Diagnostic Partner Webhook Ingestion Route (Thyrocare / Tata 1mg / Redcliffe / Healthians)
    if (url.pathname === "/api/integrations/lab/webhook" && request.method === "POST") {
      const clientIp = getVerifiedClientIp(request);
      const ipLimit = await enforceRateLimit(env.IP_RATE_LIMITER, `webhook:ip:${clientIp}`, 60);
      if (!ipLimit.allowed) {
        return rateLimitExceededResponse(ipLimit.retryAfterSec, corsHeaders, requestId);
      }

      if (!env.LAB_WEBHOOK_SECRET) {
        return new Response(
          JSON.stringify({ error: "Service Unavailable", message: "Webhook secret is not configured on edge", request_id: requestId }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const payloadText = await request.text();
      if (payloadText.length > 256 * 1024) {
        return new Response(
          JSON.stringify({ error: "Payload Too Large", message: "Webhook payload exceeds 256KB limit", request_id: requestId }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const sigHeader =
        request.headers.get("X-Lab-Signature-256") ||
        request.headers.get("X-Webhook-Signature");
      const validSig = await verifyWebhookHmacSha256(
        payloadText,
        sigHeader,
        env.LAB_WEBHOOK_SECRET,
      );
      if (!validSig) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: "Invalid webhook signature", request_id: requestId }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const parsedWebhook = parseJsonSafely(payloadText);
      if (!parsedWebhook.ok) {
        return new Response(
          JSON.stringify({ error: parsedWebhook.error, request_id: requestId }),
          { status: parsedWebhook.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const payload = parsedWebhook.data;

      const rawPartner = typeof payload.partner === "string" ? payload.partner.slice(0, 128) : undefined;
      const rawBookingId = typeof payload.bookingId === "string"
        ? payload.bookingId.slice(0, 128)
        : (typeof payload.orderId === "string" ? payload.orderId.slice(0, 128) : undefined);
      const rawStatus = typeof payload.status === "string" ? payload.status.slice(0, 128) : undefined;
      if (payload.biomarkers !== undefined && !Array.isArray(payload.biomarkers)) {
        return new Response(
          JSON.stringify({ error: "Invalid webhook payload", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const headerPartner = request.headers.get("X-Partner-Id")?.slice(0, 128);
      const partnerName = headerPartner || rawPartner || "diagnostic-partner";

      console.log(`[Lab Webhook] Received report update from ${partnerName}:`, {
        bookingId: rawBookingId,
        status: rawStatus,
        biomarkersReported: Array.isArray(payload.biomarkers) ? payload.biomarkers.length : 0,
      });

      return new Response(
        JSON.stringify({
          status: "received",
          partner: partnerName,
          bookingId: rawBookingId || "unknown",
          processedAt: new Date().toISOString(),
          telemetrySyncStatus: "QUEUED_FOR_FHIR_INGESTION",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
        },
      );
    }

    return new Response(
      JSON.stringify({ error: "Not Found", request_id: requestId }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
}
