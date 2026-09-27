/** Shared fakes for Worker quota / streaming tests (synthetic data only). */
import type { DurableStorageLike } from "../../quota";

export function fakeStorage(): DurableStorageLike & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async <T,>(k: string) => data.get(k) as T | undefined,
    put: async <T,>(k: string, v: T) => {
      data.set(k, structuredClone(v));
    },
  };
}

export function geminiSse(chunks: Array<Record<string, unknown>>): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const body = chunks.map((c) => `data: ${JSON.stringify(c)}\r\n\r\n`).join("");
  // Split at awkward byte offsets to exercise buffering.
  const bytes = enc.encode(body);
  const pieces: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += 17) pieces.push(bytes.slice(i, i + 17));
  return new ReadableStream({
    start(c) {
      pieces.forEach((p) => c.enqueue(p));
      c.close();
    },
  });
}

export const textChunk = (text: string, extra: Record<string, unknown> = {}) => ({
  candidates: [{ content: { role: "model", parts: [{ text }] }, ...extra }],
});

