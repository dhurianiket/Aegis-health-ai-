import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  converseBedrock,
  callWithUnifiedFallback,
  generateBedrockChat,
  evaluateClinicalConsensus,
  getAvailableMantleModels,
  BEDROCK_MODELS,
  BEDROCK_MANTLE_MODELS,
  DEFAULT_MANTLE_MODEL,
  BedrockError,
  __setBedrockFetchForTests,
} from "../bedrockService";
import * as geminiClient from "../../../lib/geminiClient";
import * as promptFramework from "../promptFramework";

describe("AWS Bedrock Microservice & Mantle Multi-Model Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    __setBedrockFetchForTests(null);
  });

  describe("BEDROCK_MANTLE_MODELS Registry", () => {
    it("should export verified active Mantle models", () => {
      expect(BEDROCK_MANTLE_MODELS.DEEPSEEK_V3_2).toBe("deepseek.v3.2");
      expect(BEDROCK_MANTLE_MODELS.MISTRAL_LARGE_3).toBe("mistral.mistral-large-3-675b-instruct");
      expect(BEDROCK_MANTLE_MODELS.GLM_5).toBe("zai.glm-5");
      expect(BEDROCK_MANTLE_MODELS.GLM_4_7_FLASH).toBe("zai.glm-4.7-flash");
      expect(BEDROCK_MANTLE_MODELS.KIMI_K2_THINKING).toBe("moonshotai.kimi-k2-thinking");
      expect(BEDROCK_MANTLE_MODELS.PALMYRA_VISION).toBe("writer.palmyra-vision-7b");
      expect(BEDROCK_MANTLE_MODELS.QWEN3_VL).toBe("qwen.qwen3-vl-235b-a22b-instruct");
      expect(BEDROCK_MANTLE_MODELS.GPT_SAFEGUARD_120B).toBe("openai.gpt-oss-safeguard-120b");
      expect(DEFAULT_MANTLE_MODEL).toBe(BEDROCK_MANTLE_MODELS.DEEPSEEK_V3_2);
    });
  });

  describe("converseBedrock (ap-south-1 Mumbai)", () => {
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

  describe("generateBedrockChat (Bedrock Mantle us-east-1)", () => {
    it("should call edge proxy /api/ai/bedrock with correct payload and return response", async () => {
      const mockChatResponse = {
        id: "chatcmpl-test-123",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Differential diagnosis: 1. Mild dehydration 2. Viral gastritis",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 45,
          completion_tokens: 30,
          total_tokens: 75,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockChatResponse,
      } as unknown as Response);

      const res = await generateBedrockChat(
        {
          model: BEDROCK_MANTLE_MODELS.DEEPSEEK_V3_2,
          messages: [
            { role: "system", content: "You are a clinical diagnostic assistant." },
            { role: "user", content: "Analyze elevated creatinine 1.4 mg/dL." },
          ],
          temperature: 0.2,
          maxTokens: 1024,
        },
        mockFetch,
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/ai/bedrock");
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe(BEDROCK_MANTLE_MODELS.DEEPSEEK_V3_2);
      expect(body.messages).toHaveLength(2);
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(1024);

      expect(res.text).toBe("Differential diagnosis: 1. Mild dehydration 2. Viral gastritis");
      expect(res.modelUsed).toBe(BEDROCK_MANTLE_MODELS.DEEPSEEK_V3_2);
      expect(res.provider).toBe("aws-bedrock-mantle");
      expect(res.usage?.totalTokens).toBe(75);
    });

    it("should throw BedrockError when proxy returns an error status", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => "Bad Gateway: Upstream Mantle unavailable",
      } as unknown as Response);

      await expect(
        generateBedrockChat(
          {
            messages: [{ role: "user", content: "Hello" }],
          },
          mockFetch,
        ),
      ).rejects.toThrow(BedrockError);
    });
  });

  describe("getAvailableMantleModels", () => {
    it("should return catalog from edge endpoint when fetch succeeds", async () => {
      const mockModels = [
        {
          id: "deepseek.v3.2",
          name: "DeepSeek V3.2",
          tier: "reasoning",
          provider: "DeepSeek",
          contextWindow: "128K",
          description: "Frontier clinical reasoning",
        },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ models: mockModels }),
      } as unknown as Response);

      const models = await getAvailableMantleModels(mockFetch);
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe("deepseek.v3.2");
    });

    it("should fall back to default catalog if network call fails", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network offline"));
      const models = await getAvailableMantleModels(mockFetch);
      expect(models.length).toBeGreaterThanOrEqual(5);
      expect(models.some((m) => m.id === BEDROCK_MANTLE_MODELS.DEEPSEEK_V3_2)).toBe(true);
    });
  });

  describe("evaluateClinicalConsensus", () => {
    it("should run dual evaluation with Gemini and Bedrock Mantle and score agreement", async () => {
      vi.spyOn(promptFramework, "safeGeminiCall").mockResolvedValue({
        text: "The patient demonstrates microcytic hypochromic anemia consistent with iron deficiency.",
      } as any);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Findings indicate microcytic hypochromic anemia likely due to chronic iron deficiency.",
              },
            },
          ],
        }),
      } as unknown as Response);

      const consensus = await evaluateClinicalConsensus(
        {
          prompt: "Evaluate CBC panel: Hb 9.2 g/dL, MCV 72 fL, Ferritin 8 ng/mL.",
          systemInstruction: "Verify clinical hematology findings.",
        },
        mockFetch,
      );

      expect(consensus.consensusAchieved).toBe(true);
      expect(consensus.confidenceScore).toBeGreaterThanOrEqual(0.75);
      expect(consensus.primaryResult.provider).toBe("gemini");
      expect(consensus.primaryResult.text).toContain("microcytic hypochromic anemia");
      expect(consensus.secondaryResult.provider).toBe("aws-bedrock-mantle");
      expect(consensus.secondaryResult.text).toContain("iron deficiency");
    });

    it("should gracefully handle primary Gemini failure by falling back to Bedrock Mantle output", async () => {
      vi.spyOn(promptFramework, "safeGeminiCall").mockRejectedValue(
        new Error("Gemini quota rate limit"),
      );

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Bedrock Mantle assessment: acute pharyngitis.",
              },
            },
          ],
        }),
      } as unknown as Response);

      const consensus = await evaluateClinicalConsensus(
        {
          prompt: "Patient with sore throat and fever 101F.",
        },
        mockFetch,
      );

      expect(consensus.consensusAchieved).toBe(true);
      expect(consensus.confidenceScore).toBe(0.85);
      expect(consensus.combinedClinicalAssessment).toBe("Bedrock Mantle assessment: acute pharyngitis.");
      expect(consensus.primaryResult.text).toBe("");
      expect(consensus.secondaryResult.text).toBe("Bedrock Mantle assessment: acute pharyngitis.");
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
