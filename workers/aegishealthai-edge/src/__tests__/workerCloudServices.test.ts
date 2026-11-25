// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import worker, { resetJwksCacheForTest, resetRateLimitersForTest, type Env } from "../index";
import { resetGcpTokenCacheForTest } from "../gcpAuth";
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
let cloudEnv: Env;

beforeAll(async () => {
  signer = await createTestSigner();
  idToken = await signer.mintToken();
  const saJson = await createEphemeralSaJson();
  cloudEnv = {
    GCP_VERTEX_SA_JSON: saJson,
    FIREBASE_PROJECT_ID: TEST_PROJECT_ID,
  };
});

describe("Worker Cloud Text-to-Speech route", () => {
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

  it("reports cloudTtsConfigured and airQualityConfigured on /api/health", async () => {
    const res = await worker.fetch(new Request("https://api.example.test/api/health"), cloudEnv, {});
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.cloudTtsConfigured).toBe(true);
    expect(body.airQualityConfigured).toBe(true);
  });

  it("enforces auth and payload validation on POST /api/audio/synthesize", async () => {
    const unauth = await worker.fetch(
      new Request("https://api.example.test/api/audio/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": "198.51.100.51" },
        body: JSON.stringify({ text: "Hello", languageCode: "hi-IN" }),
      }),
      cloudEnv,
      {},
    );
    expect(unauth.status).toBe(401);

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      throw new Error("Unexpected upstream call");
    });

    const badLang = await worker.fetch(
      new Request("https://api.example.test/api/audio/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, "CF-Connecting-IP": "198.51.100.51" },
        body: JSON.stringify({ text: "Hello", languageCode: "fr-FR" }),
      }),
      cloudEnv,
      {},
    );
    expect(badLang.status).toBe(400);

    const emptyText = await worker.fetch(
      new Request("https://api.example.test/api/audio/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, "CF-Connecting-IP": "198.51.100.51" },
        body: JSON.stringify({ text: "**__**", languageCode: "hi-IN" }),
      }),
      cloudEnv,
      {},
    );
    expect(emptyText.status).toBe(400);
  });

  it("synthesizes Indian regional MP3 audio via Google Cloud Text-to-Speech", async () => {
    let ttsHeaders: Record<string, string> = {};
    let ttsBody = "";

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      if (url === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "synthetic-gcp-token", expires_in: 3600 }), { status: 200 });
      }
      ttsHeaders = (init?.headers || {}) as Record<string, string>;
      ttsBody = String(init?.body || "");
      return new Response(JSON.stringify({ audioContent: "SUQzBAAAAAA=" }), { status: 200 });
    });

    const res = await worker.fetch(
      new Request("https://api.example.test/api/audio/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, "CF-Connecting-IP": "198.51.100.52" },
        body: JSON.stringify({ text: "*आपका* HbA1c 6.8% है।", languageCode: "hi-IN", speakingRate: 2.5 }),
      }),
      cloudEnv,
      {},
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("X-AI-Provider")).toBe("google-cloud-tts");
    expect(ttsHeaders["x-goog-user-project"]).toBe(TEST_PROJECT_ID);
    const sent = JSON.parse(ttsBody) as {
      input: { text: string };
      voice: { languageCode: string };
      audioConfig: { audioEncoding: string; speakingRate: number };
    };
    expect(sent.input.text).toBe("आपका HbA1c 6.8% है।");
    expect(sent.voice.languageCode).toBe("hi-IN");
    expect(sent.audioConfig.audioEncoding).toBe("MP3");
    expect(sent.audioConfig.speakingRate).toBe(1.75);

    const json = (await res.json()) as { audioContent: string; provider: string; contentType: string };
    expect(json.audioContent).toBe("SUQzBAAAAAA=");
    expect(json.provider).toBe("google-cloud-tts");
    expect(json.contentType).toBe("audio/mpeg");
  });

  it("enforces auth, coordinate validation, and normalizes Google Air Quality metrics", async () => {
    const unauth = await worker.fetch(
      new Request("https://api.example.test/api/environment/air-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": "198.51.100.53" },
        body: JSON.stringify({ latitude: 19.076, longitude: 72.8777 }),
      }),
      cloudEnv,
      {},
    );
    expect(unauth.status).toBe(401);

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      if (url === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "synthetic-gcp-token", expires_in: 3600 }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          indexes: [{ code: "uaqi", aqi: 32, category: "Low air quality", dominantPollutant: "pm25" }],
          pollutants: [
            { code: "pm25", concentration: { value: 64.28 } },
            { code: "pm10", concentration: { value: 112.4 } },
          ],
          healthRecommendations: { generalPopulation: "Reduce intense outdoor exertion." },
        }),
        { status: 200 },
      );
    });

    const badLat = await worker.fetch(
      new Request("https://api.example.test/api/environment/air-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, "CF-Connecting-IP": "198.51.100.53" },
        body: JSON.stringify({ latitude: 95, longitude: 72.8777 }),
      }),
      cloudEnv,
      {},
    );
    expect(badLat.status).toBe(400);

    const res = await worker.fetch(
      new Request("https://api.example.test/api/environment/air-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, "CF-Connecting-IP": "198.51.100.53" },
        body: JSON.stringify({ latitude: 19.076, longitude: 72.8777 }),
      }),
      cloudEnv,
      {},
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("X-AI-Provider")).toBe("google-air-quality");
    const json = (await res.json()) as {
      aqi: number;
      category: string;
      dominantPollutant: string;
      pm25: number;
      pm10: number;
      healthAdvice: string;
      provider: string;
    };
    expect(json).toMatchObject({
      aqi: 32,
      category: "Low air quality",
      dominantPollutant: "pm25",
      pm25: 64.3,
      pm10: 112.4,
      healthAdvice: "Reduce intense outdoor exertion.",
      provider: "google-air-quality",
    });
  });
});
