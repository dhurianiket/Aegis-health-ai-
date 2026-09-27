import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRecaptchaToken, __resetRecaptchaStateForTests } from '../recaptcha';

describe('getRecaptchaToken', () => {
  beforeEach(() => {
    __resetRecaptchaStateForTests();
  });
  afterEach(() => {
    delete (window as any).grecaptcha;
    vi.restoreAllMocks();
  });

  it('returns the token from key-based execute when api.js was loaded with ?render=<key>', async () => {
    const execute = vi.fn().mockResolvedValue('key-token');
    const render = vi.fn();
    (window as any).grecaptcha = { ready: (cb: () => void) => cb(), execute, render };

    await expect(getRecaptchaToken('upload')).resolves.toBe('key-token');
    expect(render).not.toHaveBeenCalled();
  });

  it('falls back to an invisible widget when api.js is in explicit mode (Firebase App Check loaded it first)', async () => {
    const execute = vi.fn(async (idOrKey: unknown) => {
      if (typeof idOrKey === 'string') {
        throw new Error('Invalid site key or not loaded in api.js: synthetic');
      }
      return 'widget-token';
    });
    const render = vi.fn().mockReturnValue(1);
    (window as any).grecaptcha = { ready: (cb: () => void) => cb(), execute, render };

    await expect(getRecaptchaToken('upload')).resolves.toBe('widget-token');
    expect(render).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenLastCalledWith(1, { action: 'upload' });

    // Second call reuses the same widget instead of rendering again.
    await expect(getRecaptchaToken('upload')).resolves.toBe('widget-token');
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('returns null when both execute paths fail', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const execute = vi.fn().mockRejectedValue(new Error('boom'));
    const render = vi.fn().mockReturnValue(0);
    (window as any).grecaptcha = { ready: (cb: () => void) => cb(), execute, render };

    await expect(getRecaptchaToken('upload')).resolves.toBeNull();
  });
});
