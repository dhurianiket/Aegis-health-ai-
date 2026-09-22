/**
 * Gemini client routed through Cloudflare Worker `aegishealthai-edge`.
 * POST https://api.aegishealthai.co.in/api/ai/generate
 *
 * Auth (interim): Authorization Bearer VITE_AEGIS_EDGE_BEARER when set — must match
 * Worker EDGE_SHARED_SECRET. Firebase ID tokens are used only as fallback when the
 * shared bearer is unset; the Worker does not verify Firebase JWTs yet.
 * Never embed GEMINI_API_KEY or EDGE secrets in source / commits.
 */

import { getAuthToken, hasAuthTokenProvider, setAuthTokenProvider } from './authTokenProvider';
export { setAuthTokenProvider } from './authTokenProvider';
export type { TokenProvider } from './authTokenProvider';

export interface GeminiGenerateConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
  systemInstruction?: unknown;
  safetySettings?: unknown;
  [key: string]: unknown;
}

export interface GeminiGenerateParams {
  model?: string;
  contents: unknown;
  config?: GeminiGenerateConfig;
  generationConfig?: Record<string, unknown>;
  safetySettings?: unknown;
  systemInstruction?: unknown;
}

export interface GeminiGenerateResponse {
  text: string;
  candidates?: unknown[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    [key: string]: unknown;
  };
  raw: unknown;
}

type EdgeErrorBody = {
  error?: string;
  message?: string;
  request_id?: string;
};

const DEFAULT_EDGE_API_URL = 'https://api.aegishealthai.co.in';
const WORKERS_DEV_FALLBACK_URL = 'https://aegishealthai-edge.dhurianiket.workers.dev';
const DEFAULT_MODEL = 'gemini-3.6-flash';
const SECONDARY_FALLBACK = 'gemini-3.5-flash';

const FLASH_ALIASES = new Set([
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]);

const PRO_ALIASES = new Set(['gemini-2.5-pro', 'gemini-1.5-pro']);

export function getEdgeApiBaseUrl(): string {
  const raw =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EDGE_API_URL) ||
    DEFAULT_EDGE_API_URL;
  return String(raw).replace(/\/$/, '');
}

export function isEdgeConfigured(): boolean {
  return getEdgeBearer().trim().length > 0 || hasAuthTokenProvider();
}

export function getEdgeBearer(): string {
  const bearer =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AEGIS_EDGE_BEARER) ||
    '';
  return String(bearer);
}

export function normalizeModel(model: string | undefined): string {
  if (!model) return DEFAULT_MODEL;
  if (FLASH_ALIASES.has(model)) return DEFAULT_MODEL;
  if (PRO_ALIASES.has(model)) return 'gemini-3.1-pro-preview';
  return model;
}

function isUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };
  const errorMsg = String(e.message || '').toLowerCase();
  const errorStatus = e.status ?? e.code;
  return (
    errorStatus === 503 ||
    errorStatus === 502 ||
    errorStatus === 504 ||
    errorStatus === 'UNAVAILABLE' ||
    errorMsg.includes('503') ||
    errorMsg.includes('502') ||
    errorMsg.includes('504') ||
    errorMsg.includes('demand') ||
    errorMsg.includes('unavailable')
  );
}

export function isLocationRoutingError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };
  const errorMsg = String(e.message || '').toLowerCase();
  // Avoid matching clinical prose that merely contains the word "location".
  return (
    errorMsg.includes('user location is not supported') ||
    errorMsg.includes('failed_precondition') ||
    errorMsg.includes('pop routing') ||
    (errorMsg.includes('location') && errorMsg.includes('not supported'))
  );
}

export function isNetworkOrRoutingError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: unknown; code?: unknown; message?: unknown; name?: unknown };
  const errorMsg = String(e.message || '').toLowerCase();
  const errorName = String(e.name || '').toLowerCase();
  const errorStatus = e.status ?? e.code;

  // Do NOT treat AbortError as retryable — user/cancel aborts must surface immediately.
  if (errorName === 'aborterror' || errorMsg.includes('aborted')) {
    return false;
  }

  return (
    isLocationRoutingError(err) ||
    errorStatus === 502 ||
    errorStatus === 504 ||
    errorStatus === 0 ||
    errorName === 'typeerror' ||
    errorMsg.includes('failed to fetch') ||
    errorMsg.includes('networkerror') ||
    errorMsg.includes('network request failed') ||
    errorMsg.includes('load failed') ||
    errorMsg.includes('net::err') ||
    errorMsg.includes('econnrefused') ||
    errorMsg.includes('fetch failed') ||
    errorMsg.includes('connection')
  );
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const p = payload as {
    text?: unknown;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (typeof p.text === 'string') return p.text;
  const parts = p.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((part) => (part && typeof part.text === 'string' ? part.text : '')).join('');
  }
  return '';
}

