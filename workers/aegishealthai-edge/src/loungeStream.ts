/**
 * Guarded SSE streaming for Specialist Lounge replies.
 *
 * Reads Gemini `streamGenerateContent?alt=sse` output and re-emits a small,
 * stable event protocol to the SPA:
 *   event: delta    data: {"text": "..."}                 text to append
 *   event: replace  data: {"text": SAFE_DOSING_REPLY}     replace EVERYTHING shown so far
 *   event: done     data: {finishReason, modelVersion, usageMetadata, guard}
 *   event: error    data: {"message": "..."}
 *
 * Dosing guard: text is released at sentence boundaries only, and before each
 * release the WHOLE accumulated reply (including the unreleased tail) is run
 * through detectPatientDirectedDosing. On a hit the upstream is cancelled and a
 * `replace` event swaps the entire reply for the fixed safe message. Because
 * the check runs before a sentence is released, a dose instruction contained in
 * one sentence is never shown; the residual risk (a directive assembled across
 * sentences) is covered by `replace`, which also replaces already-shown text.
 */
import { SAFE_DOSING_REPLY, detectPatientDirectedDosing, type DosingDetection } from "./dosingGuard";

export interface LoungeStreamSummary {
  text: string;
  replaced: boolean;
  reason?: DosingDetection["reason"];
  finishReason?: string;
  modelVersion?: string;
  usageMetadata?: Record<string, unknown>;
  error?: string;
  /** Characters actually sent to the client as `delta` events. */
  releasedChars: number;
  /** The client went away / pressed Stop. */
  clientCancelled: boolean;
}

export interface GuardedStreamOptions {
  knownDoses: ReadonlySet<string>;
  /** Force-release after this many unreleased chars without a sentence boundary. */
  holdChars?: number;
  onComplete?: (summary: LoungeStreamSummary) => void;
}

const encoder = new TextEncoder();

export function sseEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

interface GeminiChunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: unknown; thought?: unknown }> }; finishReason?: unknown }>;
  usageMetadata?: Record<string, unknown>;
  modelVersion?: unknown;
  error?: { message?: unknown };
}

function chunkText(chunk: GeminiChunk): string {
  const parts = chunk.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p) => p && p.thought !== true && typeof p.text === "string")
    .map((p) => String(p.text))
    .join("");
}

/** Index just past the last sentence boundary in `s` (0 if none). */
export function lastSentenceBoundary(s: string): number {
  let idx = 0;
  const re = /[.!?।](?=\s)|\n/gu;
  for (const m of s.matchAll(re)) idx = (m.index ?? 0) + m[0].length;
  return idx;
}

/** Parses complete SSE event blocks out of `buffer`; returns data payloads and the leftover. */
export function parseSseBlocks(buffer: string): { payloads: string[]; rest: string } {
  const payloads: string[] = [];
  const blocks = buffer.split(/\r?\n\r?\n/);
  const rest = blocks.pop() ?? "";
  for (const block of blocks) {
    const data = block
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trimStart())
      .join("\n");
    if (data) payloads.push(data);
  }
  return { payloads, rest };
}

export function createGuardedLoungeStream(
  upstream: ReadableStream<Uint8Array>,
  options: GuardedStreamOptions,
): ReadableStream<Uint8Array> {
  const holdChars = options.holdChars ?? 400;
  const reader = upstream.getReader();
  const decoder = new TextDecoder();
  let cancelled = false;
  let clientCancelled = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let full = "";
      let released = 0;
      const summary: LoungeStreamSummary = { text: "", replaced: false, releasedChars: 0, clientCancelled: false };

      const tripped = (): boolean => {
        const d = detectPatientDirectedDosing(full, { knownDoses: options.knownDoses });
        if (!d.matched) return false;
        summary.replaced = true;
        summary.reason = d.reason;
        return true;
      };
      const replace = async () => {
        controller.enqueue(sseEvent("replace", { text: SAFE_DOSING_REPLY }));
        summary.text = SAFE_DOSING_REPLY;
        cancelled = true;
        await reader.cancel().catch(() => undefined);
      };
      const release = (upTo: number) => {
        if (upTo > released) {
          controller.enqueue(sseEvent("delta", { text: full.slice(released, upTo) }));
          released = upTo;
          summary.releasedChars = released;
        }
      };

      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { payloads, rest } = parseSseBlocks(buffer);
          buffer = rest;
          for (const raw of payloads) {
            let chunk: GeminiChunk;
            try {
              chunk = JSON.parse(raw) as GeminiChunk;
            } catch {
              continue;
            }
            if (chunk.error) {
              summary.error = String(chunk.error.message ?? "upstream error");
              controller.enqueue(sseEvent("error", { message: "The AI service returned an error. Please try again." }));
              cancelled = true;
              await reader.cancel().catch(() => undefined);
              break;
            }
            full += chunkText(chunk);
            const fr = chunk.candidates?.[0]?.finishReason;
            if (typeof fr === "string") summary.finishReason = fr;
            if (typeof chunk.modelVersion === "string") summary.modelVersion = chunk.modelVersion;
            if (chunk.usageMetadata) summary.usageMetadata = chunk.usageMetadata;

            if (tripped()) {
              await replace();
              break;
            }
            const pending = full.slice(released);
            let boundary = lastSentenceBoundary(pending);
            if (boundary === 0 && pending.length > holdChars) {
              const ws = pending.lastIndexOf(" ");
              boundary = ws > 0 ? ws + 1 : pending.length;
            }
            if (boundary > 0) release(released + boundary);
          }
          if (cancelled) break;
        }

        if (!cancelled) {
          // Final check on the complete reply before releasing the tail.
          if (tripped()) {
            await replace();
          } else {
            release(full.length);
            summary.text = full;
          }
        }
        if (!summary.error) {
          controller.enqueue(
            sseEvent("done", {
              finishReason: summary.replaced ? "STOP" : summary.finishReason,
              modelVersion: summary.modelVersion,
              usageMetadata: summary.usageMetadata,
              guard: summary.replaced ? "replaced" : "pass",
            }),
          );
        }
      } catch (err) {
        summary.error = err instanceof Error ? err.message : String(err);
        try {
          controller.enqueue(sseEvent("error", { message: "The AI stream was interrupted. Please try again." }));
        } catch {
          // controller already closed (client went away)
        }
      } finally {
        summary.clientCancelled = clientCancelled;
        options.onComplete?.(summary);
        try {
          controller.close();
        } catch {
          // already closed/cancelled
        }
      }
    },
    async cancel() {
      // Client disconnected / pressed Stop: stop reading from Gemini.
      cancelled = true;
      clientCancelled = true;
      await reader.cancel().catch(() => undefined);
    },
  });
}
