// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import worker, { resetJwksCacheForTest, resetRateLimitersForTest, type Env } from "../index";
import { resetGcpTokenCacheForTest, sanitizeDiscoverySnippet } from "../gcpAuth";
import { createTestSigner, GOOGLE_JWKS_URL, TEST_PROJECT_ID, type TestSigner } from "./helpers/firebaseTestToken";

async function createEphemeralSaJson(): Promise<string> {
  const keyPair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;

  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey));
  let binary = "";
  for (let i = 0; i < pkcs8.length; i++) {
    binary += String.fromCharCode(pkcs8[i]);
  }
  const b64 = btoa(binary);
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  const header = ["-----BEGIN", "PRIVATE KEY-----"].join(" ");
  const footer = ["-----END", "PRIVATE KEY-----"].join(" ");
  const pem = `${header}\n${lines}\n${footer}\n`;

  return JSON.stringify({
    type: "service_account",
    project_id: TEST_PROJECT_ID,
    client_email: "aegis-edge-test@synthetic-project.iam.gserviceaccount.com",
    private_key: pem,
    token_uri: "https://oauth2.googleapis.com/token",
  });
}

let signer: TestSigner;
let idToken = "";
let vertexEnv: Env;

beforeAll(async () => {
  signer = await createTestSigner();
  idToken = await signer.mintToken();
  const saJson = await createEphemeralSaJson();
  vertexEnv = {
    GEMINI_API_KEY: "test-gemini-fallback-key",
    GCP_VERTEX_SA_JSON: saJson,
    FIREBASE_PROJECT_ID: TEST_PROJECT_ID,
    CLOUDFLARE_ACCOUNT_ID: "test-account",
    CF_AI_GATEWAY_ID: "test-gateway",
    GCP_VERTEX_LOCATION: "global",
    DISCOVERY_ENGINE_ID: "aegis-clinical-search",
    DISCOVERY_ENGINE_LOCATION: "global",
  };
});

