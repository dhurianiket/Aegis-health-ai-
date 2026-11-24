import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setAuthTokenProvider } from "../../lib/authTokenProvider";
import { searchClinicalProtocols } from "../clinicalSearchService";

describe("clinicalSearchService", () => {
  beforeEach(() => {
    setAuthTokenProvider(async () => "fake-firebase-id-token");
  });

  afterEach(() => {
    setAuthTokenProvider(null);
  });

  it("sends authenticated POST request to /api/ai/clinical-search and parses response", async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.example.test/api/ai/clinical-search");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer fake-firebase-id-token");
      return new Response(
        JSON.stringify({
          query: "warfarin",
          engine: "aegis-clinical-search",
          source: "discovery-engine",
          totalSize: 1,
          summary: "Avoid NSAIDs with warfarin.",
          references: [{ title: "anticoagulant_antiplatelet_ddi_protocols", document: "doc-1" }],
          results: [
            {
              id: "doc-1",
              title: "anticoagulant_antiplatelet_ddi_protocols",
              uri: "gs://bucket/doc-1.md",
              snippet: "Warfarin + Aspirin carries 3.2x bleeding risk.",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const result = await searchClinicalProtocols("warfarin", {
      pageSize: 4,
      fetchImpl: mockFetch,
      baseUrlOverride: "https://api.example.test",
    });

    expect(result.source).toBe("discovery-engine");
    expect(result.summary).toBe("Avoid NSAIDs with warfarin.");
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("anticoagulant_antiplatelet_ddi_protocols");
  });

  it("rejects when user has no auth token", async () => {
    setAuthTokenProvider(null);
    await expect(searchClinicalProtocols("glucose")).rejects.toThrow("Authentication required");
  });

  it("rejects immediately when AbortSignal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      searchClinicalProtocols("glucose", { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