export function normalizeSystemInstruction(si: unknown): unknown {
  if (si === undefined || si === null) return undefined;
  if (typeof si === 'string') {
    return { role: 'user', parts: [{ text: si }] };
  }
  if (typeof si === 'object' && si !== null) {
    const obj = si as Record<string, unknown>;
    if (typeof obj.text === 'string' && !obj.parts) {
      return { role: 'user', parts: [{ text: obj.text }] };
    }
  }
  return si;
}

function buildEdgeBody(params: GeminiGenerateParams, model: string): Record<string, unknown> {
  const config = params.config || {};
  const {
    systemInstruction: configSystemInstruction,
    safetySettings: configSafetySettings,
    ...generationFromConfig
  } = config;

  const generationConfig: Record<string, unknown> = {
    ...(params.generationConfig || {}),
    ...generationFromConfig,
  };
  // SDK uses `config`; edge contract uses `generationConfig`
  delete generationConfig.systemInstruction;
  delete generationConfig.safetySettings;

  const body: Record<string, unknown> = {
    model,
    contents: params.contents,
  };

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  const rawSystemInstruction =
    params.systemInstruction ?? configSystemInstruction;
  const systemInstruction = normalizeSystemInstruction(rawSystemInstruction);
  if (systemInstruction !== undefined) {
    body.systemInstruction = systemInstruction;
  }

  const safetySettings = params.safetySettings ?? configSafetySettings;
  if (safetySettings !== undefined) {
    body.safetySettings = safetySettings;
  }

  return body;
}

export class EdgeGeminiError extends Error {
  status?: number | string;
  code?: number | string;
  requestId?: string;

  constructor(message: string, init?: { status?: number | string; requestId?: string }) {
    super(message);
    this.name = 'EdgeGeminiError';
    this.status = init?.status;
    this.code = init?.status;
    this.requestId = init?.requestId;
  }
}

