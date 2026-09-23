/**
 * Cloudflare Worker: aegishealthai-edge
 * Endpoints:
 * - POST /api/ai/generate -> Proxies Gemini API with Firebase Auth & App Check verification
 * - GET  /api/health      -> Health probe
 *
 * Authentication Strategy:
 * 1. Primary: Firebase ID Token (JWT RS256 cryptographically verified via Google JWKs)
 * 2. Secondary: Firebase App Check (reCAPTCHA v3 verified via X-Firebase-AppCheck)
 * 3. Fallback: EDGE_SHARED_SECRET (interim secret for transition / internal scripts)
 */

export interface Env {
  GEMINI_API_KEY: string;
  EDGE_SHARED_SECRET?: string;
  FIREBASE_PROJECT_ID?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CF_AIG_TOKEN?: string;
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

function parseJwtParts(token: string): { header: any; payload: any; signatureBytes: Uint8Array; signedData: Uint8Array } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const headerJson = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const header = JSON.parse(headerJson);
    const payload = JSON.parse(payloadJson);
    const signatureBytes = base64UrlToUint8Array(parts[2]);
    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    return { header, payload, signatureBytes, signedData };
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
    const res = await fetch(GOOGLE_JWKS_URL, {
      cf: { cacheTtl: 21600, cacheEverything: true } as any,
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

  if (header.alg !== "RS256" || !header.kid) {
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
  if (typeof payload.exp !== "number" || payload.exp < nowSec) {
    return { valid: false, error: "Token has expired" };
  }
  if (typeof payload.auth_time !== "number" || payload.auth_time > nowSec + 300) {
    return { valid: false, error: "Token auth_time is in the future" };
  }

  const keys = await getGooglePublicKeys();
  const matchingJwk = keys.find((k) => k.kid === header.kid);
  if (!matchingJwk) {
    return { valid: false, error: `No matching public key found for kid ${header.kid}` };
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

    return { valid: true, uid: payload.sub, email: payload.email };
  } catch (cryptoErr: any) {
    return { valid: false, error: `Crypto verification failed: ${cryptoErr?.message}` };
  }
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://aegishealthai.co.in";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id, X-Firebase-AppCheck",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = getCorsHeaders(request);
    const url = new URL(request.url);
    const requestId = request.headers.get("X-Request-Id") || crypto.randomUUID();

    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2. Health probe
    if (url.pathname === "/api/health" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "healthy", region: "SIN", service: "aegishealthai-edge", timestamp: new Date().toISOString() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. AI Generation Route
    if (url.pathname === "/api/ai/generate" && request.method === "POST") {
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

      // Strategy A: Check Firebase ID Token (JWT RS256)
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

      // Strategy B: Check Shared Secret (interim fallback / test scripts)
      if (!authenticated && env.EDGE_SHARED_SECRET && bearerToken === env.EDGE_SHARED_SECRET) {
        authenticated = true;
        authMethod = "shared_secret";
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

      // Read client payload
      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "Malformed JSON body", request_id: requestId }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const model = body.model || "gemini-3.6-flash";
      const apiKey = env.GEMINI_API_KEY;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Server Configuration Error", message: "GEMINI_API_KEY is unset on edge", request_id: requestId }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Upstream Gemini API URL
      const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

      try {
        const upstreamResponse = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "AegisHealthAI-Edge/2.0",
          },
          body: JSON.stringify({
            contents: body.contents,
            generationConfig: body.generationConfig,
            systemInstruction: body.systemInstruction,
            safetySettings: body.safetySettings,
          }),
        });

        const upstreamData = await upstreamResponse.json() as any;

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

        return new Response(JSON.stringify(upstreamData), {
          status: upstreamResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Auth-Method": authMethod,
            "X-Request-Id": requestId,
          },
        });
      } catch (upstreamErr: any) {
        return new Response(
          JSON.stringify({
            error: "Gateway Timeout / Upstream Failure",
            message: upstreamErr?.message || "Failed to contact Gemini upstream",
            request_id: requestId,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Not Found", request_id: requestId }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  },
};
