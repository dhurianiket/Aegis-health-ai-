import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setAuthTokenProvider } from "../../lib/authTokenProvider";
import {
  syncFhirBundleToCloud,
  getCloudFhirStatus,
  deleteCloudFhirRecords,
} from "../cloudFhirService";
import type { FhirBundle } from "../../types/fhir";

const SAMPLE_BUNDLE: FhirBundle = {
  resourceType: "Bundle",
  id: "bundle-1",
  type: "collection",
  timestamp: "2026-11-25T10:00:00Z",
  total: 1,
  entry: [
    {
      fullUrl: "urn:uuid:patient-1",
      resource: {
        resourceType: "Patient",
        id: "patient-1",
        active: true,
        name: [{ use: "official", text: "Test Patient" }],
      },
    },
  ],
};

describe("cloudFhirService", () => {
  beforeEach(() => {
    setAuthTokenProvider(async () => "fake-firebase-id-token");
  });

  afterEach(() => {
    setAuthTokenProvider(null);
  });

  it("requires authentication before syncing to Cloud Healthcare", async () => {
    setAuthTokenProvider(null);
    await expect(syncFhirBundleToCloud(SAMPLE_BUNDLE)).rejects.toThrow("Sign in to sync FHIR R4");
  });

  it("syncs, queries status, and deletes Cloud Healthcare FHIR R4 records", async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer fake-firebase-id-token");

      if (url.endsWith("/api/fhir/sync") && init?.method === "POST") {
        const payload = JSON.parse(String(init.body)) as { bundle: FhirBundle };
        expect(payload.bundle.resourceType).toBe("Bundle");
        return new Response(
          JSON.stringify({
            status: "synced",
            region: "asia-south1",
            datasetId: "aegis-health-india",
            fhirStoreId: "aegis-fhir-r4",
            patientId: "u-1234-self",
            syncedCount: 1,
            resourceTypes: { Patient: 1 },
            syncedAt: "2026-11-25T10:00:00Z",
          }),
          { status: 200 },
        );
      }

      if (url.endsWith("/api/fhir/status") && init?.method === "GET") {
        return new Response(
          JSON.stringify({
            configured: true,
            region: "asia-south1",
            datasetId: "aegis-health-india",
            fhirStoreId: "aegis-fhir-r4",
            patientId: "u-1234-self",
            synced: true,
            counts: { observations: 4, diagnosticReports: 1, documentReferences: 1 },
          }),
          { status: 200 },
        );
      }

      if (url.endsWith("/api/fhir/records") && init?.method === "DELETE") {
        return new Response(
          JSON.stringify({
            status: "deleted",
            region: "asia-south1",
            datasetId: "aegis-health-india",
            fhirStoreId: "aegis-fhir-r4",
            patientId: "u-1234-self",
            deletedCount: 7,
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ message: "Unexpected endpoint" }), { status: 400 });
    }) as unknown as typeof fetch;

    const syncRes = await syncFhirBundleToCloud(SAMPLE_BUNDLE, {
      fetchImpl: mockFetch,
      baseUrlOverride: "https://api.example.test",
    });
    expect(syncRes.status).toBe("synced");
    expect(syncRes.region).toBe("asia-south1");
    expect(syncRes.syncedCount).toBe(1);

    const statusRes = await getCloudFhirStatus({
      fetchImpl: mockFetch,
      baseUrlOverride: "https://api.example.test",
    });
    expect(statusRes.synced).toBe(true);
    expect(statusRes.counts.observations).toBe(4);

    const deleteRes = await deleteCloudFhirRecords({
      fetchImpl: mockFetch,
      baseUrlOverride: "https://api.example.test",
    });
    expect(deleteRes.status).toBe("deleted");
    expect(deleteRes.deletedCount).toBe(7);
  });

  it("surfaces error messages from non-OK responses", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ message: "FHIR Bundle validation error" }), { status: 400 }),
    ) as unknown as typeof fetch;

    await expect(
      syncFhirBundleToCloud(SAMPLE_BUNDLE, {
        fetchImpl: mockFetch,
        baseUrlOverride: "https://api.example.test",
      }),
    ).rejects.toThrow("FHIR Bundle validation error");
  });
});
