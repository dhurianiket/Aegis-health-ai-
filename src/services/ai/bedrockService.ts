/**
 * Unified AWS Bedrock Microservice for Aegis Health AI
 * 
 * Supports Anthropic Claude (3.5 Sonnet v2, 3.7 Sonnet, 3 Haiku) and Amazon Nova
 * deployed in AWS Mumbai (ap-south-1) for DPDP Act 2023 zero-data-egress compliance.
 * 
 * Features:
 * - Direct Converse API invocation with latency and token telemetry
 * - Automatic bi-directional failover between Google Gemini and AWS Bedrock Claude
 * - Isolated test mock injection for deterministic CI runs
 */

import { getAI, GeminiGenerateParams } from "../../lib/geminiClient";
import { safeGeminiCall } from "./promptFramework";

export const BEDROCK_MODELS = {
  CLAUDE_3_5_SONNET: "apac.anthropic.claude-3-5-sonnet-20241022-v2:0",
  CLAUDE_3_7_SONNET: "apac.anthropic.claude-3-7-sonnet-20250219-v1:0",
  CLAUDE_3_HAIKU: "apac.anthropic.claude-3-haiku-20240307-v1:0",
  AMAZON_NOVA_PRO: "apac.amazon.nova-pro-v1:0",
  AMAZON_NOVA_LITE: "apac.amazon.nova-lite-v1:0",
} as const;

export type BedrockModelKey = keyof typeof BEDROCK_MODELS;

export const DEFAULT_BEDROCK_REGION = "ap-south-1"; // Mumbai, India
export const DEFAULT_EXTRACTION_MODEL = BEDROCK_MODELS.CLAUDE_3_5_SONNET;
export const DEFAULT_REASONING_MODEL = BEDROCK_MODELS.CLAUDE_3_7_SONNET;

export interface BedrockMessageContent {
  text?: string;
  image?: {
    format: "png" | "jpeg" | "gif" | "webp";
    source: { bytes: string };
  };
}

export interface BedrockMessage {
  role: "user" | "assistant";
  content: BedrockMessageContent[];
}

export interface BedrockInferenceConfig {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface BedrockConverseParams {
  modelId?: string;
  region?: string;
  messages: BedrockMessage[];
  systemPrompt?: string;
  inferenceConfig?: BedrockInferenceConfig;
}

export interface BedrockConverseResponse {
  text: string;
  stopReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metrics?: {
    latencyMs: number;
  };
  modelId: string;
  provider: "bedrock";
  region: string;
}

export class BedrockError extends Error {
  status?: number;
  code?: string;
  modelId?: string;

