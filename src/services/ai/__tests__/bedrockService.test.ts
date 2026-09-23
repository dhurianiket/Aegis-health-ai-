import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  converseBedrock,
  callWithUnifiedFallback,
  BEDROCK_MODELS,
  BedrockError,
  __setBedrockFetchForTests,
} from "../bedrockService";
import * as geminiClient from "../../../lib/geminiClient";
import * as promptFramework from "../promptFramework";

describe("AWS Bedrock Microservice (ap-south-1 Mumbai)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    __setBedrockFetchForTests(null);
  });

  describe("converseBedrock", () => {
    it("should successfully invoke Bedrock converse endpoint and parse response", async () => {
      const mockResponseBody = {
        output: {
          message: {
            role: "assistant",
            content: [{ text: "Consensus verified: all biomarkers within normal limits." }],
          },
        },
        stopReason: "end_turn",
        usage: {
          inputTokens: 120,
          outputTokens: 45,
          totalTokens: 165,
        },
        metrics: {
          latencyMs: 1150,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponseBody,
      } as unknown as Response);

      __setBedrockFetchForTests(mockFetch);

      const res = await converseBedrock({
        modelId: BEDROCK_MODELS.CLAUDE_3_5_SONNET,
        messages: [{ role: "user", content: [{ text: "Verify these markers" }] }],
        systemPrompt: "You are a clinical verification auditor.",
        inferenceConfig: { maxTokens: 1024, temperature: 0.1 },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("bedrock-runtime.ap-south-1.amazonaws.com");
      expect(url).toContain(encodeURIComponent(BEDROCK_MODELS.CLAUDE_3_5_SONNET));

      const parsedBody = JSON.parse(init.body as string);
      expect(parsedBody.system[0].text).toBe("You are a clinical verification auditor.");
      expect(parsedBody.messages[0].content[0].text).toBe("Verify these markers");
      expect(parsedBody.inferenceConfig.maxTokens).toBe(1024);

      expect(res.text).toBe("Consensus verified: all biomarkers within normal limits.");
      expect(res.stopReason).toBe("end_turn");
      expect(res.usage?.totalTokens).toBe(165);
      expect(res.metrics?.latencyMs).toBe(1150);
      expect(res.provider).toBe("bedrock");
      expect(res.region).toBe("ap-south-1");
    });

    it("should throw BedrockError on HTTP 4xx/5xx failure", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "AccessDeniedException: User not authorized to invoke model",
      } as unknown as Response);

      __setBedrockFetchForTests(mockFetch);

      await expect(
        converseBedrock({
          modelId: BEDROCK_MODELS.CLAUDE_3_5_SONNET,
          messages: [{ role: "user", content: [{ text: "Test prompt" }] }],
        }),
      ).rejects.toThrow(BedrockError);
    });
  });

  describe("callWithUnifiedFallback", () => {
    it("should return Gemini response directly when primary Gemini succeeds", async () => {
      vi.spyOn(promptFramework, "safeGeminiCall").mockResolvedValue({
        text: "Gemini analysis result",
      } as any);

      const res = await callWithUnifiedFallback({
        prompt: "Analyze this lab panel",
        preferredProvider: "gemini",
      });

      expect(res.providerUsed).toBe("gemini");
      expect(res.fallbackOccurred).toBe(false);
      expect(res.text).toBe("Gemini analysis result");
    });

    it("should failover to Bedrock Claude when Gemini call throws an error", async () => {
      vi.spyOn(promptFramework, "safeGeminiCall").mockRejectedValue(
        new Error("Gemini quota exhausted / rate limited"),
      );

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          output: {
            message: {
              content: [{ text: "Claude 3.5 Sonnet analysis result via Bedrock" }],
            },
          },
        }),
      } as unknown as Response);

      __setBedrockFetchForTests(mockFetch);

      const res = await callWithUnifiedFallback({
        prompt: "Analyze this lab panel",
        preferredProvider: "gemini",
      });

      expect(res.providerUsed).toBe("bedrock");
      expect(res.fallbackOccurred).toBe(true);
      expect(res.text).toBe("Claude 3.5 Sonnet analysis result via Bedrock");
      expect(res.originalError).toContain("quota exhausted");
    });

    it("should throw a composite error when both Gemini and Bedrock fail", async () => {
      vi.spyOn(promptFramework, "safeGeminiCall").mockRejectedValue(
        new Error("Gemini network timeout"),
      );

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "InternalServerError",
      } as unknown as Response);

      __setBedrockFetchForTests(mockFetch);

      await expect(
        callWithUnifiedFallback({
          prompt: "Analyze this lab panel",
          preferredProvider: "gemini",
        }),
      ).rejects.toThrow(/Unified AI failed on both providers/);
    });
  });
});
