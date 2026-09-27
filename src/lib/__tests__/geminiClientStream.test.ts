import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type Mod = typeof import('../geminiClient');

function sseResponse(events: Array<[string, unknown]>, split = 13): Response {
  const bytes = new TextEncoder().encode(events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join(''));
  return new Response(
    new ReadableStream({
      start(c) {
        for (let i = 0; i < bytes.length; i += split) c.enqueue(bytes.slice(i, i + split));
        c.close();
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } },
  );
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function collect(gen: AsyncGenerator<import('../geminiClient').GeminiGenerateResponse>) {
  const out = [];
  for await (const c of gen) out.push(c);
  return out;
}

describe('geminiClient SSE streaming', () => {
  let mod: Mod;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_EDGE_API_URL', 'https://api.aegishealthai.co.in');
    mod = await import('../geminiClient');
    mod.setAuthTokenProvider(async () => 'test-firebase-id-token');
    mockFetch = vi.fn();
    mod.__setGeminiFetchForTests(mockFetch as unknown as typeof fetch);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    mod.__setGeminiFetchForTests(null);
  });

  it('parses SSE blocks and keeps partial data', () => {
    const { events, rest } = mod.parseSseEvents('event: delta\ndata: {"text":"a"}\n\nevent: done\ndata: {');
    expect(events).toEqual([{ event: 'delta', data: '{"text":"a"}' }]);
    expect(rest).toBe('event: done\ndata: {');
  });

  it('sends stream: true and yields delta, replace and done chunks', async () => {
    mockFetch.mockResolvedValueOnce(
      sseResponse([
        ['delta', { text: 'Hello. ' }],
        ['replace', { text: 'SAFE' }],
        ['done', { finishReason: 'STOP', modelVersion: 'gemini-3.8-flash', usageMetadata: { totalTokenCount: 9 } }],
      ]),
    );
    const chat = mod.getAI().chats.create({ model: 'gemini-3.8-flash', feature: 'specialist' });
    const chunks = await collect(await chat.sendMessageStream('hi'));
    const body = JSON.parse(String(mockFetch.mock.calls[0][1].body));
    expect(body).toMatchObject({ stream: true, aegisFeature: 'specialist' });
    expect(chunks.map((c) => [c.text, !!c.replace])).toEqual([
      ['Hello. ', false],
      ['SAFE', true],
      ['', false],
    ]);
    expect(chunks[2]).toMatchObject({ finishReason: 'STOP', modelVersion: 'gemini-3.8-flash', usageMetadata: { totalTokenCount: 9 } });
  });

  it('falls back to a single JSON chunk (non-Lounge route or older Worker)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ candidates: [{ content: { parts: [{ text: 'whole reply' }] }, finishReason: 'STOP' }] }));
    const chunks = await collect(await mod.getAI().models.generateContentStream({ contents: [] }));
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ text: 'whole reply', finishReason: 'STOP' });
  });

  it('surfaces the Lounge quota 429 with code and reset time (no retry, no fallback)', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: 'Daily Health Guides (AI) limit reached', code: 'LOUNGE_QUOTA_EXCEEDED', message: 'limit', resetAt: '2026-09-27T18:30:00.000Z' }, 429),
    );
    const chat = mod.getAI().chats.create({ model: 'gemini-3.8-flash', feature: 'specialist' });
    const err = await collect(await chat.sendMessageStream('hi')).catch((e) => e);
    expect(mod.isLoungeQuotaError(err)).toBe(true);
    expect(err).toMatchObject({ status: 429, resetAt: '2026-09-27T18:30:00.000Z', userMessage: 'limit' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to another model only before the first chunk', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, 503))
      .mockResolvedValueOnce(sseResponse([['delta', { text: 'ok' }], ['done', { finishReason: 'STOP' }]]));
    const chunks = await collect(await mod.getAI().chats.create({ model: 'gemini-3.8-flash', feature: 'specialist' }).sendMessageStream('hi'));
    expect(chunks[0].text).toBe('ok');
    expect(chunks[0].modelUsed).toBe('gemini-3.6-flash');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry after text was shown; a mid-stream error event throws', async () => {
    mockFetch.mockResolvedValueOnce(sseResponse([['delta', { text: 'partial ' }], ['error', { message: 'The AI stream was interrupted.' }]]));
    const seen: string[] = [];
    const gen = await mod.getAI().chats.create({ feature: 'specialist' }).sendMessageStream('hi');
    await expect(
      (async () => {
        for await (const c of gen) seen.push(c.text);
      })(),
    ).rejects.toThrow(/interrupted/);
    expect(seen).toEqual(['partial ']);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('treats a stream that ends without done as an error', async () => {
    mockFetch.mockResolvedValueOnce(sseResponse([['delta', { text: 'cut ' }]]));
    const gen = await mod.getAI().chats.create({ feature: 'specialist' }).sendMessageStream('hi');
    await expect(collect(gen)).rejects.toThrow(/ended unexpectedly/);
  });

  it('aborting mid-stream raises an AbortError and cancels the body', async () => {
    const controller = new AbortController();
    let cancelled = false;
    const enc = new TextEncoder();
    mockFetch.mockImplementationOnce(async (_url: string, init: RequestInit) => {
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(enc.encode(`event: delta\ndata: ${JSON.stringify({ text: 'first ' })}\n\n`));
          init.signal?.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')));
        },
        cancel() {
          cancelled = true;
        },
      });
      return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
    });
    const gen = await mod.getAI().chats.create({ feature: 'specialist', signal: controller.signal }).sendMessageStream('hi');
    const seen: string[] = [];
    const err = await (async () => {
      for await (const c of gen) {
        seen.push(c.text);
        controller.abort();
      }
    })().catch((e) => e);
    expect(seen).toEqual(['first ']);
    expect(mod.isAbortError(err)).toBe(true);
    void cancelled;
  });
});