/** @internal exported for unit tests */
export async function callEdgeGenerate(
  params: GeminiGenerateParams,
  model: string,
  fetchImpl: typeof fetch = fetch,
  baseUrlOverride?: string,
): Promise<GeminiGenerateResponse> {
  const bearer = getEdgeBearer().trim();
  // Prefer shared edge bearer while the Worker only accepts EDGE_SHARED_SECRET.
  // Firebase JWT is fallback-only until FlareOps adds ID-token verification.
  let authBearer = bearer;
  if (!authBearer) {
    const idToken = await getAuthToken();
    if (idToken) {
      authBearer = idToken;
    }
  }

  if (!authBearer) {
    throw new EdgeGeminiError(
      'Authentication required: VITE_AEGIS_EDGE_BEARER is not set, or please sign in with verified account.',
    );
  }

  const base = baseUrlOverride || getEdgeApiBaseUrl();
  const url = `${base}/api/ai/generate`;
  const requestId =
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `aegis-${Date.now()}`);

  const timeoutMs = 90_000;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authBearer}`,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(buildEdgeBody(params, model)),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutHandle);
    if (err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError') {
      throw new EdgeGeminiError('Edge Gemini request timed out or was aborted', {
        status: 408,
        requestId,
      });
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
  }

  const rawText = await response.text();
  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = { raw: rawText };
  }

  if (!response.ok) {
    const errBody = (parsed || {}) as EdgeErrorBody;
    throw new EdgeGeminiError(
      errBody.error || errBody.message || `Edge Gemini request failed (${response.status})`,
      {
        status: response.status,
        requestId: errBody.request_id || response.headers.get('x-request-id') || requestId,
      },
    );
  }

  const usageMetadata =
    parsed && typeof parsed === 'object' && 'usageMetadata' in parsed
      ? (parsed as { usageMetadata?: GeminiGenerateResponse['usageMetadata'] }).usageMetadata
      : undefined;

  return {
    text: extractText(parsed),
    candidates:
      parsed && typeof parsed === 'object' && 'candidates' in parsed
        ? (parsed as { candidates?: unknown[] }).candidates
        : undefined,
    usageMetadata,
    raw: parsed,
  };
}

export async function callEdgeWithPoPRetry(
  params: GeminiGenerateParams,
  model: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeminiGenerateResponse> {
  let lastErr: unknown;
  const primaryUrl = getEdgeApiBaseUrl();
  const fallbackUrl =
    primaryUrl !== WORKERS_DEV_FALLBACK_URL ? WORKERS_DEV_FALLBACK_URL : DEFAULT_EDGE_API_URL;

  for (let i = 0; i < 3; i++) {
    try {
      // On retries (i > 0), if previous attempt encountered a network, location routing, or service outage error,
      // failover immediately to the alternate edge hostname (workers.dev fallback or default)
      const urlToUse = i > 0 && isNetworkOrRoutingError(lastErr) ? fallbackUrl : primaryUrl;
      return await callEdgeGenerate(params, model, fetchImpl, urlToUse);
    } catch (err: unknown) {
      lastErr = err;
      if (isNetworkOrRoutingError(err) && i < 2) {
        await new Promise((r) => setTimeout(r, 150 * (i + 1) + Math.random() * 50));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function generateWithFallback(
  params: GeminiGenerateParams,
  fetchImpl: typeof fetch,
): Promise<GeminiGenerateResponse> {
  const originalModel = params.model;
  const effectiveModel = normalizeModel(params.model);

  const attempt = async (model: string) => callEdgeWithPoPRetry(params, model, fetchImpl);

  try {
    return await attempt(effectiveModel);
  } catch (err: unknown) {
    if (!isUnavailableError(err)) throw err;

    if (effectiveModel !== DEFAULT_MODEL) {
      console.warn(
        `[Gemini Edge] Model "${originalModel}" (mapped to "${effectiveModel}") unavailable. Retrying with "${DEFAULT_MODEL}"...`,
      );
      try {
        return await attempt(DEFAULT_MODEL);
      } catch (retryErr: unknown) {
        if (!isUnavailableError(retryErr)) throw retryErr;
        console.warn(
          `[Gemini Edge] "${DEFAULT_MODEL}" unavailable. Retrying with "${SECONDARY_FALLBACK}"...`,
        );
        return await attempt(SECONDARY_FALLBACK);
      }
    }

    console.warn(
      `[Gemini Edge] "${DEFAULT_MODEL}" unavailable. Retrying with "${SECONDARY_FALLBACK}"...`,
    );
    return await attempt(SECONDARY_FALLBACK);
  }
}

async function* streamAsSingleChunk(
  params: GeminiGenerateParams,
  fetchImpl: typeof fetch,
): AsyncGenerator<GeminiGenerateResponse> {
  const result = await generateWithFallback(params, fetchImpl);
  yield result;
}

export interface EdgeChatSession {
  sendMessageStream: (input: { message: string } | string) => Promise<AsyncGenerator<GeminiGenerateResponse>>;
  sendMessage: (input: { message: string } | string) => Promise<GeminiGenerateResponse>;
}

export interface EdgeChatCreateParams {
  model?: string;
  history?: unknown;
  config?: GeminiGenerateConfig;
}

export interface AegisAI {
  models: {
    generateContent: (params: GeminiGenerateParams) => Promise<GeminiGenerateResponse>;
    generateContentStream: (
      params: GeminiGenerateParams,
    ) => Promise<AsyncGenerator<GeminiGenerateResponse>>;
  };
  chats: {
    create: (params?: EdgeChatCreateParams) => EdgeChatSession;
  };
}


function messageToText(input: { message: string } | string): string {
  return typeof input === 'string' ? input : input.message;
}

function buildChatContents(history: unknown, userMessage: string): unknown {
  const contents: unknown[] = [];
  if (Array.isArray(history)) {
    for (const item of history) {
      contents.push(item);
    }
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });
  return contents;
}

function createChatSession(
  createParams: EdgeChatCreateParams | undefined,
  fetchImpl: typeof fetch,
): EdgeChatSession {
  const model = createParams?.model;
  const history = createParams?.history;
  const config = createParams?.config;

  const run = (userMessage: string) =>
    generateWithFallback(
      {
        model,
        contents: buildChatContents(history, userMessage),
        config,
        systemInstruction: config?.systemInstruction,
      },
      fetchImpl,
    );

  return {
    sendMessage: async (input) => run(messageToText(input)),
    sendMessageStream: async (input) => streamAsSingleChunk(
      {
        model,
        contents: buildChatContents(history, messageToText(input)),
        config,
        systemInstruction: config?.systemInstruction,
      },
      fetchImpl,
    ),
  };
}

let aiInstance: AegisAI | null = null;
let fetchImplForTests: typeof fetch | null = null;

/** Test-only: inject fetch and reset singleton */
export function __setGeminiFetchForTests(fetchImpl: typeof fetch | null): void {
  fetchImplForTests = fetchImpl;
  aiInstance = null;
}

export function getAI(): AegisAI {
  if (!aiInstance) {
    if (!getEdgeBearer() && !hasAuthTokenProvider()) {
      throw new Error(
        'Authentication required: VITE_AEGIS_EDGE_BEARER is not set, or please sign in with verified account.',
      );
    }

    const activeFetch = fetchImplForTests || fetch;

    aiInstance = {
      models: {
        generateContent: (params: GeminiGenerateParams) =>
          generateWithFallback(params, activeFetch),
        generateContentStream: async (params: GeminiGenerateParams) =>
          streamAsSingleChunk(params, activeFetch),
      },
      chats: {
        create: (params?: EdgeChatCreateParams) => createChatSession(params, activeFetch),
      },
    };
  }
  return aiInstance;
}

export default getAI;
