import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTurnstile } from '../useTurnstile';
import { getTurnstileToken } from '../../lib/turnstileTokenProvider';

describe('useTurnstile hook', () => {
  let mockRender: ReturnType<typeof vi.fn>;
  let mockReset: ReturnType<typeof vi.fn>;
  let mockRemove: ReturnType<typeof vi.fn>;
  let mockGetResponse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRender = vi.fn((_el: any, params: any) => {
      // Simulate successful immediate callback in tests if needed
      return 'mock-widget-id-123';
    });
    mockReset = vi.fn();
    mockRemove = vi.fn();
    mockGetResponse = vi.fn(() => 'mock-token-abc');

    window.turnstile = {
      render: mockRender as any,
      reset: mockReset as any,
      remove: mockRemove as any,
      getResponse: mockGetResponse as any,
    };
  });

  afterEach(() => {
    delete (window as any).turnstile;
    vi.restoreAllMocks();
  });

  it('initializes with loaded state when window.turnstile is present', () => {
    const { result } = renderHook(() => useTurnstile({ action: 'test_action' }));

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.token).toBeNull();
    expect(result.current.isVerified).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('renders widget when container element is attached', () => {
    const { result } = renderHook(() => useTurnstile({ action: 'ai_generate' }));
    const dummyDiv = document.createElement('div');

    act(() => {
      result.current.renderWidget(dummyDiv);
    });

    expect(mockRender).toHaveBeenCalledWith(dummyDiv, expect.objectContaining({
      action: 'ai_generate',
      sitekey: expect.any(String),
    }));
  });

  it('handles verification callback and updates global provider', async () => {
    let capturedCallback: (token: string) => void = () => {};

    mockRender.mockImplementation((_el: any, params: any) => {
      capturedCallback = params.callback;
      return 'widget-456';
    });

    const { result } = renderHook(() => useTurnstile({ action: 'ai_generate' }));
    const dummyDiv = document.createElement('div');

    act(() => {
      result.current.renderWidget(dummyDiv);
    });

    // Simulate callback
    act(() => {
      capturedCallback('token-xyz-789');
    });

    expect(result.current.token).toBe('token-xyz-789');
    expect(result.current.isVerified).toBe(true);

    // Global provider should now return this token
    const token = await getTurnstileToken();
    expect(token).toBe('token-xyz-789');
  });

  it('resets widget and clears token on resetWidget()', () => {
    let capturedCallback: (token: string) => void = () => {};
    mockRender.mockImplementation((_el: any, params: any) => {
      capturedCallback = params.callback;
      return 'widget-789';
    });

    const { result } = renderHook(() => useTurnstile({ action: 'ai_generate' }));
    const dummyDiv = document.createElement('div');

    act(() => {
      result.current.renderWidget(dummyDiv);
    });

    act(() => {
      capturedCallback('token-to-be-reset');
    });
    expect(result.current.token).toBe('token-to-be-reset');

    act(() => {
      result.current.resetWidget();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.isVerified).toBe(false);
    expect(mockReset).toHaveBeenCalledWith('widget-789');
  });
});
