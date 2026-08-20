/**
 * GA4 Measurement Protocol Service
 * Securely handles server-side and background telemetry events for Google Analytics 4
 * Stream Name: aegis-web
 * Stream ID: 14925967845
 * Measurement ID: G-KKGF16H7CY
 */

import { trackEvent } from '../utils/analytics';

export const GA_MEASUREMENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GA_MEASUREMENT_ID) ||
  'G-KKGF16H7CY';

export const GA_API_SECRET =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GA_API_SECRET) ||
  '';

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
 * Dispatches event payloads securely to GA4 endpoint or falls back to client-side gtag
 */
export async function sendMeasurementProtocolEvent(options: SendTelemetryOptions): Promise<boolean> {
  const secret = GA_API_SECRET || (typeof process !== 'undefined' ? process.env?.GA_API_SECRET : '');

  // 1. If API secret is present (e.g. backend / server environment), dispatch via HTTP POST
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
