import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('geminiClient edge proxy + model normalization', () => {
  let getAI: typeof import('../geminiClient').getAI;
  let __setGeminiFetchForTests: (f: typeof fetch | null) => void;
  let normalizeModel: (m: string | undefined) => string;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv('VITE_AEGIS_EDGE_BEARER', 'test-edge-bearer');
    vi.stubEnv('VITE_EDGE_API_URL', 'https://api.aegishealthai.co.in');

    mockFetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}')) as { model?: string };
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: `ok:${body.model}` }] } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    const mod = await import('../geminiClient');
    getAI = mod.getAI;
    __setGeminiFetchForTests = mod.__setGeminiFetchForTests;
    normalizeModel = mod.normalizeModel;
    __setGeminiFetchForTests(mockFetch as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    __setGeminiFetchForTests(null);
  });

  it('throws when VITE_AEGIS_EDGE_BEARER is not set', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_AEGIS_EDGE_BEARER', '');
    const mod = await import('../geminiClient');
    expect(() => mod.getAI()).toThrow(/VITE_AEGIS_EDGE_BEARER/);
  });

  it('normalizeModel maps flash/pro aliases', () => {
    expect(normalizeModel('gemini-2.5-flash')).toBe('gemini-3.6-flash');
    expect(normalizeModel('gemini-1.5-pro')).toBe('gemini-3.1-pro-preview');
    expect(normalizeModel('gemini-3.6-flash')).toBe('gemini-3.6-flash');
  });

  describe('Model Normalization via edge POST', () => {
    it.each([
      ['gemini-3-flash-preview', 'gemini-3.6-flash'],
      ['gemini-3.5-flash', 'gemini-3.6-flash'],
      ['gemini-2.0-flash', 'gemini-3.6-flash'],
      ['gemini-1.5-flash', 'gemini-3.6-flash'],
      ['gemini-2.5-flash', 'gemini-3.6-flash'],
      ['gemini-2.5-flash-lite', 'gemini-3.6-flash'],
      ['gemini-1.5-pro', 'gemini-3.1-pro-preview'],
      ['gemini-2.5-pro', 'gemini-3.1-pro-preview'],
      ['gemini-3.6-flash', 'gemini-3.6-flash'],
    ])('maps model "%s" to "%s" for generateContent', async (inputModel, expectedModel) => {
      const ai = getAI();
      const res = await ai.models.generateContent({ model: inputModel, contents: 'hello' }) as { text: string };

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.aegishealthai.co.in/api/ai/generate');
      expect((init as RequestInit).headers).toMatchObject({
        Authorization: 'Bearer test-edge-bearer',
      });
      const body = JSON.parse(String((init as RequestInit).body));
      expect(body.model).toBe(expectedModel);
      expect(body.contents).toBe('hello');
      expect(res.text).toBe(`ok:${expectedModel}`);
    });

    it.each([
      ['gemini-3-flash-preview', 'gemini-3.6-flash'],
      ['gemini-1.5-pro', 'gemini-3.1-pro-preview'],
    ])('maps model "%s" to "%s" for generateContentStream (non-stream polyfill)', async (inputModel, expectedModel) => {
      const ai = getAI();
      const stream = await ai.models.generateContentStream({ model: inputModel, contents: 'stream test' });
      const chunks: Array<{ text: string }> = [];
      for await (const chunk of stream) {
        chunks.push(chunk as { text: string });
      }
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe(`ok:${expectedModel}`);
      const body = JSON.parse(String((mockFetch.mock.calls[0][1] as RequestInit).body));
      expect(body.model).toBe(expectedModel);
    });
  });

  describe('503 Error Resilience', () => {
    it('retries with gemini-3.6-flash then succeeds', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Service Unavailable' }), { status: 503 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Fallback success' }] } }],
        }), { status: 200 }));

      const ai = getAI();
      const result = await ai.models.generateContent({ model: 'gemini-1.5-pro', contents: 'test prompt' }) as { text: string };
      expect(result.text).toBe('Fallback success');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const models = mockFetch.mock.calls.map((c) => JSON.parse(String((c[1] as RequestInit).body)).model);
      expect(models).toEqual(['gemini-3.1-pro-preview', 'gemini-3.6-flash']);
    });

    it('retries secondary gemini-3.5-flash after both primary paths 503', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Overloaded' }), { status: 503 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'High demand' }), { status: 503 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Secondary fallback success' }] } }],
        }), { status: 200 }));

      const ai = getAI();
      const result = await ai.models.generateContent({ model: 'gemini-1.5-pro', contents: 'test prompt' }) as { text: string };
      expect(result.text).toBe('Secondary fallback success');
      const models = mockFetch.mock.calls.map((c) => JSON.parse(String((c[1] as RequestInit).body)).model);
      expect(models).toEqual(['gemini-3.1-pro-preview', 'gemini-3.6-flash', 'gemini-3.5-flash']);
    });

    it('does NOT retry non-503 errors', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Invalid argument provided' }), { status: 400 }));
      const ai = getAI();
      await expect(ai.models.generateContent({ model: 'gemini-1.5-pro', contents: 'test' })).rejects.toMatchObject({ status: 400 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
