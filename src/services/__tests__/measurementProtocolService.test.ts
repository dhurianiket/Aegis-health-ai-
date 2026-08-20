import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendMeasurementProtocolEvent,
  getOrCreateClientId,
  GA_MEASUREMENT_ID,
  GA_API_SECRET,
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

  it('2. Dispatches Measurement Protocol payload via HTTP POST to GA4 endpoint', async () => {
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
    expect(url).toContain(`api_secret=${GA_API_SECRET}`);
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.user_id).toBe('dhurianiket@gmail.com');
    expect(body.events[0].name).toBe('abdm_care_context_linked');
  });

  it('3. Handles network failures gracefully without throwing unhandled exceptions', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const success = await sendMeasurementProtocolEvent({
      events: [{ name: 'ping_test' }],
    });

    expect(success).toBe(false);
  });
});
