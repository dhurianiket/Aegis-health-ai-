// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import worker, { type Env } from "../index";
import { SAFE_DOSING_REPLY } from "../dosingGuard";

import { createTestSigner, GOOGLE_JWKS_URL, TEST_PROJECT_ID, type TestSigner } from "./helpers/firebaseTestToken";

// Synthetic, obviously-fake configuration values (not real credentials).
const TEST_ENV: Env = {
  GEMINI_API_KEY: "test-gemini-key-not-real",
  FIREBASE_PROJECT_ID: TEST_PROJECT_ID,
  CLOUDFLARE_ACCOUNT_ID: "test-account",
  CF_AI_GATEWAY_ID: "test-gateway",
};

let signer: TestSigner;
let idToken = "";

beforeAll(async () => {
  signer = await createTestSigner();
  idToken = await signer.mintToken();
});

function geminiReply(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }], modelVersion: "gemini-3.8-flash" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function generateRequest(body: Record<string, unknown>, headers: Record<string, string> = {}, signal?: AbortSignal): Request {
  return new Request("https://api.example.test/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, ...headers },
    body: JSON.stringify(body),
    signal,
  });
}

/** Routes JWKS lookups to the test key; every other call is served from `queue`. */
function installFetch(fetchMock: ReturnType<typeof vi.fn>, queue: Array<Response | Error>) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === GOOGLE_JWKS_URL) {
      return new Response(JSON.stringify(signer.jwks), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const next = queue.shift();
    if (!next) throw new Error(`unexpected fetch ${url}`);
    if (next instanceof Error) throw next;
    return next;
  });
}

function upstreamCalls(fetchMock: ReturnType<typeof vi.fn>): Array<[string, RequestInit]> {
  return (fetchMock.mock.calls as Array<[RequestInfo | URL, RequestInit]>)
    .filter(([u]) => String(u) !== GOOGLE_JWKS_URL)
    .map(([u, init]) => [String(u), init]);
}

