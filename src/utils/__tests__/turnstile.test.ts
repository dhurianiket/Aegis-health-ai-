import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTurnstileToken, __resetTurnstileStateForTests } from '../turnstile';
import { getTurnstileToken as getCachedToken, setCachedTurnstileToken } from '../../lib/turnstileTokenProvider';

type Opts = Record<string, any>;

function installMockTurnstile() {
  const widgets = new Map<string, { opts: Opts; el: HTMLElement }>();
  let n = 0;
  const api = {
    render: vi.fn((el: HTMLElement, opts: Opts) => {
      const id = `w${++n}`;
      const iframe = document.createElement('iframe');
      el.appendChild(iframe);
      widgets.set(id, { opts, el });
      return id;
    }),
    remove: vi.fn((id: string) => {
      const w = widgets.get(id);
      w?.el.replaceChildren();
      widgets.delete(id);
    }),
    reset: vi.fn(),
    getResponse: vi.fn(() => undefined),
    last: () => [...widgets.values()].pop()!,
  };
  (window as any).turnstile = api;
  return api;
}

describe('utils/turnstile getTurnstileToken', () => {
  beforeEach(() => {
    __resetTurnstileStateForTests();
    setCachedTurnstileToken(null);
  });
  afterEach(() => {
    delete (window as any).turnstile;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders interaction-only in a hidden container and removes it after success', async () => {
    const ts = installMockTurnstile();
    const p = getTurnstileToken('ai_generate');
    await vi.waitFor(() => expect(ts.render).toHaveBeenCalledTimes(1));

    const { opts } = ts.last();
    expect(opts.appearance).toBe('interaction-only');
    const container = document.getElementById('aegis-turnstile-wrapper')!;
    expect(container.style.display).toBe('none');

    opts.callback('synthetic-token-1');
    await expect(p).resolves.toBe('synthetic-token-1');
    expect(ts.remove).toHaveBeenCalledWith('w1');
    expect(document.getElementById('aegis-turnstile-wrapper')).toBeNull();
    // Token still available to the edge client (X-Turnstile-Token header).
    await expect(getCachedToken()).resolves.toBe('synthetic-token-1');
  });

  it('shows the container only when interaction is required', async () => {
    const ts = installMockTurnstile();
    const p = getTurnstileToken();
    await vi.waitFor(() => expect(ts.render).toHaveBeenCalled());
    const { opts } = ts.last();
    opts['before-interactive-callback']();
    expect(document.getElementById('aegis-turnstile-wrapper')!.style.display).toBe('block');
    opts.callback('synthetic-token-2');
    await expect(p).resolves.toBe('synthetic-token-2');
    expect(document.getElementById('aegis-turnstile-wrapper')).toBeNull();
  });

  it('tears down on error/expiry and renders a fresh widget on the next call', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ts = installMockTurnstile();
    const p1 = getTurnstileToken();
    await vi.waitFor(() => expect(ts.render).toHaveBeenCalledTimes(1));
    ts.last().opts['error-callback']('300030');
    await expect(p1).resolves.toBeNull();
    expect(document.getElementById('aegis-turnstile-wrapper')).toBeNull();

    const p2 = getTurnstileToken();
    await vi.waitFor(() => expect(ts.render).toHaveBeenCalledTimes(2));
    ts.last().opts['expired-callback']();
    await expect(p2).resolves.toBeNull();

    const p3 = getTurnstileToken();
    await vi.waitFor(() => expect(ts.render).toHaveBeenCalledTimes(3));
    ts.last().opts.callback('synthetic-token-3');
    await expect(p3).resolves.toBe('synthetic-token-3');
    expect(ts.reset).not.toHaveBeenCalled();
  });

  it('shares one in-flight challenge between concurrent callers', async () => {
    const ts = installMockTurnstile();
    const a = getTurnstileToken();
    const b = getTurnstileToken();
    await vi.waitFor(() => expect(ts.render).toHaveBeenCalledTimes(1));
    ts.last().opts.callback('synthetic-token-4');
    await expect(Promise.all([a, b])).resolves.toEqual(['synthetic-token-4', 'synthetic-token-4']);
  });

  it('times out non-interactive challenges and cleans up', async () => {
    vi.useFakeTimers();
    const ts = installMockTurnstile();
    const p = getTurnstileToken();
    await vi.waitFor(() => expect(ts.render).toHaveBeenCalled());
    await vi.advanceTimersByTimeAsync(10001);
    await expect(p).resolves.toBeNull();
    expect(document.getElementById('aegis-turnstile-wrapper')).toBeNull();
  });
});
