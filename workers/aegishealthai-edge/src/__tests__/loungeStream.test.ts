// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createGuardedLoungeStream, lastSentenceBoundary, parseSseBlocks } from "../loungeStream";
import { SAFE_DOSING_REPLY } from "../dosingGuard";
import { geminiSse, textChunk } from "./helpers/edgeFakes";

async function collect(stream: ReadableStream<Uint8Array>): Promise<Array<{ event: string; data: any }>> {
  const text = await new Response(stream).text();
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const [ev, data] = block.split("\n");
      return { event: ev.replace("event: ", ""), data: JSON.parse(data.replace("data: ", "")) };
    });
}

describe("SSE helpers", () => {
  it("parses complete blocks and keeps the remainder", () => {
    const { payloads, rest } = parseSseBlocks('data: {"a":1}\n\ndata: {"b"');
    expect(payloads).toEqual(['{"a":1}']);
    expect(rest).toBe('data: {"b"');
  });
  it("finds sentence boundaries but not decimals", () => {
    expect(lastSentenceBoundary("Take care. Your HbA1c is 6.5")).toBe(10);
    expect(lastSentenceBoundary("No boundary 2.5 here")).toBe(0);
    expect(lastSentenceBoundary("रक्तचाप सामान्य है। अच्छा")).toBe("रक्तचाप सामान्य है।".length);
  });
});

describe("createGuardedLoungeStream", () => {
  it("streams safe text as sentence-level deltas and reports usage", async () => {
    let summary: any;
    const events = await collect(
      createGuardedLoungeStream(
        geminiSse([
          textChunk("Your blood pressure "),
          textChunk("looks well controlled. Keep walking "),
          { candidates: [{ content: { parts: [{ text: "secret reasoning", thought: true }] } }] },
          textChunk("daily.", { finishReason: "STOP" }),
          { usageMetadata: { totalTokenCount: 321 }, modelVersion: "gemini-3.8-flash" },
        ]),
        { knownDoses: new Set(), onComplete: (s) => (summary = s) },
      ),
    );
    const deltas = events.filter((e) => e.event === "delta").map((e) => e.data.text);
    expect(deltas.join("")).toBe("Your blood pressure looks well controlled. Keep walking daily.");
    expect(deltas[0]).toBe("Your blood pressure looks well controlled.");
    expect(events.at(-1)).toMatchObject({ event: "done", data: { guard: "pass", finishReason: "STOP", usageMetadata: { totalTokenCount: 321 } } });
    expect(JSON.stringify(events)).not.toContain("secret reasoning");
    expect(summary).toMatchObject({ replaced: false, usageMetadata: { totalTokenCount: 321 } });
  });

  it("never releases a dosing sentence: emits replace and stops reading upstream", async () => {
    let pulledAfterTrip = false;
    const enc = new TextEncoder();
    const upstream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode(`data: ${JSON.stringify(textChunk("Diabetes is common. "))}\n\n`));
        c.enqueue(enc.encode(`data: ${JSON.stringify(textChunk("Take 20 units of insulin tonight."))}\n\n`));
      },
      pull() {
        pulledAfterTrip = true;
      },
      cancel() {},
    });
    let summary: any;
    const events = await collect(createGuardedLoungeStream(upstream, { knownDoses: new Set(), onComplete: (s) => (summary = s) }));
    const shown = events.filter((e) => e.event === "delta").map((e) => e.data.text).join("");
    expect(shown).not.toContain("20 units");
    expect(events.find((e) => e.event === "replace")?.data.text).toBe(SAFE_DOSING_REPLY);
    expect(events.at(-1)).toMatchObject({ event: "done", data: { guard: "replaced" } });
    expect(summary.replaced).toBe(true);
    void pulledAfterTrip;
  });

  it("replaces already-shown text when a later chunk completes a dose instruction (unterminated tail)", async () => {
    const events = await collect(
      createGuardedLoungeStream(geminiSse([textChunk("OK. Increase metformin"), textChunk(" to 1000 mg")]), { knownDoses: new Set() }),
    );
    expect(events.map((e) => e.event)).toEqual(["delta", "replace", "done"]);
    expect(events[0].data.text).toBe("OK.");
  });

  it("allows doses already present in the patient's own data", async () => {
    const events = await collect(
      createGuardedLoungeStream(geminiSse([textChunk("You take metformin 500 mg twice daily as prescribed.")]), {
        knownDoses: new Set(["500mg"]),
      }),
    );
    expect(events.some((e) => e.event === "replace")).toBe(false);
  });

  it("force-releases long text without sentence boundaries", async () => {
    const long = "word ".repeat(120);
    const events = await collect(createGuardedLoungeStream(geminiSse([textChunk(long), textChunk("end")]), { knownDoses: new Set(), holdChars: 100 }));
    const deltas = events.filter((e) => e.event === "delta");
    expect(deltas.length).toBeGreaterThanOrEqual(2);
    expect(deltas.map((e) => e.data.text).join("")).toBe(long + "end");
  });

  it("surfaces an upstream error event without leaking details", async () => {
    let summary: any;
    const events = await collect(
      createGuardedLoungeStream(geminiSse([{ error: { message: "quota exhausted for key xyz" } }]), {
        knownDoses: new Set(),
        onComplete: (s) => (summary = s),
      }),
    );
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("error");
    expect(JSON.stringify(events)).not.toContain("xyz");
    expect(summary.error).toBeTruthy();
  });
});

describe("createGuardedLoungeStream — client cancel", () => {
  it("cancels upstream and reports clientCancelled when the client stops reading", async () => {
    let upstreamCancelled = false;
    const enc = new TextEncoder();
    const upstream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "First sentence. " }] } }] })}\n\n`));
      },
      cancel() {
        upstreamCancelled = true;
      },
    });
    let summary: any;
    const out = createGuardedLoungeStream(upstream, { knownDoses: new Set(), onComplete: (s) => (summary = s) });
    const reader = out.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toContain("First sentence.");
    await reader.cancel();
    await new Promise((r) => setTimeout(r, 0));
    expect(upstreamCancelled).toBe(true);
    expect(summary).toMatchObject({ clientCancelled: true, releasedChars: "First sentence.".length });
  });
});
