import type { GeminiGenerateResponse } from "../../../lib/geminiClient";

/**
 * Specialist Lounge model pinning and output limits.
 *
 * Pinned to STABLE Gemini model ids (not preview aliases) per Google's model
 * list (ai.google.dev/gemini-api/docs/models, last updated 2026-09-24):
 *   - gemini-3.8-flash : newest stable Flash ("most intelligent Flash").
 *   - gemini-3.6-flash : previous stable Flash; already the app-wide default
 *     in geminiClient, used as the fallback.
 * There is no stable Gemini 3.x Pro id (only `gemini-3.1-pro-preview`), so
 * summaries also use stable Flash with a larger output budget instead of the
 * previous `gemini-3.1-pro-preview` → Flash fallback.
 *
 * geminiClient falls back automatically (pinned → gemini-3.6-flash →
 * gemini-3.5-flash) on 5xx/"unavailable" or model-not-found errors, and
 * reports the model actually used as `modelUsed` / `modelVersion`.
 */
export const LOUNGE_CHAT_MODEL = "gemini-3.8-flash";
export const LOUNGE_SUMMARY_MODEL = "gemini-3.8-flash";
export const LOUNGE_FALLBACK_MODEL = "gemini-3.6-flash";

/**
 * Output caps. On Gemini 3.x, thinking tokens count toward maxOutputTokens and
 * a reply that hits the cap is truncated (or empty), so the Lounge also asks for
 * `thinkingLevel: "low"` and keeps some headroom above the answer length the
 * prompts request. The edge Worker enforces a hard ceiling of 4096.
 */
export const LOUNGE_CHAT_MAX_OUTPUT_TOKENS = 1536;
export const LOUNGE_SUMMARY_MAX_OUTPUT_TOKENS = 3072;
export const LOUNGE_THINKING_LEVEL = "low";

/** Edge feature flag that enables the Worker's Lounge output guard. */
export const LOUNGE_EDGE_FEATURE = "specialist";

export type LoungeGenerationConfig = {
  systemInstruction: string;
  temperature: number;
  maxOutputTokens: number;
  thinkingConfig: { thinkingLevel: string };
};

export function getLoungeModel(isSummaryRequest: boolean): string {
  return isSummaryRequest ? LOUNGE_SUMMARY_MODEL : LOUNGE_CHAT_MODEL;
}

export function buildLoungeGenerationConfig(systemInstruction: string, isSummaryRequest: boolean): LoungeGenerationConfig {
  return {
    systemInstruction,
    temperature: 0.1,
    maxOutputTokens: isSummaryRequest ? LOUNGE_SUMMARY_MAX_OUTPUT_TOKENS : LOUNGE_CHAT_MAX_OUTPUT_TOKENS,
    thinkingConfig: { thinkingLevel: LOUNGE_THINKING_LEVEL },
  };
}

/**
 * The model that actually produced a reply: Gemini's reported `modelVersion`
 * first, then the id the edge was called with after fallback, then the
 * requested model as a last resort.
 */
export function resolveModelUsed(chunk: Pick<GeminiGenerateResponse, "modelUsed" | "modelVersion"> | undefined, requestedModel: string): string {
  return chunk?.modelVersion || chunk?.modelUsed || requestedModel;
}

export const TRUNCATION_NOTE = "\n\n_(This reply was cut short to keep it brief. Ask me to continue if you'd like more.)_";

/** True for caller-initiated cancellation (AbortController.abort()). */
export function isAbortError(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { name?: unknown }).name === "AbortError";
}
