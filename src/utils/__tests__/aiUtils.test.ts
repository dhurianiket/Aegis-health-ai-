import { describe, it, expect } from 'vitest';
import { safeJsonParse, getFriendlyErrorMessage } from '../aiUtils';

describe('aiUtils: safeJsonParse', () => {
  it('parses clean valid JSON string', () => {
    const input = '{"status": "ok", "count": 42}';
    expect(safeJsonParse(input, null)).toEqual({ status: 'ok', count: 42 });
  });

  it('strips markdown code blocks', () => {
    const input = '```json\n{"summary": "test"}\n```';
    expect(safeJsonParse(input, null)).toEqual({ summary: 'test' });
  });

  it('extracts JSON when surrounded by conversational text', () => {
    const input = 'Here is the diagnosis result: {"isDiagnosis": false, "safeText": "healthy"} Hope this helps!';
    expect(safeJsonParse(input, null)).toEqual({ isDiagnosis: false, safeText: 'healthy' });
  });

  it('repairs truncated JSON objects', () => {
    const truncated = '{"condition": "Hypertension", "recommendation": "Monitor BP"';
    const parsed = safeJsonParse<{ condition?: string }>(truncated, {});
    expect(parsed.condition).toBe('Hypertension');
  });

  it('returns fallback value on completely invalid non-JSON string', () => {
    const fallback = { fallback: true };
    expect(safeJsonParse('Not JSON at all', fallback)).toEqual(fallback);
    expect(safeJsonParse(null, fallback)).toEqual(fallback);
    expect(safeJsonParse(undefined, fallback)).toEqual(fallback);
  });
});

describe('aiUtils: getFriendlyErrorMessage', () => {
  it('handles null or empty errors gracefully', () => {
    expect(getFriendlyErrorMessage(null)).toBe('An unexpected error occurred. Please try again in a moment.');
    expect(getFriendlyErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again in a moment.');
    expect(getFriendlyErrorMessage('')).toBe('An unexpected error occurred. Please try again in a moment.');
  });

  it('detects network or offline connection failures', () => {
    expect(getFriendlyErrorMessage(new TypeError('Failed to fetch'))).toContain('check your internet connection');
    expect(getFriendlyErrorMessage({ message: 'NetworkError when attempting to fetch resource.' })).toContain('check your internet connection');
    expect(getFriendlyErrorMessage({ message: 'net::ERR_INTERNET_DISCONNECTED' })).toContain('check your internet connection');
  });

  it('detects 429 quota exhaustion errors', () => {
    expect(getFriendlyErrorMessage({ status: 429, message: 'Resource has been exhausted' })).toContain('Rate limit exceeded');
    expect(getFriendlyErrorMessage({ message: 'Quota exceeded for quota metric' })).toContain('Rate limit exceeded');
  });

  it('detects edge proxy authentication and security verification errors (401, 403)', () => {
    expect(getFriendlyErrorMessage({ status: 401, message: 'Unauthorized' })).toContain('edge auth or security verification required');
    expect(getFriendlyErrorMessage({ status: 403, message: 'Forbidden' })).toContain('edge auth or security verification required');
    expect(getFriendlyErrorMessage({ message: 'VITE_AEGIS_EDGE_BEARER is not set' })).toContain('edge auth or security verification required');
  });

  it('detects edge service unavailable or gateway errors (502, 503, 504)', () => {
    expect(getFriendlyErrorMessage({ status: 503, message: 'Service Unavailable' })).toContain('high traffic or maintenance');
    expect(getFriendlyErrorMessage({ status: 502, message: 'Bad Gateway' })).toContain('high traffic or maintenance');
    expect(getFriendlyErrorMessage({ message: 'The model is overloaded' })).toContain('high traffic or maintenance');
  });

  it('unpacks nested JSON error messages recursively', () => {
    const nested = JSON.stringify({
      error: {
        message: JSON.stringify({
          error: {
            message: 'Resource exhausted (rate limit 429)',
          },
        }),
      },
    });
    expect(getFriendlyErrorMessage({ message: nested })).toContain('Rate limit exceeded');
  });

  it('falls back to default empathetic message for unexpected errors', () => {
    expect(getFriendlyErrorMessage(new Error('Internal unexpected logic exception'))).toBe(
      'I am currently having trouble connecting to my clinical brain. Please try again in a moment.',
    );
  });
});
