// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import worker, { resetJwksCacheForTest, resetRateLimitersForTest, type Env } from "../index";
import { resetGcpTokenCacheForTest } from "../gcpAuth";
import { deriveFhirTenantPrefix } from "../fhirCloud";
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
let expectedTenantPrefix = "";
let fhirEnv: Env;

beforeAll(async () => {
  signer = await createTestSigner();
  idToken = await signer.mintToken();
  expectedTenantPrefix = await deriveFhirTenantPrefix("synthetic-uid-001");
  const saJson = await createEphemeralSaJson();
  fhirEnv = {
    GCP_VERTEX_SA_JSON: saJson,
    FIREBASE_PROJECT_ID: TEST_PROJECT_ID,
    HEALTHCARE_LOCATION: "asia-south1",
    HEALTHCARE_DATASET_ID: "aegis-health-india",
    HEALTHCARE_FHIR_STORE_ID: "aegis-fhir-r4",
  };
});

describe("Worker Cloud Healthcare FHIR R4 routes", () => {
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

  it("reports fhirStoreConfigured and asia-south1 region on /api/health", async () => {
    const res = await worker.fetch(new Request("https://api.example.test/api/health"), fhirEnv, {});
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.fhirStoreConfigured).toBe(true);
    expect(body.fhirRegion).toBe("asia-south1");
  });

  it("enforces authentication, prototype pollution guard, and resourceType allowlist on POST /api/fhir/sync", async () => {
    const unauth = await worker.fetch(
      new Request("https://api.example.test/api/fhir/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": "198.51.100.31" },
        body: JSON.stringify({ bundle: { resourceType: "Bundle", entry: [] } }),
      }),
      fhirEnv,
      {},
    );
    expect(unauth.status).toBe(401);

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input) === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      throw new Error("Unexpected upstream call");
    });

    const protoRes = await worker.fetch(
      new Request("https://api.example.test/api/fhir/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "CF-Connecting-IP": "198.51.100.31",
        },
        body: '{"bundle":{"resourceType":"Bundle","__proto__":{"admin":true},"entry":[]}}',
      }),
      fhirEnv,
      {},
    );
    expect(protoRes.status).toBe(400);

    const disallowedRes = await worker.fetch(
      new Request("https://api.example.test/api/fhir/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "CF-Connecting-IP": "198.51.100.31",
        },
        body: JSON.stringify({
          bundle: {
            resourceType: "Bundle",
            type: "collection",
            entry: [{ resource: { resourceType: "Binary", id: "evil" } }],
          },
        }),
      }),
      fhirEnv,
      {},
    );
    expect(disallowedRes.status).toBe(400);
  });

  it("scopes IDs/references to caller UID, prunes empty strings, and posts FHIR R4 transaction bundle", async () => {
    let postedUrl = "";
    let postedHeaders: Record<string, string> = {};
    let postedBody = "";

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      if (url === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "synthetic-gcp-token", expires_in: 3600 }), { status: 200 });
      }
      postedUrl = url;
      postedHeaders = (init?.headers || {}) as Record<string, string>;
      postedBody = String(init?.body || "");
      return new Response(JSON.stringify({ resourceType: "Bundle", type: "transaction-response" }), { status: 200 });
    });

    const inputBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "DocumentReference",
            id: "docref-sbar-1",
            status: "current",
            subject: { reference: "Patient/victim-uid" },
            date: "2026-11-25",
            content: [{ attachment: { contentType: "text/markdown", title: "SBAR", data: "" } }],
          },
        },
        {
          resource: {
            resourceType: "DiagnosticReport",
            id: "diag-1",
            status: "final",
            code: { text: "Lab Panel" },
            subject: { reference: "Patient/victim-uid" },
            issued: "2026-11-25",
            result: [
              { reference: "Observation/obs-hb" },
              { reference: "Observation/external-victim-obs" },
            ],
          },
        },
        {
          resource: {
            resourceType: "Observation",
            id: "obs-hb",
            status: "final",
            code: { text: "Hemoglobin" },
            subject: { reference: "Patient/victim-uid" },
            effectiveDateTime: "2026-11-25",
            valueQuantity: { value: 14.2, unit: "" },
          },
        },
        {
          resource: {
            resourceType: "Patient",
            id: "victim-uid",
            meta: { lastUpdated: "2026-01-01T00:00:00Z" },
            active: true,
          },
        },
      ],
    };

    const res = await worker.fetch(
      new Request("https://api.example.test/api/fhir/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "CF-Connecting-IP": "198.51.100.32",
        },
        body: JSON.stringify({ bundle: inputBundle }),
      }),
      fhirEnv,
      {},
    );

    expect(res.status).toBe(200);
    expect(postedUrl).toBe(
      `https://healthcare.googleapis.com/v1/projects/${TEST_PROJECT_ID}/locations/asia-south1/datasets/aegis-health-india/fhirStores/aegis-fhir-r4/fhir`,
    );
    expect(postedHeaders["Content-Type"]).toBe("application/fhir+json; charset=utf-8");
    expect(postedHeaders["x-goog-user-project"]).toBe(TEST_PROJECT_ID);

    const tx = JSON.parse(postedBody) as {
      resourceType: string;
      type: string;
      entry: Array<{ request: { method: string; url: string }; resource: Record<string, any> }>;
    };

    expect(tx.resourceType).toBe("Bundle");
    expect(tx.type).toBe("transaction");
    expect(tx.entry.map((e) => e.resource.resourceType)).toEqual([
      "Patient",
      "Observation",
      "DiagnosticReport",
      "DocumentReference",
    ]);

    const expectedPatientId = `${expectedTenantPrefix}-self`;
    expect(tx.entry[0].resource.id).toBe(expectedPatientId);
    expect(tx.entry[0].resource.meta).toBeUndefined();
    expect(tx.entry[0].request).toEqual({ method: "PUT", url: `Patient/${expectedPatientId}` });

    const obs = tx.entry[1].resource;
    expect(obs.id).toBe(`${expectedTenantPrefix}-obs-hb`);
    expect(obs.subject.reference).toBe(`Patient/${expectedPatientId}`);
    expect(obs.valueQuantity).toEqual({ value: 14.2 });

    const diag = tx.entry[2].resource;
    expect(diag.subject.reference).toBe(`Patient/${expectedPatientId}`);
    expect(diag.issued).toBe("2026-11-25T00:00:00Z");
    expect(diag.result).toEqual([{ reference: `Observation/${expectedTenantPrefix}-obs-hb` }]);

    const doc = tx.entry[3].resource;
    expect(doc.subject.reference).toBe(`Patient/${expectedPatientId}`);
    expect(doc.date).toBe("2026-11-25T00:00:00Z");
    expect(doc.content[0].attachment.data).toBeUndefined();

    const json = (await res.json()) as { status: string; syncedCount: number; region: string; patientId: string };
    expect(json.status).toBe("synced");
    expect(json.syncedCount).toBe(4);
    expect(json.region).toBe("asia-south1");
    expect(json.patientId).toBe(expectedPatientId);
  });

  it("queries GET /api/fhir/status and deletes caller resources cleanly via DELETE /api/fhir/records", async () => {
    const expectedPatientId = `${expectedTenantPrefix}-self`;
    let deleteBody = "";

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === GOOGLE_JWKS_URL) {
        return new Response(JSON.stringify(signer.jwks), { status: 200 });
      }
      if (url === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "synthetic-gcp-token", expires_in: 3600 }), { status: 200 });
      }
      if (url.endsWith(`/Patient/${expectedPatientId}`)) {
        return new Response(JSON.stringify({ resourceType: "Patient", id: expectedPatientId }), { status: 200 });
      }
      if (url.includes("_summary=count")) {
        return new Response(JSON.stringify({ total: 2 }), { status: 200 });
      }
      if (init?.method === "GET" && url.includes("/Observation?")) {
        return new Response(
          JSON.stringify({
            entry: [
              { resource: { id: `${expectedTenantPrefix}-obs-1` } },
              { resource: { id: "u-deadbeefdeadbeef-leak" } },
            ],
          }),
          { status: 200 },
        );
      }
      if (init?.method === "GET") {
        return new Response(JSON.stringify({ entry: [] }), { status: 200 });
      }
      if (init?.method === "POST") {
        deleteBody = String(init.body || "");
        return new Response(JSON.stringify({ resourceType: "Bundle", type: "transaction-response" }), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });

    const statusRes = await worker.fetch(
      new Request("https://api.example.test/api/fhir/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}`, "CF-Connecting-IP": "198.51.100.33" },
      }),
      fhirEnv,
      {},
    );
    expect(statusRes.status).toBe(200);
    const statusJson = (await statusRes.json()) as {
      synced: boolean;
      patientId: string;
      counts: { observations: number; diagnosticReports: number; documentReferences: number };
    };
    expect(statusJson.synced).toBe(true);
    expect(statusJson.patientId).toBe(expectedPatientId);
    expect(statusJson.counts).toEqual({ observations: 2, diagnosticReports: 2, documentReferences: 2 });

    const delRes = await worker.fetch(
      new Request("https://api.example.test/api/fhir/records", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}`, "CF-Connecting-IP": "198.51.100.33" },
      }),
      fhirEnv,
      {},
    );
    expect(delRes.status).toBe(200);
    const delTx = JSON.parse(deleteBody) as { entry: Array<{ request: { method: string; url: string } }> };
    expect(delTx.entry.map((e) => e.request.url)).toEqual([
      `Observation/${expectedTenantPrefix}-obs-1`,
      `Patient/${expectedPatientId}`,
    ]);
    const delJson = (await delRes.json()) as { status: string; deletedCount: number };
    expect(delJson.status).toBe("deleted");
    expect(delJson.deletedCount).toBe(2);
  });
});
