/**
 * GA4 Measurement Protocol Service
 * Enables sending server-side, background, and offline telemetry events to Google Analytics 4
 * Stream Name: aegis-web
 * Stream ID: 14925967845
 * Measurement ID: G-KKGF16H7CY
 */

export const GA_MEASUREMENT_ID = 'G-KKGF16H7CY';
export const GA_API_SECRET = '7_vWiTUqR8yMwi7YZ-NglA';

export interface MeasurementProtocolEvent {
  name: string;
  params?: Record<string, any>;
}

export interface SendTelemetryOptions {
  clientId?: string;
  userId?: string;
  events: MeasurementProtocolEvent[];
}

/**
 * Gets or generates a persistent Client ID for Measurement Protocol telemetry
 */
export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'server_session_node';
  let clientId = localStorage.getItem('aegis_ga_client_id');
  if (!clientId) {
    clientId = 'client_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    localStorage.setItem('aegis_ga_client_id', clientId);
  }
  return clientId;
}

/**
 * Dispatches server-side / background event payloads to GA4 Measurement Protocol endpoint
 */
export async function sendMeasurementProtocolEvent(options: SendTelemetryOptions): Promise<boolean> {
  const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

  const payload = {
    client_id: options.clientId || getOrCreateClientId(),
    ...(options.userId ? { user_id: options.userId } : {}),
    events: options.events.map((e) => ({
      name: e.name,
      params: {
        engagement_time_msec: '100',
        ...e.params,
      },
    })),
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok || response.status === 204;
  } catch (err) {
    console.warn('[MeasurementProtocol] Failed to send telemetry hit:', err);
    return false;
  }
}