describe("Worker /api/ai/generate — Lounge guard, token clamp, gateway logging header", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends cf-aig-collect-log-payload: false on AI Gateway requests", async () => {
    installFetch(fetchMock, [geminiReply("ok")]);
    await worker.fetch(generateRequest({ model: "gemini-3.6-flash", contents: [] }), TEST_ENV, {});
    const [url, init] = upstreamCalls(fetchMock)[0];
    expect(url).toContain("gateway.ai.cloudflare.com");
    expect((init.headers as Record<string, string>)["cf-aig-collect-log-payload"]).toBe("false");
  });

  it("replaces patient-directed dosing for Lounge requests (body flag) and clamps maxOutputTokens", async () => {
    installFetch(fetchMock, [geminiReply("Take 20 units of insulin tonight.")]);
    const res = await worker.fetch(
      generateRequest({ model: "gemini-3.8-flash", aegisFeature: "specialist", contents: [], generationConfig: { maxOutputTokens: 100000 } }),
      TEST_ENV,
      {},
    );
    const data = (await res.json()) as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    expect(data.candidates[0].content.parts[0].text).toBe(SAFE_DOSING_REPLY);
    expect(res.headers.get("X-Aegis-Output-Guard")).toBe("replaced");
    const sent = JSON.parse(String(upstreamCalls(fetchMock)[0][1].body)) as { generationConfig: { maxOutputTokens: number } };
    expect(sent.generationConfig.maxOutputTokens).toBe(4096);
    // The feature flag itself is not forwarded upstream.
    expect(JSON.stringify(sent)).not.toContain("aegisFeature");
  });

  it("also honours the X-Aegis-Feature header", async () => {
    installFetch(fetchMock, [geminiReply("Increase metformin to 1000 mg.")]);
    const res = await worker.fetch(generateRequest({ contents: [] }, { "X-Aegis-Feature": "specialist" }), TEST_ENV, {});
    expect(res.headers.get("X-Aegis-Output-Guard")).toBe("replaced");
  });

  it("does NOT touch non-Lounge routes such as report extraction", async () => {
    const extraction = '{"medications":[{"name":"Metformin","dose":"500 mg","instructions":"Take 1 tablet twice daily"}]}';
    installFetch(fetchMock, [geminiReply(extraction)]);
    const res = await worker.fetch(
      generateRequest({ contents: [], generationConfig: { maxOutputTokens: 30000, responseMimeType: "application/json" } }),
      TEST_ENV,
      {},
    );
    const data = (await res.json()) as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    expect(data.candidates[0].content.parts[0].text).toBe(extraction);
    expect(res.headers.get("X-Aegis-Output-Guard")).toBe("off");
    const sent = JSON.parse(String(upstreamCalls(fetchMock)[0][1].body)) as { generationConfig: { maxOutputTokens: number } };
    expect(sent.generationConfig.maxOutputTokens).toBe(30000);
  });

  it("allows the X-Aegis-Feature header in CORS preflight", async () => {
    const res = await worker.fetch(new Request("https://api.example.test/api/ai/generate", { method: "OPTIONS" }), TEST_ENV, {});
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("X-Aegis-Feature");
  });

  it("skips the AI Gateway cache for Lounge requests only", async () => {
    installFetch(fetchMock, [geminiReply("General heart-health information."), geminiReply("{}")]);
    await worker.fetch(generateRequest({ aegisFeature: "specialist", contents: [] }), TEST_ENV, {});
    await worker.fetch(generateRequest({ contents: [] }), TEST_ENV, {});
    const [lounge, extraction] = upstreamCalls(fetchMock);
    expect((lounge[1].headers as Record<string, string>)["cf-aig-skip-cache"]).toBe("true");
    expect((extraction[1].headers as Record<string, string>)["cf-aig-skip-cache"]).toBeUndefined();
  });

  it("passes the client abort signal through to the upstream Gemini fetch", async () => {
    installFetch(fetchMock, [geminiReply("ok")]);
    const controller = new AbortController();
    await worker.fetch(generateRequest({ aegisFeature: "specialist", contents: [] }, {}, controller.signal), TEST_ENV, {});
    const [, init] = upstreamCalls(fetchMock)[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    controller.abort();
    expect(init.signal?.aborted).toBe(true);
  });

  it("returns 499 and does NOT fail over to direct Google when the client aborted", async () => {
    const controller = new AbortController();
    const abortErr = new DOMException("The operation was aborted.", "AbortError");
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      controller.abort();
      throw abortErr;
    });
    const res = await worker.fetch(generateRequest({ aegisFeature: "specialist", contents: [] }, {}, controller.signal), TEST_ENV, {});
    expect(res.status).toBe(499);
    expect(upstreamCalls(fetchMock)).toHaveLength(1);
  });
});

describe("Worker auth — Firebase ID token only", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts a valid Firebase ID token", async () => {
    installFetch(fetchMock, [geminiReply("ok")]);
    const res = await worker.fetch(generateRequest({ contents: [] }), TEST_ENV, {});
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Auth-Method")).toBe("firebase_jwt");
  });

  it("rejects a static bearer even if a legacy EDGE_SHARED_SECRET is still configured", async () => {
    installFetch(fetchMock, []);
    const legacyEnv = { ...TEST_ENV, EDGE_SHARED_SECRET: "legacy-static-bearer-not-real" } as Env;
    const res = await worker.fetch(
      generateRequest({ contents: [] }, { Authorization: "Bearer legacy-static-bearer-not-real" }),
      legacyEnv,
      {},
    );
    expect(res.status).toBe(401);
    expect(upstreamCalls(fetchMock)).toHaveLength(0);
  });

  it("rejects an expired or wrong-audience token", async () => {
    installFetch(fetchMock, []);
    const expired = await signer.mintToken({ exp: Math.floor(Date.now() / 1000) - 10 });
    const wrongAud = await signer.mintToken({ aud: "some-other-project" });
    for (const token of [expired, wrongAud]) {
      const res = await worker.fetch(generateRequest({ contents: [] }, { Authorization: `Bearer ${token}` }), TEST_ENV, {});
      expect(res.status).toBe(401);
    }
    expect(upstreamCalls(fetchMock)).toHaveLength(0);
  });
});
