// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import worker, { type Env } from "../index";
import { LoungeQuota, type DurableNamespaceLike } from "../quota";
import { SAFE_DOSING_REPLY } from "../dosingGuard";
import { createTestSigner, GOOGLE_JWKS_URL, TEST_PROJECT_ID, type TestSigner } from "./helpers/firebaseTestToken";
import { fakeStorage, geminiSse, textChunk } from "./helpers/edgeFakes";

let signer: TestSigner;
let freeToken = "";
let clinicToken = "";

beforeAll(async () => {
  signer = await createTestSigner();
  freeToken = await signer.mintToken();
  clinicToken = await signer.mintToken({ sub: "synthetic-clinic-uid", aegis_plan: "b2b_clinic_monthly" });
});

function fakeQuotaNamespace() {
  const objects = new Map<string, LoungeQuota>();
  const ns: DurableNamespaceLike = {
    idFromName: (name: string) => name,
    get: (id: unknown) => {
      const key = String(id);
      if (!objects.has(key)) objects.set(key, new LoungeQuota({ storage: fakeStorage() }));
      const obj = objects.get(key)!;
      return { fetch: (url: string, init?: RequestInit) => obj.fetch(new Request(url, init)) };
    },
  };
  return { ns, objects };
}

function jsonReply(text: string, totalTokenCount = 100): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }], usageMetadata: { totalTokenCount } }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function sseReply(chunks: Array<Record<string, unknown>>): Response {
  return new Response(geminiSse(chunks), { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

function loungeRequest(token: string, extra: Record<string, unknown> = {}): Request {
  return new Request("https://api.example.test/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Origin: "https://aegishealthai.co.in" },
    body: JSON.stringify({ aegisFeature: "specialist", contents: [], ...extra }),
  });
}

describe("Worker — Lounge quota and SSE streaming", () => {
  const fetchMock = vi.fn();
  let queue: Array<Response | Error>;
  let waits: Promise<unknown>[];
  const ctx = { waitUntil: (p: Promise<unknown>) => waits.push(p) };

  beforeEach(() => {
    queue = [];
    waits = [];
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) return new Response(JSON.stringify(signer.jwks), { status: 200 });
      const next = queue.shift();
      if (!next) throw new Error(`unexpected fetch ${String(input)}`);
      if (next instanceof Error) throw next;
      return next;
    });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const envWith = (ns?: DurableNamespaceLike): Env => ({
    GEMINI_API_KEY: "test-gemini-key-not-real",
    FIREBASE_PROJECT_ID: TEST_PROJECT_ID,
    LOUNGE_QUOTA: ns,
  });

  it("returns a friendly 429 with reset info once the free daily message limit is used", async () => {
    const { ns } = fakeQuotaNamespace();
    const env = envWith(ns);
    for (let i = 0; i < 40; i++) {
      queue.push(jsonReply("General information."));
      const ok = await worker.fetch(loungeRequest(freeToken), env, ctx);
      expect(ok.status).toBe(200);
    }
    const res = await worker.fetch(loungeRequest(freeToken), env, ctx);
    expect(res.status).toBe(429);
    const body = (await res.json()) as { code: string; resetAt: string; message: string };
    expect(body.code).toBe("LOUNGE_QUOTA_EXCEEDED");
    expect(Date.parse(body.resetAt)).toBeGreaterThan(Date.now());
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(res.headers.get("X-Aegis-Quota-Remaining")).toBe("0");
    expect(res.headers.get("Access-Control-Expose-Headers")).toContain("Retry-After");
    // No upstream call for the blocked request.
    expect(queue).toHaveLength(0);
  });

  it("uses the plan tier from the verified token claim, per uid", async () => {
    const { ns, objects } = fakeQuotaNamespace();
    queue.push(jsonReply("ok"));
    const res = await worker.fetch(loungeRequest(clinicToken), envWith(ns), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Aegis-Quota-Remaining")).toBe("599");
    expect([...objects.keys()]).toEqual(["synthetic-clinic-uid"]);
  });

  it("commits token usage and refunds the message on upstream errors", async () => {
    const { ns, objects } = fakeQuotaNamespace();
    const env = envWith(ns);
    queue.push(jsonReply("ok", 1234));
    await worker.fetch(loungeRequest(freeToken), env, ctx);
    queue.push(new Response(JSON.stringify({ error: { message: "bad" } }), { status: 400 }));
    await worker.fetch(loungeRequest(freeToken), env, ctx);
    await Promise.all(waits);
    const storage = (objects.get("synthetic-uid-001") as unknown as { state: { storage: { data: Map<string, unknown> } } }).state.storage;
    expect(storage.data.get("usage")).toMatchObject({ messages: 1, tokens: 1234 });
  });

  it("does not apply the quota to non-Lounge routes and fails open without the binding", async () => {
    const { ns, objects } = fakeQuotaNamespace();
    queue.push(jsonReply("{}"));
    const nonLounge = new Request("https://api.example.test/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${freeToken}` },
      body: JSON.stringify({ contents: [] }),
    });
    expect((await worker.fetch(nonLounge, envWith(ns), ctx)).status).toBe(200);
    expect(objects.size).toBe(0);
    queue.push(jsonReply("ok"));
    expect((await worker.fetch(loungeRequest(freeToken), envWith(undefined), ctx)).status).toBe(200);
  });

  it("streams guarded SSE via streamGenerateContent when stream: true", async () => {
    const { ns, objects } = fakeQuotaNamespace();
    queue.push(sseReply([textChunk("Walking helps. "), textChunk("Sleep matters too.", { finishReason: "STOP" }), { usageMetadata: { totalTokenCount: 77 } }]));
    const res = await worker.fetch(loungeRequest(freeToken, { stream: true }), envWith(ns), ctx);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(res.headers.get("X-Aegis-Stream")).toBe("1");
    const text = await res.text();
    expect(text).toContain("event: delta");
    expect(text).toContain("Walking helps.");
    expect(text).toContain('"guard":"pass"');
    const [url, init] = fetchMock.mock.calls.filter(([u]) => String(u) !== GOOGLE_JWKS_URL)[0] as [string, RequestInit];
    expect(url).toContain(":streamGenerateContent?alt=sse&key=");
    expect(String(init.body)).not.toContain('"stream"');
    await Promise.all(waits);
    const storage = (objects.get("synthetic-uid-001") as unknown as { state: { storage: { data: Map<string, unknown> } } }).state.storage;
    expect(storage.data.get("usage")).toMatchObject({ messages: 1, tokens: 77 });
  });

  it("replaces a streamed dosing reply", async () => {
    queue.push(sseReply([textChunk("Take 20 units of insulin tonight.")]));
    const res = await worker.fetch(loungeRequest(freeToken, { stream: true }), envWith(undefined), ctx);
    const text = await res.text();
    expect(text).not.toContain("20 units");
    expect(text).toContain("event: replace");
    expect(text).toContain(JSON.stringify(SAFE_DOSING_REPLY));
  });

  it("ignores stream: true for non-Lounge routes", async () => {
    queue.push(jsonReply("{}"));
    const req = new Request("https://api.example.test/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${freeToken}` },
      body: JSON.stringify({ contents: [], stream: true }),
    });
    const res = await worker.fetch(req, envWith(undefined), ctx);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const [url] = fetchMock.mock.calls.filter(([u]) => String(u) !== GOOGLE_JWKS_URL)[0] as [string];
    expect(url).toContain(":generateContent?key=");
  });
});