describe("Worker Vertex AI routing & Discovery Engine clinical search", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    resetJwksCacheForTest();
    resetRateLimitersForTest();
    resetGcpTokenCacheForTest();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetJwksCacheForTest();
    resetRateLimitersForTest();
    resetGcpTokenCacheForTest();
  });

  it("reports vertexAiConfigured and clinicalSearchConfigured on /api/health", async () => {
    const res = await worker.fetch(new Request("https://api.example.test/api/health"), vertexEnv, {});
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("healthy");
    expect(body.vertexAiConfigured).toBe(true);
    expect(body.clinicalSearchConfigured).toBe(true);
  });

  it("routes /api/ai/generate via Cloudflare AI Gateway google-vertex-ai with privacy headers and normalizes payload", async () => {
    const calls: Array<{ url: string; headers: Record<string, string>; body: string }> = [];
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      if (url === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "synthetic-gcp-access-token", expires_in: 3600 }), { status: 200 });
      }
      calls.push({
        url,
        headers: (init?.headers || {}) as Record<string, string>,
        body: String(init?.body || ""),
      });
      return new Response(
        JSON.stringify({
          candidates: [{ content: { role: "model", parts: [{ text: "Clinical reply via Vertex" }] }, finishReason: "STOP" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const res = await worker.fetch(
      new Request("https://api.example.test/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "CF-Connecting-IP": "198.51.100.10",
        },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          contents: "Summarize CBC panel",
          systemInstruction: "Be concise.",
        }),
      }),
      vertexEnv,
      {},
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("X-AI-Provider")).toBe("vertex-ai");
    expect(res.headers.get("Cache-Control")).toBe("no-store, private");
    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe(
      `https://gateway.ai.cloudflare.com/v1/test-account/test-gateway/google-vertex-ai/v1/projects/${TEST_PROJECT_ID}/locations/global/publishers/google/models/gemini-3.8-flash:generateContent`,
    );
    expect(calls[0].headers["Authorization"]).toBe("Bearer synthetic-gcp-access-token");
    expect(calls[0].headers["cf-aig-skip-cache"]).toBe("true");
    expect(calls[0].headers["cf-aig-collect-log-payload"]).toBe("false");

    const sentBody = JSON.parse(calls[0].body) as {
      contents: Array<{ role?: string; parts?: Array<{ text?: string }> }>;
      systemInstruction: { role?: string; parts?: Array<{ text?: string }> };
    };
    expect(sentBody.contents[0].role).toBe("user");
    expect(sentBody.contents[0].parts?.[0]?.text).toBe("Summarize CBC panel");
    expect(sentBody.systemInstruction.role).toBe("user");
    expect(sentBody.systemInstruction.parts?.[0]?.text).toBe("Be concise.");
  });

  it("falls back cleanly to Google AI Studio when Vertex AI returns 404 or 503", async () => {
    const calledUrls: string[] = [];
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      if (url === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "synthetic-gcp-access-token", expires_in: 3600 }), { status: 200 });
      }
      calledUrls.push(url);
      if (url.includes("google-vertex-ai")) {
        return new Response(JSON.stringify({ error: { code: 404, message: "Not found" } }), { status: 404 });
      }
      return new Response(
        JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: "Fallback ok" }] }, finishReason: "STOP" }] }),
        { status: 200 },
      );
    });

    const res = await worker.fetch(
      new Request("https://api.example.test/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "CF-Connecting-IP": "198.51.100.11",
        },
        body: JSON.stringify({ model: "gemini-3.8-flash", contents: [{ role: "user", parts: [{ text: "Hi" }] }] }),
      }),
      vertexEnv,
      {},
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("X-AI-Provider")).toBe("google-ai-studio");
    expect(calledUrls.some((u) => u.includes("google-vertex-ai"))).toBe(true);
    expect(calledUrls.some((u) => u.includes("google-ai-studio"))).toBe(true);
  });

  it("enforces auth, prototype guard, and length cap on POST /api/ai/clinical-search", async () => {
    const unauthRes = await worker.fetch(
      new Request("https://api.example.test/api/ai/clinical-search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": "198.51.100.12" },
        body: JSON.stringify({ query: "warfarin" }),
      }),
      vertexEnv,
      {},
    );
    expect(unauthRes.status).toBe(401);

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      throw new Error("Unexpected upstream call");
    });

    const protoRes = await worker.fetch(
      new Request("https://api.example.test/api/ai/clinical-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "CF-Connecting-IP": "198.51.100.12",
        },
        body: '{"query":"warfarin","__proto__":{"admin":true}}',
      }),
      vertexEnv,
      {},
    );
    expect(protoRes.status).toBe(400);

    const longQueryRes = await worker.fetch(
      new Request("https://api.example.test/api/ai/clinical-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "CF-Connecting-IP": "198.51.100.12",
        },
        body: JSON.stringify({ query: "a".repeat(301) }),
      }),
      vertexEnv,
      {},
    );
    expect(longQueryRes.status).toBe(400);
  });

  it("queries Discovery Engine on /api/ai/clinical-search and strips HTML tags from snippets", async () => {
    let discoveryHeaders: Record<string, string> = {};
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      if (url === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "synthetic-gcp-access-token", expires_in: 3600 }), { status: 200 });
      }
      discoveryHeaders = (init?.headers || {}) as Record<string, string>;
      return new Response(
        JSON.stringify({
          totalSize: 1,
          summary: {
            summaryWithMetadata: {
              summary: "<b>Warfarin</b> + NSAIDs increases bleeding hazard (3.2x).",
              references: [{ title: "anticoagulant_antiplatelet_ddi_protocols", document: "projects/1/docs/9feb" }],
            },
          },
          results: [
            {
              id: "9feb",
              document: {
                id: "9feb",
                derivedStructData: {
                  title: "anticoagulant_antiplatelet_ddi_protocols",
                  link: "gs://aegis-health-app-90697.firebasestorage.app/protocols/anticoagulant_antiplatelet_ddi_protocols.md",
                  snippets: [{ snippet: "High-Alert: <b>Warfarin</b> &amp; <b>Aspirin</b>&nbsp;risk." }],
                },
              },
              retrievalSignals: { semanticRelevanceScore: 0.72 },
            },
          ],
        }),
        { status: 200 },
      );
    });

    const res = await worker.fetch(
      new Request("https://api.example.test/api/ai/clinical-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "CF-Connecting-IP": "198.51.100.13",
        },
        body: JSON.stringify({ query: "warfarin aspirin", pageSize: 3 }),
      }),
      vertexEnv,
      {},
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("X-AI-Provider")).toBe("discovery-engine");
    expect(discoveryHeaders["Authorization"]).toBe("Bearer synthetic-gcp-access-token");
    expect(discoveryHeaders["x-goog-user-project"]).toBe(TEST_PROJECT_ID);

    const data = (await res.json()) as {
      summary: string;
      results: Array<{ snippet: string; relevanceScore?: number }>;
      references: Array<{ title: string }>;
    };
    expect(data.summary).toBe("Warfarin + NSAIDs increases bleeding hazard (3.2x).");
    expect(data.results[0].snippet).toBe("High-Alert: Warfarin & Aspirin risk.");
    expect(data.results[0].snippet).not.toContain("<b>");
    expect(data.references[0].title).toBe("anticoagulant_antiplatelet_ddi_protocols");
  });

  it("sanitizes arbitrary script-like tags safely in linear time", () => {
    expect(sanitizeDiscoverySnippet('<script>alert(1)</script><b>Safe</b>&nbsp;&amp;&lt;tag&gt;')).toBe(
      "alert(1)Safe &<tag>",
    );
  });
});
