import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  converseNim,
  NVIDIA_MODELS,
  NimError,
  __setNimFetchForTests,
} from "../nvidiaNimService";

describe("NVIDIA NIM Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    __setNimFetchForTests(null);
  });

  it("should successfully invoke an NVIDIA NIM chat completion model and parse response", async () => {
    const mockApiResponse = {
      id: "chatcmpl-test-123",
      model: NVIDIA_MODELS.NEMOTRON_70B,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({ verified: true, score: 0.99 }),
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 30,
        total_tokens: 180,
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as unknown as Response);

    __setNimFetchForTests(mockFetch);

    const result = await converseNim({
      model: NVIDIA_MODELS.NEMOTRON_70B,
      messages: [
        { role: "system", content: "You are a clinical evaluator." },
        { role: "user", content: "Verify potassium level: 4.2 mEq/L" },
      ],
      temperature: 0.05,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe("nvidia_nim");
    expect(result.model).toBe(NVIDIA_MODELS.NEMOTRON_70B);
    expect(result.text).toContain('"verified":true');
    expect(result.usage?.total_tokens).toBe(180);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should throw NimError when NVIDIA NIM endpoint returns HTTP 429 rate limit or error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: "Rate limit exceeded" } }),
    } as unknown as Response);

    __setNimFetchForTests(mockFetch);

    await expect(
      converseNim({
        messages: [{ role: "user", content: "test query" }],
      }),
    ).rejects.toThrow(NimError);
  });

  it("should throw NimError when HTTP 503 Service Unavailable occurs", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    } as unknown as Response);

    __setNimFetchForTests(mockFetch);

    try {
      await converseNim({
        messages: [{ role: "user", content: "test" }],
      });
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err).toBeInstanceOf(NimError);
      expect(err.status).toBe(503);
    }
  });
});
