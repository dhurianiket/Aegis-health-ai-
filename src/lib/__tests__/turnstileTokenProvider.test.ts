import { describe, it, expect, beforeEach } from 'vitest';
import {
  setTurnstileTokenProvider,
  setCachedTurnstileToken,
  hasTurnstileTokenProvider,
  getTurnstileToken,
} from '../turnstileTokenProvider';

describe('turnstileTokenProvider', () => {
  beforeEach(() => {
    setTurnstileTokenProvider(null);
    setCachedTurnstileToken(null);
  });

  it('returns null when no provider or cached token is set', async () => {
    expect(hasTurnstileTokenProvider()).toBe(false);
    const token = await getTurnstileToken();
    expect(token).toBeNull();
  });

  it('returns cached token when no provider is set', async () => {
    setCachedTurnstileToken('cached-test-token');
    const token = await getTurnstileToken();
    expect(token).toBe('cached-test-token');
  });

  it('prioritizes provider token over cached token', async () => {
    setCachedTurnstileToken('cached-test-token');
    setTurnstileTokenProvider(async () => 'provider-test-token');
    expect(hasTurnstileTokenProvider()).toBe(true);

    const token = await getTurnstileToken();
    expect(token).toBe('provider-test-token');
  });

  it('falls back to cached token if provider throws', async () => {
    setCachedTurnstileToken('cached-fallback-token');
    setTurnstileTokenProvider(async () => {
      throw new Error('Provider exploded');
    });

    const token = await getTurnstileToken();
    expect(token).toBe('cached-fallback-token');
  });
});
