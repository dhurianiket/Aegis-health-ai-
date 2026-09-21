/**
 * GA4 Measurement Protocol Service
 * Server-side MP when GA_API_SECRET is available; otherwise browser gtag fallback.
 * Stream Name: aegis-web
 * Stream ID: 14925967845
 */

import { trackEvent, GA_MEASUREMENT_ID as ANALYTICS_MEASUREMENT_ID } from '../utils/analytics';

export const GA_MEASUREMENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GA_MEASUREMENT_ID) ||
  ANALYTICS_MEASUREMENT_ID ||
  'G-KKGF16H7CY';

/**
 * Measurement Protocol API secret — server/runtime only.
 * Never read from import.meta.env / VITE_* (those ship in the client bundle).
 */
export function getGaApiSecret(): string {
  if (typeof process !== 'undefined' && process.env?.GA_API_SECRET) {
    return process.env.GA_API_SECRET;
  }
  return '';
}

/** @deprecated Use getGaApiSecret(); kept empty so client bundles never embed an MP secret. */
export const GA_API_SECRET = '';

export interface MeasurementProtocolEvent {
  name: string;
  params?: Record<string, unknown>;
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
    clientId = 'client_' + crypto.randomUUID() + '_' + Date.now();
    localStorage.setItem('aegis_ga_client_id', clientId);
  }
  return clientId;
}

/**
 * Dispatches event payloads securely to GA4 endpoint or falls back to client-side gtag
 */
export async function sendMeasurementProtocolEvent(options: SendTelemetryOptions): Promise<boolean> {
  const secret = getGaApiSecret();

  // 1. If API secret is present (backend / server environment), dispatch via HTTP POST
  if (secret) {
    const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${secret}`;

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
      console.warn('[MeasurementProtocol] Backend telemetry error:', err);
      return false;
    }
  }

  // 2. Client-side fallback: dispatch through browser gtag queue without exposing secret in JS bundle
  try {
    options.events.forEach((evt) => {
      trackEvent(evt.name, 'MeasurementProtocol', evt.name, undefined, evt.params);
    });
    return true;
  } catch (err) {
    console.warn('[MeasurementProtocol] Client fallback dispatch error:', err);
    return false;
  }
}
