import { getAuthToken } from '../lib/authTokenProvider';
import { getEdgeApiBaseUrl, isAbortError } from '../lib/geminiClient';
import type { FhirBundle } from '../types/fhir';

export interface CloudFhirSyncResult {
  status: string;
  region: string;
  datasetId: string;
  fhirStoreId: string;
  patientId: string;
  syncedCount: number;
  resourceTypes: Record<string, number>;
  syncedAt: string;
  request_id?: string;
}

export interface CloudFhirStatus {
  configured: boolean;
  region: string;
  datasetId: string;
  fhirStoreId: string;
  patientId: string;
  synced: boolean;
  counts: {
    observations: number;
    diagnosticReports: number;
    documentReferences: number;
  };
  request_id?: string;
}

export interface CloudFhirDeleteResult {
  status: string;
  region: string;
  datasetId: string;
  fhirStoreId: string;
  patientId: string;
  deletedCount: number;
  request_id?: string;
}

export interface CloudFhirRequestOptions {
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  baseUrlOverride?: string;
}

function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('The operation was aborted.', 'AbortError');
  }
  const err = new Error('The operation was aborted.');
  err.name = 'AbortError';
  return err;
}

async function executeCloudFhirRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  bodyObj: Record<string, unknown> | undefined,
  options: CloudFhirRequestOptions = {},
): Promise<T> {
  if (options.signal?.aborted) {
    throw createAbortError();
  }

  const token = (await getAuthToken())?.trim() || '';
  if (!token) {
    throw new Error('Sign in to sync FHIR R4 records to Google Cloud Healthcare (Mumbai).');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrlOverride || getEdgeApiBaseUrl()).replace(/\/$/, '');
  const requestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `fhir-${Date.now()}`;

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 20_000);
  const onCallerAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(bodyObj ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        'X-Request-Id': requestId,
      },
      ...(bodyObj ? { body: JSON.stringify(bodyObj) } : {}),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `Cloud Healthcare FHIR request failed (HTTP ${response.status})`;
      try {
        const errBody = (await response.json()) as { message?: unknown; error?: unknown };
        if (typeof errBody.message === 'string' && errBody.message) {
          message = errBody.message;
        } else if (typeof errBody.error === 'string' && errBody.error) {
          message = errBody.error;
        }
      } catch {
        // Ignore JSON parse failures on error responses.
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  } catch (err) {
    if (options.signal?.aborted) {
      throw createAbortError();
    }
    if (isAbortError(err)) {
      throw new Error('Cloud Healthcare FHIR request timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
    options.signal?.removeEventListener('abort', onCallerAbort);
  }
}

/**
 * Syncs an HL7 FHIR R4 Bundle to the Mumbai (`asia-south1`) Cloud Healthcare API FHIR store
 * through the tenant-scoped Cloudflare Edge Worker.
 */
export async function syncFhirBundleToCloud(
  bundle: FhirBundle,
  options?: CloudFhirRequestOptions,
): Promise<CloudFhirSyncResult> {
  return executeCloudFhirRequest<CloudFhirSyncResult>(
    '/api/fhir/sync',
    'POST',
    { bundle },
    options,
  );
}

/**
 * Checks whether the signed-in user currently has synced FHIR R4 resources in Cloud Healthcare.
 */
export async function getCloudFhirStatus(
  options?: CloudFhirRequestOptions,
): Promise<CloudFhirStatus> {
  return executeCloudFhirRequest<CloudFhirStatus>('/api/fhir/status', 'GET', undefined, options);
}

/**
 * Deletes all Cloud Healthcare FHIR R4 resources owned by the signed-in user (DPDP Act 2023 erasure).
 */
export async function deleteCloudFhirRecords(
  options?: CloudFhirRequestOptions,
): Promise<CloudFhirDeleteResult> {
  return executeCloudFhirRequest<CloudFhirDeleteResult>(
    '/api/fhir/records',
    'DELETE',
    undefined,
    options,
  );
}
