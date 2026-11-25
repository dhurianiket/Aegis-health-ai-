import { isPlainObject } from "./payloadSecurity";

const MAX_MODEL_ARMOR_SCREEN_CHARS = 16_384;
const MODEL_ARMOR_TIMEOUT_MS = 3_500;
const SEGMENT_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;

export interface ModelArmorScreenResult {
  blocked: boolean;
  skipped?: boolean;
  reason?: "prompt_injection" | "malicious_uri";
}

/**
 * Extracts text parts from Gemini `contents` for prompt-injection screening,
 * ignoring binary/base64 `inlineData` and capping total text length.
 */
export function extractPromptTextForScreening(contents: unknown): string {
  if (typeof contents === "string") {
    return contents.trim().slice(0, MAX_MODEL_ARMOR_SCREEN_CHARS);
  }
  if (!Array.isArray(contents)) {
    return "";
  }

  const chunks: string[] = [];
  let totalLen = 0;

  for (const item of contents) {
    if (totalLen >= MAX_MODEL_ARMOR_SCREEN_CHARS) break;
    if (typeof item === "string") {
      const piece = item.trim();
      if (piece) {
        chunks.push(piece);
        totalLen += piece.length + 1;
      }
      continue;
    }
    if (!isPlainObject(item) || !Array.isArray(item.parts)) continue;
    for (const part of item.parts) {
      if (totalLen >= MAX_MODEL_ARMOR_SCREEN_CHARS) break;
      if (isPlainObject(part) && typeof part.text === "string") {
        const piece = part.text.trim();
        if (piece) {
          chunks.push(piece);
          totalLen += piece.length + 1;
        }
      }
    }
  }

  return chunks.join("\n").slice(0, MAX_MODEL_ARMOR_SCREEN_CHARS).trim();
}

/**
 * Screens user prompt text using Google Cloud Model Armor `sanitizeUserPrompt`.
 * Fails open on network/timeout/5xx so transient security-plane outages never block clinical care.
 */
export async function screenPromptWithModelArmor(params: {
  text: string;
  projectId: string;
  location: string;
  templateId: string;
  accessToken: string;
  signal?: AbortSignal;
}): Promise<ModelArmorScreenResult> {
  const { text, projectId, location, templateId, accessToken, signal } = params;
  if (!text.trim()) {
    return { blocked: false, skipped: true };
  }

  if (!SEGMENT_PATTERN.test(projectId) || !SEGMENT_PATTERN.test(location) || !SEGMENT_PATTERN.test(templateId)) {
    return { blocked: false, skipped: true };
  }

  const endpoint =
    `https://modelarmor.${encodeURIComponent(location)}.rep.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}/templates/${encodeURIComponent(templateId)}:sanitizeUserPrompt`;

  const timeoutController = new AbortController();
  const timeoutHandle = setTimeout(() => timeoutController.abort(), MODEL_ARMOR_TIMEOUT_MS);
  const onCallerAbort = () => timeoutController.abort();
  signal?.addEventListener("abort", onCallerAbort, { once: true });

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-goog-user-project": projectId,
        "Content-Type": "application/json",
        "User-Agent": "AegisHealthAI-Edge/2.0",
      },
      body: JSON.stringify({
        userPromptData: {
          text: text.slice(0, MAX_MODEL_ARMOR_SCREEN_CHARS),
        },
      }),
      signal: timeoutController.signal,
    });

    if (!res.ok) {
      console.warn(`[ModelArmor] Upstream HTTP ${res.status}, failing open cleanly`);
      return { blocked: false, skipped: true };
    }

    const payload = (await res.json()) as {
      sanitizationResult?: {
        filterResults?: {
          pi_and_jailbreak?: {
            piAndJailbreakFilterResult?: { matchState?: unknown };
          };
          malicious_uris?: {
            maliciousUriFilterResult?: { matchState?: unknown };
          };
        };
      };
    };

    const filterResults = payload.sanitizationResult?.filterResults;
    const piMatch =
      filterResults?.pi_and_jailbreak?.piAndJailbreakFilterResult?.matchState === "MATCH_FOUND";
    if (piMatch) {
      return { blocked: true, reason: "prompt_injection" };
    }

    const uriMatch =
      filterResults?.malicious_uris?.maliciousUriFilterResult?.matchState === "MATCH_FOUND";
    if (uriMatch) {
      return { blocked: true, reason: "malicious_uri" };
    }

    return { blocked: false };
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn("[ModelArmor] Screening error/timeout, failing open cleanly:", err);
    return { blocked: false, skipped: true };
  } finally {
    clearTimeout(timeoutHandle);
    signal?.removeEventListener("abort", onCallerAbort);
  }
}
