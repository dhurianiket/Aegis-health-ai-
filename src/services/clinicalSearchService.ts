import { getAuthToken } from '../lib/authTokenProvider';
import { getEdgeApiBaseUrl, isAbortError } from '../lib/geminiClient';

export interface ClinicalSearchResult {
  id: string;
  title: string;
  uri: string;
  snippet: string;
  relevanceScore?: number;
}

export interface ClinicalSearchReference {
  title: string;
  document: string;
}

export interface ClinicalSearchResponse {
  query: string;
  engine: string;
  source: string;
  totalSize: number;
  summary: string;
  references: ClinicalSearchReference[];
  results: ClinicalSearchResult[];
  request_id?: string;
}

export interface ClinicalSearchOptions {
  pageSize?: number;
  includeSummary?: boolean;
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

/**
 * Queries Vertex AI Search (`aegis-clinical-search`) through the authenticated Cloudflare Edge Worker.
 */
export async function searchClinicalProtocols(
  query: string,
  options: ClinicalSearchOptions = {},
): Promise<ClinicalSearchResponse> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    throw new Error('Clinical search query must not be empty.');
  }

  if (options.signal?.aborted) {
    throw createAbortError();
  }

  const token = (await getAuthToken())?.trim() || '';
  if (!token) {
    throw new Error('Authentication required for live clinical protocol search.');
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = (options.baseUrlOverride || getEdgeApiBaseUrl()).replace(/\/$/, '');
  const pageSize =
    typeof options.pageSize === 'number' && Number.isFinite(options.pageSize)
      ? Math.max(1, Math.min(10, Math.floor(options.pageSize)))
      : 5;
  const includeSummary = options.includeSummary !== false;
  const requestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `clinical-${Date.now()}`;

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), 15_000);
  const onCallerAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    const response = await fetchImpl(`${baseUrl}/api/ai/clinical-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify({
        query: trimmedQuery,
        pageSize,
        includeSummary,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `Clinical search failed (HTTP ${response.status})`;
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

    const data = (await response.json()) as Partial<ClinicalSearchResponse>;
    return {
      query: typeof data.query === 'string' ? data.query : trimmedQuery,
      engine: typeof data.engine === 'string' ? data.engine : 'aegis-clinical-search',
      source: typeof data.source === 'string' ? data.source : 'discovery-engine',
      totalSize: typeof data.totalSize === 'number' ? data.totalSize : 0,
      summary: typeof data.summary === 'string' ? data.summary : '',
      references: Array.isArray(data.references) ? data.references : [],
      results: Array.isArray(data.results) ? data.results : [],
      request_id: typeof data.request_id === 'string' ? data.request_id : requestId,
    };
  } catch (err) {
    if (options.signal?.aborted) {
      throw createAbortError();
    }
    if (isAbortError(err)) {
      throw new Error('Clinical search request timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
    options.signal?.removeEventListener('abort', onCallerAbort);
  }
}
