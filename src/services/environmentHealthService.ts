import { getAuthToken } from '../lib/authTokenProvider';
import { getEdgeApiBaseUrl, isAbortError } from '../lib/geminiClient';

export interface AirQualityContext {
  aqi: number | null;
  category: string;
  dominantPollutant: string;
  pm25: number | null;
  pm10: number | null;
  healthAdvice: string;
  provider: string;
  fetchedAt: string;
  request_id?: string;
}

export interface AirQualityRequestOptions {
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  baseUrlOverride?: string;
}

/**
 * Queries live local Air Quality & PM2.5/PM10 exposure through the Edge Worker
 * so respiratory/inflammatory markers (Eosinophils, IgE, hs-CRP) include local environmental context.
 */
export async function fetchLocalAirQuality(
  latitude: number,
  longitude: number,
  options: AirQualityRequestOptions = {},
): Promise<AirQualityContext> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude coordinate');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude coordinate');
  }
  if (options.signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  const token = (await getAuthToken())?.trim() || '';
  if (!token) {
    throw new Error('Authentication required for live environmental AQI lookup.');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrlOverride || getEdgeApiBaseUrl()).replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 12_000);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const res = await fetchImpl(`${baseUrl}/api/environment/air-quality`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let msg = `Air quality lookup failed (HTTP ${res.status})`;
      try {
        const err = (await res.json()) as { message?: unknown };
        if (typeof err.message === 'string' && err.message) msg = err.message;
      } catch {
        // Ignore parse error
      }
      throw new Error(msg);
    }

    return (await res.json()) as AirQualityContext;
  } catch (err) {
    if (options.signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    if (isAbortError(err)) {
      throw new Error('Air quality lookup timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
    options.signal?.removeEventListener('abort', onAbort);
  }
}
