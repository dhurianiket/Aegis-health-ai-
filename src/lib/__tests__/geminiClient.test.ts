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

  it('reports edge configuration from bearer env', async () => {
    const mod = await import('../geminiClient');
    expect(mod.isEdgeConfigured()).toBe(true);
    vi.resetModules();
    vi.stubEnv('VITE_AEGIS_EDGE_BEARER', '');
    const empty = await import('../geminiClient');
    expect(empty.isEdgeConfigured()).toBe(false);
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

  describe('System Instruction Normalization', () => {
    it('normalizes string systemInstruction to Gemini Content object', async () => {
      const ai = getAI();
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'test',
        config: {
          systemInstruction: 'You are Aura AI.',
        },
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(String((mockFetch.mock.calls[0][1] as RequestInit).body));
      expect(body.systemInstruction).toEqual({
        role: 'user',
        parts: [{ text: 'You are Aura AI.' }],
      });
    });

    it('normalizes string systemInstruction in chat sessions', async () => {
      const ai = getAI();
      const chat = ai.chats.create({
        model: 'gemini-3.6-flash',
        config: {
          systemInstruction: 'You are Aura AI.',
        },
      });
      await chat.sendMessage('Hello doctor');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(String((mockFetch.mock.calls[0][1] as RequestInit).body));
      expect(body.systemInstruction).toEqual({
        role: 'user',
        parts: [{ text: 'You are Aura AI.' }],
      });
    });

    it('preserves pre-structured Content objects without mutation', async () => {
      const structuredSI = {
        role: 'user',
        parts: [{ text: 'Structured prompt' }],
      };
      const ai = getAI();
      await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: 'test',
        systemInstruction: structuredSI,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(String((mockFetch.mock.calls[0][1] as RequestInit).body));
      expect(body.systemInstruction).toEqual(structuredSI);
    });
  });


  describe('Abort and request metadata', () => {
    it('does not PoP-retry when the request is aborted', async () => {
      const abortErr = new DOMException('The operation was aborted.', 'AbortError');
      mockFetch.mockRejectedValueOnce(abortErr);

      const ai = getAI();
      await expect(
        ai.models.generateContent({ model: 'gemini-3.6-flash', contents: 'hello' }),
      ).rejects.toMatchObject({ name: 'EdgeGeminiError', status: 408 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const headers = (mockFetch.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers['X-Request-Id']).toBeTruthy();
    });

    it('does not treat clinical "location" prose as a routing error', async () => {
      const { isLocationRoutingError } = await import('../geminiClient');
      expect(
        isLocationRoutingError({ message: 'Pain location is the lower abdomen' }),
      ).toBe(false);
      expect(
        isLocationRoutingError({ message: 'User location is not supported for the API use.' }),
      ).toBe(true);
    });
  });

  describe('Anycast Location Routing and Network Failover Resilience', () => {
    it('seamlessly retries on primary edge URL when edge returns location error', async () => {
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify({
          error: 'User location is not supported for the API use.',
          status: 400,
        }), { status: 400 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'PoP retry success' }] } }],
        }), { status: 200 }));

      const ai = getAI();
      const result = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: 'hello nephrologist',
      }) as { text: string };

      expect(result.text).toBe('PoP retry success');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toBe('https://api.aegishealthai.co.in/api/ai/generate');
      expect(mockFetch.mock.calls[1][0]).toBe('https://api.aegishealthai.co.in/api/ai/generate');
    });

    it('retries on primary edge URL on network failure (Failed to fetch)', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Network failover success' }] } }],
        }), { status: 200 }));

      const ai = getAI();
      const result = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: 'hello coach',
      }) as { text: string };

      expect(result.text).toBe('Network failover success');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toBe('https://api.aegishealthai.co.in/api/ai/generate');
      expect(mockFetch.mock.calls[1][0]).toBe('https://api.aegishealthai.co.in/api/ai/generate');
    });

    it('fails if network or location errors persist after all 3 retries', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const ai = getAI();
      await expect(ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: 'hello nephrologist',
      })).rejects.toThrow(/Failed to fetch/);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('JWT Token Provider & Auth Isolation', () => {
    it('prefers Firebase ID token over shared edge bearer', async () => {
      const mod = await import('../geminiClient');
      mod.setAuthTokenProvider(async () => 'user-firebase-id-token-xyz');

      const ai = mod.getAI();
      await ai.models.generateContent({ contents: 'test message' });

      expect(mockFetch).toHaveBeenCalled();
      const lastCallInit = mockFetch.mock.calls[0][1];
      expect(lastCallInit.headers.Authorization).toBe('Bearer user-firebase-id-token-xyz');
      expect(lastCallInit.headers['X-Aegis-Shared-Bearer']).toBeUndefined();

      mod.setAuthTokenProvider(null);
    });

    it('falls back to shared edge bearer when user ID token is absent', async () => {
      vi.resetModules();
      vi.stubEnv('VITE_AEGIS_EDGE_BEARER', 'test-edge-bearer');
      vi.stubEnv('VITE_EDGE_API_URL', 'https://api.aegishealthai.co.in');
      mockFetch.mockClear();
      const mod = await import('../geminiClient');
      mod.__setGeminiFetchForTests(mockFetch as unknown as typeof fetch);
      mod.setAuthTokenProvider(null);

      const ai = mod.getAI();
      await ai.models.generateContent({ contents: 'test message' });

      expect(mockFetch).toHaveBeenCalled();
      const lastCallInit = mockFetch.mock.calls[0][1];
      expect(lastCallInit.headers.Authorization).toBe('Bearer test-edge-bearer');
    });
  });

  describe('Turnstile Token Provider', () => {
    it('attaches X-Turnstile-Token header when Turnstile token is available', async () => {
      const mod = await import('../geminiClient');
      mod.setTurnstileTokenProvider(async () => 'turnstile-response-token-123');

      const ai = mod.getAI();
      await ai.models.generateContent({ contents: 'test turnstile protected message' });

      expect(mockFetch).toHaveBeenCalled();
      const lastCallInit = mockFetch.mock.calls[0][1];
      expect(lastCallInit.headers['X-Turnstile-Token']).toBe('turnstile-response-token-123');

      mod.setTurnstileTokenProvider(null);
    });

    it('omits X-Turnstile-Token header when Turnstile token is absent', async () => {
      const mod = await import('../geminiClient');
      mod.setTurnstileTokenProvider(null);

      const ai = mod.getAI();
      await ai.models.generateContent({ contents: 'test unverified message' });

      expect(mockFetch).toHaveBeenCalled();
      const lastCallInit = mockFetch.mock.calls[0][1];
      expect(lastCallInit.headers['X-Turnstile-Token']).toBeUndefined();
    });
  });
});
