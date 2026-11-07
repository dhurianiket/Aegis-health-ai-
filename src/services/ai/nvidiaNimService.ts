/**
 * NVIDIA NIM (Inference Microservice) Service for Aegis Health AI
 * 
 * Provides direct and edge-proxied access to NVIDIA NIM frontier models hosted on build.nvidia.com:
 * - nvidia/llama-3.1-nemotron-70b-instruct (Clinical reasoning, mathematical verification, factuality)
 * - nvidia/llama-3.1-nemotron-ultra-253b-v1 (Deep clinical audit)
 * - nvidia/llama-3.1-nemotron-safety-guard-8b-v3 (Clinical safety & contraindication guard)
 * - nvidia/mistral-nemo-minitron-8b-8k-instruct (Sub-200ms rapid verification)
 * 
 * In production SPA, calls route via Cloudflare Worker `POST /api/ai/nim` with Firebase JWT authentication,
 * ensuring zero client-side API key exposure.
 */

import { getAuthToken } from "../../lib/authTokenProvider";
import { getEdgeApiBaseUrl } from "../../lib/geminiClient";

export const NVIDIA_MODELS = {
  NEMOTRON_BOLT: "nvidia/nemotron-3.5-bolt-e4b",
  NEMOTRON_70B: "nvidia/llama-3.1-nemotron-70b-instruct",
  NEMOTRON_253B: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
  NEMO_GUARD: "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
  MINITRON_8B: "nvidia/mistral-nemo-minitron-8b-8k-instruct",
  MISTRAL_LARGE: "mistralai/mistral-large-2-instruct",
} as const;

export type NvidiaModelKey = keyof typeof NVIDIA_MODELS;

export const DEFAULT_NIM_MODEL = NVIDIA_MODELS.NEMOTRON_BOLT;
export const DEFAULT_NIM_GATEWAY = "https://integrate.api.nvidia.com/v1/chat/completions";

export interface NimChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NimCompletionParams {
  model?: string;
  messages: NimChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
  signal?: AbortSignal;
}

export interface NimUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface NimCompletionResponse {
  text: string;
  model: string;
  finishReason?: string;
  usage?: NimUsage;
  latencyMs: number;
  provider: "nvidia_nim";
}

export class NimError extends Error {
  public status?: number;
  public model?: string;
  public details?: unknown;

  constructor(message: string, options?: { status?: number; model?: string; details?: unknown }) {
    super(message);
    this.name = "NimError";
    this.status = options?.status;
    this.model = options?.model;
    this.details = options?.details;
  }
}

// Test harness mock injection
let nimFetchForTests: typeof fetch | null = null;

export function __setNimFetchForTests(mockFetch: typeof fetch | null): void {
  nimFetchForTests = mockFetch;
}

/**
 * Invokes an NVIDIA NIM chat completion model.
 * 
 * Security Architecture:
 * - If running in a browser with a signed-in user, routes through Cloudflare Edge (`/api/ai/nim`)
 *   with verified Firebase ID token so the `nvapi-...` key is never in client memory.
 * - In local dev/tests, falls back to direct `VITE_NVIDIA_NIM_API_KEY` or `NVIDIA_NIM_API_KEY`.
 */
export async function converseNim(params: NimCompletionParams): Promise<NimCompletionResponse> {
  const startTime = Date.now();
  const model = params.model || DEFAULT_NIM_MODEL;
  const fetchImpl = nimFetchForTests || fetch;

  const payload: Record<string, unknown> = {
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.1,
    top_p: params.top_p ?? 0.7,
    max_tokens: params.max_tokens ?? 2048,
  };

  if (params.response_format) {
    payload.response_format = params.response_format;
  }

  // 1. In test mock mode: invoke test fetch implementation
  if (nimFetchForTests) {
    const response = await fetchImpl(DEFAULT_NIM_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      signal: params.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new NimError(`NVIDIA NIM API failed with status ${response.status}: ${errText}`, {
        status: response.status,
        model,
      });
    }

    const json = await response.json();
    const latencyMs = Date.now() - startTime;
    const text = json.choices?.[0]?.message?.content || "";

    return {
      text,
      model: json.model || model,
      finishReason: json.choices?.[0]?.finish_reason || "stop",
      usage: json.usage,
      latencyMs,
      provider: "nvidia_nim",
    };
  }

  // 2. Production Browser Mode: Route via Cloudflare Edge Worker (/api/ai/nim)
  const isBrowser = typeof window !== "undefined";
  const directApiKey = (typeof process !== "undefined" && process.env?.NVIDIA_NIM_API_KEY) ||
    ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_NVIDIA_NIM_API_KEY) ? (import.meta as any).env.VITE_NVIDIA_NIM_API_KEY : "");

  let targetUrl = DEFAULT_NIM_GATEWAY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (isBrowser) {
    const idToken = await getAuthToken();
    if (idToken) {
      // Use secure Edge Proxy path
      targetUrl = `${getEdgeApiBaseUrl()}/api/ai/nim`;
      headers["Authorization"] = `Bearer ${idToken}`;
    } else if (directApiKey) {
      // Direct fallback (e.g. staging or dev)
      headers["Authorization"] = `Bearer ${directApiKey}`;
    } else {
      throw new NimError("Cannot invoke NVIDIA NIM: User not authenticated and no direct NIM API key configured.", {
        model,
      });
    }
  } else {
    // Node.js server / script environment
    if (!directApiKey) {
      throw new NimError("Cannot invoke NVIDIA NIM in Node.js: Missing NVIDIA_NIM_API_KEY environment variable.", {
        model,
      });
    }
    headers["Authorization"] = `Bearer ${directApiKey}`;
  }

  const response = await fetchImpl(targetUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: params.signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new NimError(`NVIDIA NIM invocation failed [${response.status}]: ${errText}`, {
      status: response.status,
      model,
    });
  }

  const json = await response.json();
  const latencyMs = Date.now() - startTime;
  const text = json.choices?.[0]?.message?.content || "";

  return {
    text,
    model: json.model || model,
    finishReason: json.choices?.[0]?.finish_reason || "stop",
    usage: json.usage,
    latencyMs,
    provider: "nvidia_nim",
  };
}
