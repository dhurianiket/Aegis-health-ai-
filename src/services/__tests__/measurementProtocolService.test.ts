import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendMeasurementProtocolEvent,
  getOrCreateClientId,
  GA_MEASUREMENT_ID,
} from '../measurementProtocolService';

describe('GA4 Measurement Protocol Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. Generates and persists a unique client ID', () => {
    const id1 = getOrCreateClientId();
    expect(id1).toBeDefined();
    expect(id1.startsWith('client_')).toBe(true);

    const id2 = getOrCreateClientId();
    expect(id2).toBe(id1);
  });

  it('2. Dispatches Measurement Protocol payload when API secret is configured', async () => {
    process.env.GA_API_SECRET = 'test_secret_123';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });
    global.fetch = mockFetch;

    const success = await sendMeasurementProtocolEvent({
      userId: 'dhurianiket@gmail.com',
      events: [
        {
          name: 'abdm_care_context_linked',
          params: { care_context_id: 'CC-9012' },
        },
      ],
    });

    expect(success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(`measurement_id=${GA_MEASUREMENT_ID}`);
    expect(url).toContain('api_secret=test_secret_123');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.user_id).toBe('dhurianiket@gmail.com');
    expect(body.events[0].name).toBe('abdm_care_context_linked');

    delete process.env.GA_API_SECRET;
  });

  it('3. Uses client-side analytics fallback safely when no API secret is present', async () => {
    delete process.env.GA_API_SECRET;

    const success = await sendMeasurementProtocolEvent({
      events: [{ name: 'frontend_event' }],
    });

    expect(success).toBe(true);
  });
});
