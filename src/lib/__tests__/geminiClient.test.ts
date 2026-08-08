import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We mock @google/genai module before importing getAI
const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function (this: any) {
      this.models = {
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      };
    }),
  };
});

describe('geminiClient Resilience Interceptor & Model Normalization', () => {
  let getAI: () => any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key-123');
    vi.stubEnv('VITE_CLOUDFLARE_AI_GATEWAY_URL', 'https://gateway.ai.cloudflare.com/v1/test');

    const mod = await import('../geminiClient');
    getAI = mod.getAI;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws error when VITE_GEMINI_API_KEY is not set', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const mod = await import('../geminiClient');
    expect(() => mod.getAI()).toThrow('VITE_GEMINI_API_KEY is not set');
  });

  describe('Model Normalization', () => {
    it.each([
      ['gemini-3-flash-preview', 'gemini-3.6-flash'],
      ['gemini-3.5-flash', 'gemini-3.6-flash'],
      ['gemini-2.0-flash', 'gemini-3.6-flash'],
      ['gemini-1.5-flash', 'gemini-3.6-flash'],
      ['gemini-1.5-pro', 'gemini-3.1-pro-preview'],
      ['gemini-2.5-flash', 'gemini-2.5-flash'],
      ['gemini-3.6-flash', 'gemini-3.6-flash'],
    ])('maps model "%s" to "%s" for generateContent', async (inputModel, expectedModel) => {
      const ai = getAI();
      mockGenerateContent.mockResolvedValueOnce({ text: 'Success response' });

      const res = await ai.models.generateContent({ model: inputModel, contents: 'hello' });

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: expectedModel,
        contents: 'hello',
      });
      expect(res).toEqual({ text: 'Success response' });
    });

    it.each([
      ['gemini-3-flash-preview', 'gemini-3.6-flash'],
      ['gemini-3.5-flash', 'gemini-3.6-flash'],
      ['gemini-2.0-flash', 'gemini-3.6-flash'],
      ['gemini-1.5-flash', 'gemini-3.6-flash'],
      ['gemini-1.5-pro', 'gemini-3.1-pro-preview'],
      ['gemini-2.5-flash', 'gemini-2.5-flash'],
    ])('maps model "%s" to "%s" for generateContentStream', async (inputModel, expectedModel) => {
      const ai = getAI();
      mockGenerateContentStream.mockResolvedValueOnce({ stream: 'chunk stream' });

      const res = await ai.models.generateContentStream({ model: inputModel, contents: 'stream test' });

      expect(mockGenerateContentStream).toHaveBeenCalledTimes(1);
      expect(mockGenerateContentStream).toHaveBeenCalledWith({
        model: expectedModel,
        contents: 'stream test',
      });
      expect(res).toEqual({ stream: 'chunk stream' });
    });
  });

  describe('503 Error Resilience & Retries for generateContent', () => {
    it('retries with "gemini-3.6-flash" when primary model fails with 503 status code', async () => {
      const ai = getAI();
      // First call (gemini-3.1-pro-preview) fails with status 503
      mockGenerateContent.mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' });
      // Second call (fallback gemini-3.6-flash) succeeds
      mockGenerateContent.mockResolvedValueOnce({ text: 'Fallback success' });

      const result = await ai.models.generateContent({ model: 'gemini-1.5-pro', contents: 'test prompt' });

      expect(result).toEqual({ text: 'Fallback success' });
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(mockGenerateContent).toHaveBeenNthCalledWith(1, { model: 'gemini-3.1-pro-preview', contents: 'test prompt' });
      expect(mockGenerateContent).toHaveBeenNthCalledWith(2, { model: 'gemini-3.6-flash', contents: 'test prompt' });
    });

    it('retries with secondary fallback "gemini-2.5-flash" when primary AND primary-fallback both fail with 503', async () => {
      const ai = getAI();
      // 1st call (gemini-3.1-pro-preview) fails with 503
      mockGenerateContent.mockRejectedValueOnce({ status: 503, message: 'Overloaded' });
      // 2nd call (gemini-3.6-flash) fails with UNAVAILABLE status string
      mockGenerateContent.mockRejectedValueOnce({ status: 'UNAVAILABLE', message: 'High demand' });
      // 3rd call (gemini-2.5-flash) succeeds
      mockGenerateContent.mockResolvedValueOnce({ text: 'Secondary fallback success' });

      const result = await ai.models.generateContent({ model: 'gemini-1.5-pro', contents: 'test prompt' });

      expect(result).toEqual({ text: 'Secondary fallback success' });
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      expect(mockGenerateContent).toHaveBeenNthCalledWith(1, { model: 'gemini-3.1-pro-preview', contents: 'test prompt' });
      expect(mockGenerateContent).toHaveBeenNthCalledWith(2, { model: 'gemini-3.6-flash', contents: 'test prompt' });
      expect(mockGenerateContent).toHaveBeenNthCalledWith(3, { model: 'gemini-2.5-flash', contents: 'test prompt' });
    });

    it('retries directly with secondary fallback "gemini-2.5-flash" when model mapped to "gemini-3.6-flash" fails with 503', async () => {
      const ai = getAI();
      // gemini-3-flash-preview maps to gemini-3.6-flash
      mockGenerateContent.mockRejectedValueOnce({ message: 'The model is currently experiencing high demand (503)' });
      mockGenerateContent.mockResolvedValueOnce({ text: 'Direct secondary fallback success' });

      const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'test' });

      expect(result).toEqual({ text: 'Direct secondary fallback success' });
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(mockGenerateContent).toHaveBeenNthCalledWith(1, { model: 'gemini-3.6-flash', contents: 'test' });
      expect(mockGenerateContent).toHaveBeenNthCalledWith(2, { model: 'gemini-2.5-flash', contents: 'test' });
    });

    it('re-throws error if all retries fail with 503', async () => {
      const ai = getAI();
      const err503 = { status: 503, message: 'Persistent 503' };
      mockGenerateContent.mockRejectedValue(err503);

      await expect(ai.models.generateContent({ model: 'gemini-1.5-pro', contents: 'test' }))
        .rejects.toEqual(err503);

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('does NOT retry and throws immediately for non-503 errors (e.g. 400 Bad Request)', async () => {
      const ai = getAI();
      const err400 = { status: 400, message: 'Invalid argument provided' };
      mockGenerateContent.mockRejectedValueOnce(err400);

      await expect(ai.models.generateContent({ model: 'gemini-1.5-pro', contents: 'test' }))
        .rejects.toEqual(err400);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['status code 503', { status: 503 }],
      ['code 503', { code: 503 }],
      ['status UNAVAILABLE', { status: 'UNAVAILABLE' }],
      ['message containing 503', { message: 'HTTP 503 Error' }],
      ['message containing high demand', { message: 'Server under high demand, try later' }],
      ['message containing unavailable', { message: 'Service is unavailable at this moment' }],
    ])('detects 503/high-demand error variant: %s', async (_, errorObj) => {
      const ai = getAI();
      mockGenerateContent.mockRejectedValueOnce(errorObj);
      mockGenerateContent.mockResolvedValueOnce({ text: 'Recovered' });

      const res = await ai.models.generateContent({ model: 'gemini-1.5-pro', contents: 'test' });
      expect(res).toEqual({ text: 'Recovered' });
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('503 Error Resilience & Retries for generateContentStream', () => {
    it('retries streaming with fallbacks on 503 error', async () => {
      const ai = getAI();
      mockGenerateContentStream.mockRejectedValueOnce({ status: 503, message: 'Stream 503' });
      mockGenerateContentStream.mockResolvedValueOnce({ stream: 'Fallback stream' });

      const res = await ai.models.generateContentStream({ model: 'gemini-1.5-pro', contents: 'stream prompt' });

      expect(res).toEqual({ stream: 'Fallback stream' });
      expect(mockGenerateContentStream).toHaveBeenCalledTimes(2);
      expect(mockGenerateContentStream).toHaveBeenNthCalledWith(1, { model: 'gemini-3.1-pro-preview', contents: 'stream prompt' });
      expect(mockGenerateContentStream).toHaveBeenNthCalledWith(2, { model: 'gemini-3.6-flash', contents: 'stream prompt' });
    });

    it('does NOT retry streaming on non-503 error', async () => {
      const ai = getAI();
      const err401 = { status: 401, message: 'Unauthorized' };
      mockGenerateContentStream.mockRejectedValueOnce(err401);

      await expect(ai.models.generateContentStream({ model: 'gemini-1.5-pro', contents: 'test' }))
        .rejects.toEqual(err401);

      expect(mockGenerateContentStream).toHaveBeenCalledTimes(1);
    });
  });
});
