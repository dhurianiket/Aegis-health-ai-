// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import worker, { resetJwksCacheForTest, resetRateLimitersForTest, type Env } from "../index";
import { createTestSigner, GOOGLE_JWKS_URL, TEST_PROJECT_ID } from "./helpers/firebaseTestToken";

const BASE_ENV: Env = {
  GEMINI_API_KEY: "test-gemini-key-not-real",
  FIREBASE_PROJECT_ID: "synthetic-test-project",
  CLOUDFLARE_ACCOUNT_ID: "test-account",
  CF_AI_GATEWAY_ID: "test-gateway",
};

async function signWebhookHmac(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  const hex = Array.from(sig)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${hex}`;
}

describe("Worker /api/integrations/lab/webhook — HMAC-SHA256 verification", () => {
  beforeEach(() => {
    resetRateLimitersForTest();
  });
  afterEach(() => {
    resetRateLimitersForTest();
  });

  it("returns 503 when LAB_WEBHOOK_SECRET is not configured", async () => {
    const req = new Request("https://api.example.test/api/integrations/lab/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: "bk-1", status: "completed" }),
    });
    const res = await worker.fetch(req, BASE_ENV, {});
    expect(res.status).toBe(503);
  });

  it("returns 401 when webhook signature header is missing or invalid", async () => {
    const env: Env = { ...BASE_ENV, LAB_WEBHOOK_SECRET: "synthetic-webhook-secret" };
    const body = JSON.stringify({ bookingId: "bk-1", status: "completed" });

    const missingRes = await worker.fetch(
      new Request("https://api.example.test/api/integrations/lab/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      env,
      {},
    );
    expect(missingRes.status).toBe(401);

    const badSigRes = await worker.fetch(
      new Request("https://api.example.test/api/integrations/lab/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Lab-Signature-256": `sha256=${"0".repeat(64)}`,
        },
        body,
      }),
      env,
      {},
    );
    expect(badSigRes.status).toBe(401);
  });

  it("returns 200 when HMAC-SHA256 signature is valid", async () => {
    const secret = "synthetic-webhook-secret";
    const env: Env = { ...BASE_ENV, LAB_WEBHOOK_SECRET: secret };
    const body = JSON.stringify({ partner: "thyrocare", bookingId: "bk-1", status: "ready", biomarkers: [] });
    const sig = await signWebhookHmac(body, secret);

    const res = await worker.fetch(
      new Request("https://api.example.test/api/integrations/lab/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Lab-Signature-256": sig,
        },
        body,
      }),
      env,
      {},
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; bookingId: string };
    expect(data.status).toBe("received");
    expect(data.bookingId).toBe("bk-1");
  });
});

describe("Worker rate limiting — CF-Connecting-IP and per-userUid", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetRateLimitersForTest();
    resetJwksCacheForTest();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    resetRateLimitersForTest();
    resetJwksCacheForTest();
    vi.unstubAllGlobals();
  });

  it("keys IP rate limiting on CF-Connecting-IP and ignores spoofed X-Forwarded-For", async () => {
    const secret = "synthetic-webhook-secret";
    const env: Env = { ...BASE_ENV, LAB_WEBHOOK_SECRET: secret };
    const body = JSON.stringify({ bookingId: "bk-ip", status: "ready" });
    const sig = await signWebhookHmac(body, secret);

    for (let i = 0; i < 60; i++) {
      const res = await worker.fetch(
        new Request("https://api.example.test/api/integrations/lab/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "CF-Connecting-IP": "198.51.100.10",
            "X-Forwarded-For": `203.0.113.${i + 1}`,
            "X-Lab-Signature-256": sig,
          },
          body,
        }),
        env,
        {},
      );
      expect(res.status).toBe(200);
    }

    const blockedRes = await worker.fetch(
      new Request("https://api.example.test/api/integrations/lab/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "198.51.100.10",
          "X-Forwarded-For": "203.0.113.250",
          "X-Lab-Signature-256": sig,
        },
        body,
      }),
      env,
      {},
    );
    expect(blockedRes.status).toBe(429);
    expect(Number(blockedRes.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("enforces per-userUid rate limits across rotating CF-Connecting-IP addresses", async () => {
    const signer = await createTestSigner();
    const token = await signer.mintToken({ sub: "rate-limit-uid-1" });
    const env: Env = { ...BASE_ENV, FIREBASE_PROJECT_ID: TEST_PROJECT_ID };

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "ok" }] }, finishReason: "STOP" }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    for (let i = 0; i < 40; i++) {
      const res = await worker.fetch(
        new Request("https://api.example.test/api/ai/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "CF-Connecting-IP": `198.51.100.${(i % 200) + 1}`,
          },
          body: JSON.stringify({ model: "gemini-4-hydrogen", contents: [] }),
        }),
        env,
        {},
      );
      expect(res.status).toBe(200);
    }

    const throttledRes = await worker.fetch(
      new Request("https://api.example.test/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "CF-Connecting-IP": "198.51.100.250",
        },
        body: JSON.stringify({ model: "gemini-4-hydrogen", contents: [] }),
      }),
      env,
      {},
    );
    expect(throttledRes.status).toBe(429);
    expect(Number(throttledRes.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});

describe("Worker prototype pollution and payload validation", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetRateLimitersForTest();
    resetJwksCacheForTest();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    resetRateLimitersForTest();
    resetJwksCacheForTest();
    vi.unstubAllGlobals();
  });

  it("rejects __proto__, constructor, and prototype keys across Worker POST routes", async () => {
    const signer = await createTestSigner();
    const token = await signer.mintToken({ sub: "proto-test-uid" });
    const webhookSecret = "synthetic-webhook-secret";
    const env: Env = {
      ...BASE_ENV,
      FIREBASE_PROJECT_ID: TEST_PROJECT_ID,
      NVIDIA_NIM_API_KEY: "test-nim-key",
      BEDROCK_MANTLE_API_KEY: "test-bedrock-key",
      LAB_WEBHOOK_SECRET: webhookSecret,
    };

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected upstream call: ${String(input)}`);
    });

    const generateRaw = '{"model":"gemini-4-hydrogen","contents":[],"__proto__":{"polluted":true}}';
    const resGenerate = await worker.fetch(
      new Request("https://api.example.test/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: generateRaw,
      }),
      env,
      {},
    );
    expect(resGenerate.status).toBe(400);

    const nimRaw = '{"model":"meta/llama-3.3-70b-instruct","messages":[{"role":"user","content":"hi","constructor":{"prototype":{"admin":true}}}]}';
    const resNim = await worker.fetch(
      new Request("https://api.example.test/api/ai/nim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: nimRaw,
      }),
      env,
      {},
    );
    expect(resNim.status).toBe(400);

    const bedrockRaw = '{"model":"deepseek.v3.2","messages":[{"role":"user","content":"hi"}],"prototype":{"evil":1}}';
    const resBedrock = await worker.fetch(
      new Request("https://api.example.test/api/ai/bedrock", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: bedrockRaw,
      }),
      env,
      {},
    );
    expect(resBedrock.status).toBe(400);

    const webhookRaw = '{"bookingId":"bk-proto","__proto__":{"admin":true}}';
    const webhookSig = await signWebhookHmac(webhookRaw, webhookSecret);
    const resWebhook = await worker.fetch(
      new Request("https://api.example.test/api/integrations/lab/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Lab-Signature-256": webhookSig,
        },
        body: webhookRaw,
      }),
      env,
      {},
    );
    expect(resWebhook.status).toBe(400);
  });
});

