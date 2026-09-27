// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import worker, { type Env } from "../index";
import { SAFE_DOSING_REPLY } from "../dosingGuard";

// Test-only credential for the shared-secret auth path (not a real secret).
const TEST_ENV: Env = {
  GEMINI_API_KEY: "test-gemini-key-not-real",
  EDGE_SHARED_SECRET: "test-shared-secret-not-real",
  CLOUDFLARE_ACCOUNT_ID: "test-account",
  CF_AI_GATEWAY_ID: "test-gateway",
};

function geminiReply(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }], modelVersion: "gemini-3.8-flash" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function generateRequest(body: Record<string, unknown>, headers: Record<string, string> = {}): Request {
  return new Request("https://api.example.test/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TEST_ENV.EDGE_SHARED_SECRET}`, ...headers },
    body: JSON.stringify(body),
  });
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
    fetchMock.mockResolvedValueOnce(geminiReply("ok"));
    await worker.fetch(generateRequest({ model: "gemini-3.6-flash", contents: [] }), TEST_ENV, {});
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("gateway.ai.cloudflare.com");
    expect((init.headers as Record<string, string>)["cf-aig-collect-log-payload"]).toBe("false");
  });

  it("replaces patient-directed dosing for Lounge requests (body flag) and clamps maxOutputTokens", async () => {
    fetchMock.mockResolvedValueOnce(geminiReply("Take 20 units of insulin tonight."));
    const res = await worker.fetch(
      generateRequest({ model: "gemini-3.8-flash", aegisFeature: "specialist", contents: [], generationConfig: { maxOutputTokens: 100000 } }),
      TEST_ENV,
      {},
    );
    const data = (await res.json()) as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    expect(data.candidates[0].content.parts[0].text).toBe(SAFE_DOSING_REPLY);
    expect(res.headers.get("X-Aegis-Output-Guard")).toBe("replaced");
    const sent = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)) as { generationConfig: { maxOutputTokens: number } };
    expect(sent.generationConfig.maxOutputTokens).toBe(4096);
    // The feature flag itself is not forwarded upstream.
    expect(JSON.stringify(sent)).not.toContain("aegisFeature");
  });

  it("also honours the X-Aegis-Feature header", async () => {
    fetchMock.mockResolvedValueOnce(geminiReply("Increase metformin to 1000 mg."));
    const res = await worker.fetch(generateRequest({ contents: [] }, { "X-Aegis-Feature": "specialist" }), TEST_ENV, {});
    expect(res.headers.get("X-Aegis-Output-Guard")).toBe("replaced");
  });

  it("does NOT touch non-Lounge routes such as report extraction", async () => {
    const extraction = '{"medications":[{"name":"Metformin","dose":"500 mg","instructions":"Take 1 tablet twice daily"}]}';
    fetchMock.mockResolvedValueOnce(geminiReply(extraction));
    const res = await worker.fetch(
      generateRequest({ contents: [], generationConfig: { maxOutputTokens: 30000, responseMimeType: "application/json" } }),
      TEST_ENV,
      {},
    );
    const data = (await res.json()) as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    expect(data.candidates[0].content.parts[0].text).toBe(extraction);
    expect(res.headers.get("X-Aegis-Output-Guard")).toBe("off");
    const sent = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)) as { generationConfig: { maxOutputTokens: number } };
    expect(sent.generationConfig.maxOutputTokens).toBe(30000);
  });

  it("allows the X-Aegis-Feature header in CORS preflight", async () => {
    const res = await worker.fetch(new Request("https://api.example.test/api/ai/generate", { method: "OPTIONS" }), TEST_ENV, {});
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("X-Aegis-Feature");
  });
});
