import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setAuthTokenProvider } from "../../lib/authTokenProvider";
import { fetchLocalAirQuality } from "../environmentHealthService";

describe("environmentHealthService", () => {
  beforeEach(() => {
    setAuthTokenProvider(async () => "fake-firebase-id-token");
  });

  afterEach(() => {
    setAuthTokenProvider(null);
  });

  it("validates coordinates and authentication before fetching AQI", async () => {
    await expect(fetchLocalAirQuality(120, 72.8)).rejects.toThrow("Invalid latitude");
    await expect(fetchLocalAirQuality(19.0, 200)).rejects.toThrow("Invalid longitude");
    setAuthTokenProvider(null);
    await expect(fetchLocalAirQuality(19.076, 72.8777)).rejects.toThrow("Authentication required");
  });

  it("fetches normalized local Air Quality metrics via /api/environment/air-quality", async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.example.test/api/environment/air-quality");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer fake-firebase-id-token");
      return new Response(
        JSON.stringify({
          aqi: 44,
          category: "Moderate air quality",
          dominantPollutant: "pm25",
          pm25: 55.2,
          pm10: 91.0,
          healthAdvice: "Sensitive groups should limit outdoor exertion.",
          provider: "google-air-quality",
          fetchedAt: "2026-11-25T12:00:00Z",
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const aqi = await fetchLocalAirQuality(19.076, 72.8777, {
      fetchImpl: mockFetch,
      baseUrlOverride: "https://api.example.test",
    });

    expect(aqi.aqi).toBe(44);
    expect(aqi.pm25).toBe(55.2);
    expect(aqi.provider).toBe("google-air-quality");
  });
});