function toBase64Url(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("Worker JWT algorithm and claim hardening", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    resetRateLimitersForTest();
    resetJwksCacheForTest();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    resetRateLimitersForTest();
    resetJwksCacheForTest();
    vi.unstubAllGlobals();
  });

  it("rejects alg=none, alg=HS256, missing sub, future iat, and non-RSA JWKs", async () => {
    const signer = await createTestSigner();
    const env: Env = { ...BASE_ENV, FIREBASE_PROJECT_ID: TEST_PROJECT_ID };
    const now = Math.floor(Date.now() / 1000);

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected upstream call: ${String(input)}`);
    });

    const baseClaims = {
      iss: `https://securetoken.google.com/${TEST_PROJECT_ID}`,
      aud: TEST_PROJECT_ID,
      sub: "uid-1",
      auth_time: now - 60,
      iat: now - 60,
      exp: now + 3600,
    };

    const noneToken = `${toBase64Url({ alg: "none", kid: "synthetic-test-kid", typ: "JWT" })}.${toBase64Url(baseClaims)}.sig`;
    const hs256Token = `${toBase64Url({ alg: "HS256", kid: "synthetic-test-kid", typ: "JWT" })}.${toBase64Url(baseClaims)}.sig`;
    const missingSubToken = await signer.mintToken({ sub: "" });
    const futureIatToken = await signer.mintToken({ iat: now + 600 });

    for (const badToken of [noneToken, hs256Token, missingSubToken, futureIatToken]) {
      const res = await worker.fetch(
        new Request("https://api.example.test/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${badToken}` },
          body: JSON.stringify({ model: "gemini-4-hydrogen", contents: [] }),
        }),
        env,
        {},
      );
      expect(res.status).toBe(401);
    }

    // Reject non-RSA JWK even with RS256 header + matching kid
    resetJwksCacheForTest();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) {
        return new Response(
          JSON.stringify({
            keys: [{ kty: "oct", kid: "synthetic-test-kid", alg: "HS256", use: "sig", k: "secret" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      throw new Error(`Unexpected upstream call: ${String(input)}`);
    });

    const validShapeToken = await signer.mintToken();
    const resNonRsa = await worker.fetch(
      new Request("https://api.example.test/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${validShapeToken}` },
        body: JSON.stringify({ model: "gemini-4-hydrogen", contents: [] }),
      }),
      env,
      {},
    );
    expect(resNonRsa.status).toBe(401);
  });
});