  constructor(message: string, init?: { status?: number; code?: string; modelId?: string }) {
    super(message);
    this.name = "BedrockError";
    this.status = init?.status;
    this.code = init?.code;
    this.modelId = init?.modelId;
  }
}

let bedrockFetchForTests: typeof fetch | null = null;

/** Test-only: inject custom fetch implementation for Bedrock tests */
export function __setBedrockFetchForTests(fetchImpl: typeof fetch | null): void {
  bedrockFetchForTests = fetchImpl;
}

/**
 * Extracts plain text from a Bedrock converse response structure
 */
function extractBedrockText(output: any): string {
  if (!output) return "";
  if (typeof output.text === "string") return output.text;
  const messageContent = output?.message?.content || output?.output?.message?.content;
  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
}

/**
 * Executes a conversation with AWS Bedrock in Mumbai (ap-south-1)
 */
export async function converseBedrock(
  params: BedrockConverseParams,
  fetchImpl: typeof fetch = bedrockFetchForTests || fetch,
): Promise<BedrockConverseResponse> {
  const modelId = params.modelId || DEFAULT_EXTRACTION_MODEL;
  const region = params.region || DEFAULT_BEDROCK_REGION;
  const startTime = Date.now();

  const body: Record<string, any> = {
    messages: params.messages,
    inferenceConfig: {
      maxTokens: params.inferenceConfig?.maxTokens ?? 4096,
      temperature: params.inferenceConfig?.temperature ?? 0.1,
      ...(params.inferenceConfig?.topP !== undefined ? { topP: params.inferenceConfig.topP } : {}),
      ...(params.inferenceConfig?.stopSequences ? { stopSequences: params.inferenceConfig.stopSequences } : {}),
    },
  };

  if (params.systemPrompt) {
    body.system = [{ text: params.systemPrompt }];
  }

  // In test environment or when test fetch is mocked, invoke the fetch interface
  if (bedrockFetchForTests) {
    const response = await fetchImpl(
      `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new BedrockError(`Bedrock Converse API failed with status ${response.status}: ${errText}`, {
        status: response.status,
        modelId,
      });
    }

    const json = await response.json();
    const latencyMs = Date.now() - startTime;
    const text = extractBedrockText(json);

    return {
      text,
      stopReason: json?.stopReason || json?.output?.stopReason || "end_turn",
      usage: json?.usage || {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
      metrics: {
        latencyMs: json?.metrics?.latencyMs || latencyMs,
      },
      modelId,
      provider: "bedrock",
      region,
    };
  }

  // In browser/production: Route via secure backend endpoint or Cloud Functions adapter
  // If direct AWS credentials are not exposed to the browser (security best practice),
  // route through the backend proxy at api.aegishealthai.co.in or cloudfunctions.net
  try {
    const endpointUrl = typeof window !== "undefined"
      ? `${(import.meta as any).env?.VITE_EDGE_API_URL || "https://api.aegishealthai.co.in"}/api/bedrock/converse`
      : `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;

    const response = await fetchImpl(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bedrock-Region": region,
        "X-Bedrock-Model": modelId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new BedrockError(`Bedrock proxy returned HTTP ${response.status}`, {
        status: response.status,
        modelId,
      });
    }

    const json = await response.json();
    const text = extractBedrockText(json);
    return {
      text,
      stopReason: json?.stopReason || "end_turn",
      usage: json?.usage,
      metrics: { latencyMs: Date.now() - startTime },
      modelId,
      provider: "bedrock",
      region,
    };
  } catch (err: any) {
    if (err instanceof BedrockError) throw err;
    throw new BedrockError(`Failed to converse with AWS Bedrock: ${err?.message || err}`, {
      modelId,
    });
  }
}

export interface UnifiedAIParams {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  preferredProvider?: "gemini" | "bedrock";
  bedrockModelId?: string;
  geminiModel?: string;
  featureName?: string;
}

export interface UnifiedAIResponse {
  text: string;
  providerUsed: "gemini" | "bedrock";
  modelUsed: string;
  fallbackOccurred: boolean;
  originalError?: string;
}

/**
 * Unified AI call with automatic failover between Gemini (Google AI / Edge)
 * and Claude / Nova (AWS Bedrock Mumbai).
 */
export async function callWithUnifiedFallback(
  params: UnifiedAIParams,
): Promise<UnifiedAIResponse> {
  const preferred = params.preferredProvider || "gemini";
  let firstAttemptError: Error | null = null;

  if (preferred === "gemini") {
    try {
      const ai = getAI();
      const geminiParams: GeminiGenerateParams = {
        model: params.geminiModel || "gemini-3.6-flash",
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
        config: {
          systemInstruction: params.systemInstruction,
          maxOutputTokens: params.maxTokens || 4096,
          temperature: params.temperature ?? 0.1,
        },
      };

      const resp = await safeGeminiCall(
        () => ai.models.generateContent(geminiParams),
        2,
        params.featureName || "unified_gemini",
      );

      return {
        text: resp.text || "",
        providerUsed: "gemini",
        modelUsed: params.geminiModel || "gemini-3.6-flash",
        fallbackOccurred: false,
      };
    } catch (err: any) {
      console.warn("[Unified AI] Primary Gemini call failed. Failing over to AWS Bedrock Claude...", err?.message);
      firstAttemptError = err;

      // Failover to AWS Bedrock Claude in Mumbai
      try {
        const bedrockResp = await converseBedrock({
          modelId: params.bedrockModelId || DEFAULT_EXTRACTION_MODEL,
          systemPrompt: params.systemInstruction,
          messages: [{ role: "user", content: [{ text: params.prompt }] }],
          inferenceConfig: {
            maxTokens: params.maxTokens || 4096,
            temperature: params.temperature ?? 0.1,
          },
        });

        return {
          text: bedrockResp.text,
          providerUsed: "bedrock",
          modelUsed: bedrockResp.modelId,
          fallbackOccurred: true,
          originalError: firstAttemptError?.message,
        };
      } catch (bedrockErr: any) {
        throw new Error(
          `Unified AI failed on both providers. Gemini error: [${firstAttemptError?.message}]. Bedrock error: [${bedrockErr?.message}]`,
        );
      }
    }
  } else {
    // Bedrock preferred -> fallback to Gemini
    try {
      const bedrockResp = await converseBedrock({
        modelId: params.bedrockModelId || DEFAULT_EXTRACTION_MODEL,
        systemPrompt: params.systemInstruction,
        messages: [{ role: "user", content: [{ text: params.prompt }] }],
        inferenceConfig: {
          maxTokens: params.maxTokens || 4096,
          temperature: params.temperature ?? 0.1,
        },
      });

      return {
        text: bedrockResp.text,
        providerUsed: "bedrock",
        modelUsed: bedrockResp.modelId,
        fallbackOccurred: false,
      };
    } catch (err: any) {
      console.warn("[Unified AI] Primary Bedrock call failed. Failing over to Google Gemini...", err?.message);
      firstAttemptError = err;

      try {
        const ai = getAI();
        const geminiParams: GeminiGenerateParams = {
          model: params.geminiModel || "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ text: params.prompt }] }],
          config: {
            systemInstruction: params.systemInstruction,
            maxOutputTokens: params.maxTokens || 4096,
            temperature: params.temperature ?? 0.1,
          },
        };

        const resp = await safeGeminiCall(
          () => ai.models.generateContent(geminiParams),
          2,
          params.featureName || "unified_fallback_gemini",
        );

        return {
          text: resp.text || "",
          providerUsed: "gemini",
          modelUsed: params.geminiModel || "gemini-3.6-flash",
          fallbackOccurred: true,
          originalError: firstAttemptError?.message,
        };
      } catch (geminiErr: any) {
        throw new Error(
          `Unified AI failed on both providers. Bedrock error: [${firstAttemptError?.message}]. Gemini error: [${geminiErr?.message}]`,
        );
      }
    }
  }
}
