/**
 * Gemini client routed through Cloudflare Worker `aegishealthai-edge`.
 * POST https://api.aegishealthai.co.in/api/ai/generate
 *
 * Auth: Verified Firebase ID Token (JWT RS256 cryptographically verified at Cloudflare Edge via Google JWKs).
 * Edge enforces Turnstile bot defense + RS256 JWT cryptographic authentication.
 * Never embed GEMINI_API_KEY or server secrets in source / commits.
 */

import { getAuthToken, hasAuthTokenProvider, setAuthTokenProvider } from './authTokenProvider';
export { setAuthTokenProvider } from './authTokenProvider';
export type { TokenProvider } from './authTokenProvider';
import { getTurnstileToken, setTurnstileTokenProvider } from './turnstileTokenProvider';
export { setTurnstileTokenProvider, getTurnstileToken } from './turnstileTokenProvider';
export type { TurnstileTokenProvider } from './turnstileTokenProvider';

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
  /** Caller cancellation (e.g. the Lounge Stop button). Aborts the in-flight fetch. */
  signal?: AbortSignal;
  /**
   * Feature flag forwarded to the edge Worker in the JSON body (`aegisFeature`),
   * e.g. "specialist" enables the Lounge output guard. Sent in the body (not a
   * custom header) so it never triggers a CORS preflight change.
   */
  feature?: string;
  /**
   * Ask the edge for a guarded SSE stream (`stream: true` in the body). Only
   * honoured for Lounge requests; any other route (or an older Worker) answers
   * with plain JSON, which is surfaced as a single chunk.
   */
  stream?: boolean;
}

export interface GeminiGenerateResponse {
  text: string;
  /** Model id the edge was actually called with (after any fallback). */
  modelUsed?: string;
  /** `modelVersion` reported by Gemini in the response, when present. */
  modelVersion?: string;
  /** finishReason of the first candidate (e.g. "STOP", "MAX_TOKENS"). */
  finishReason?: string;
  candidates?: unknown[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    [key: string]: unknown;
  };
  /**
   * Streaming only: when true, `text` REPLACES everything received so far
   * (the edge dosing guard swapped the reply for its fixed safe message).
   */
  replace?: boolean;
  raw: unknown;
}

type EdgeErrorBody = {
  error?: string;
  message?: string;
  code?: string;
  resetAt?: string;
  request_id?: string;
};

const DEFAULT_EDGE_API_URL = 'https://api.aegishealthai.co.in';
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

/** True for caller-initiated cancellation (AbortController.abort()). */
export function isAbortError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { name?: unknown }).name === 'AbortError';
}

function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('The operation was aborted.', 'AbortError');
  }
  const e = new Error('The operation was aborted.');
  e.name = 'AbortError';
  return e;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw createAbortError();
}

export function getEdgeApiBaseUrl(): string {
  const raw =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EDGE_API_URL) ||
    DEFAULT_EDGE_API_URL;
  return String(raw).replace(/\/$/, '');
}

/**
 * The SPA authenticates to the edge ONLY with the signed-in user's Firebase ID token.
 * There is intentionally no shared/static bearer: anything in a VITE_* variable is
 * compiled into the public JS bundle and must never be a secret.
 */
export function isEdgeConfigured(): boolean {
  return hasAuthTokenProvider();
}

export function normalizeModel(model: string | undefined): string {
  if (!model) return DEFAULT_MODEL;
  if (FLASH_ALIASES.has(model)) return DEFAULT_MODEL;
  if (PRO_ALIASES.has(model)) return 'gemini-3.1-pro-preview';
  return model;
}

/**
 * A pinned model id the project/region can't serve (404 NOT_FOUND or
 * "model … not found / not supported"). Treated like "unavailable" so pinned
 * stable models still fall back to the default model.
 */
export function isModelNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object' || isAbortError(err)) return false;
  const e = err as { status?: unknown; code?: unknown; message?: unknown };
  const errorMsg = String(e.message || '').toLowerCase();
  const errorStatus = e.status ?? e.code;
  return (
    errorStatus === 404 ||
    errorStatus === 'NOT_FOUND' ||
    (errorMsg.includes('model') && (errorMsg.includes('not found') || errorMsg.includes('is not supported')))
  );
}

function isUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== 'object' || isAbortError(err)) return false;
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
  if (params.feature) {
    body.aegisFeature = params.feature;
  }
  if (params.stream) {
    body.stream = true;
  }

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
  /** Machine-readable edge error code, e.g. "LOUNGE_QUOTA_EXCEEDED". */
  errorCode?: string;
  /** ISO time the daily quota resets (quota errors only). */
  resetAt?: string;
  /** User-facing explanation supplied by the edge (quota errors only). */
  userMessage?: string;

  constructor(
    message: string,
    init?: { status?: number | string; requestId?: string; errorCode?: string; resetAt?: string; userMessage?: string },
  ) {
    super(message);
    this.name = 'EdgeGeminiError';
    this.status = init?.status;
    this.code = init?.status;
    this.requestId = init?.requestId;
    this.errorCode = init?.errorCode;
    this.resetAt = init?.resetAt;
    this.userMessage = init?.userMessage;
  }
}

export const LOUNGE_QUOTA_EXCEEDED = 'LOUNGE_QUOTA_EXCEEDED';

/** True for the edge's per-user daily Lounge quota 429. */
export function isLoungeQuotaError(err: unknown): err is EdgeGeminiError {
  return !!err && typeof err === 'object' && (err as { errorCode?: unknown }).errorCode === LOUNGE_QUOTA_EXCEEDED;
}

function edgeErrorFrom(response: Response, parsed: unknown, requestId: string): EdgeGeminiError {
  const errBody = (parsed || {}) as EdgeErrorBody;
  return new EdgeGeminiError(
    errBody.error || errBody.message || `Edge Gemini request failed (${response.status})`,
    {
      status: response.status,
      requestId: errBody.request_id || response.headers.get('x-request-id') || requestId,
      errorCode: typeof errBody.code === 'string' ? errBody.code : undefined,
      resetAt: typeof errBody.resetAt === 'string' ? errBody.resetAt : undefined,
      userMessage: errBody.code === LOUNGE_QUOTA_EXCEEDED && typeof errBody.message === 'string' ? errBody.message : undefined,
    },
  );
}

function responseFromJson(parsed: unknown, model: string): GeminiGenerateResponse {
  const usageMetadata =
    parsed && typeof parsed === 'object' && 'usageMetadata' in parsed
      ? (parsed as { usageMetadata?: GeminiGenerateResponse['usageMetadata'] }).usageMetadata
      : undefined;

  const modelVersion =
    parsed && typeof parsed === 'object' && typeof (parsed as { modelVersion?: unknown }).modelVersion === 'string'
      ? (parsed as { modelVersion: string }).modelVersion
      : undefined;
  const firstCandidate =
    parsed && typeof parsed === 'object'
      ? (parsed as { candidates?: Array<{ finishReason?: unknown }> }).candidates?.[0]
      : undefined;
  const finishReason = typeof firstCandidate?.finishReason === 'string' ? firstCandidate.finishReason : undefined;

  return {
    text: extractText(parsed),
    modelUsed: model,
    modelVersion,
    finishReason,
    candidates:
      parsed && typeof parsed === 'object' && 'candidates' in parsed
        ? (parsed as { candidates?: unknown[] }).candidates
        : undefined,
    usageMetadata,
    raw: parsed,
  };
}

interface OpenedEdgeRequest {
  response: Response;
  requestId: string;
  /** Stops forwarding caller aborts once the body has been consumed. */
  detach: () => void;
}

async function openEdgeRequest(
  params: GeminiGenerateParams,
  model: string,
  fetchImpl: typeof fetch,
  baseUrlOverride?: string,
  turnstileTokenOverride?: string,
): Promise<OpenedEdgeRequest> {
  // Auth: user Firebase ID token only (JWT RS256 cryptographically verified at Cloudflare Edge).
  const idToken = await getAuthToken();
  const authBearer = (idToken || '').trim();

  if (!authBearer) {
    throw new EdgeGeminiError(
      'Authentication required: Please sign in with a verified account to access Aegis AI.',
    );
  }

  const turnstileToken = turnstileTokenOverride || (await getTurnstileToken());
  const base = baseUrlOverride || getEdgeApiBaseUrl();
  const url = `${base}/api/ai/generate`;
  const requestId =
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `aegis-${Date.now()}`);

  throwIfAborted(params.signal);

  const timeoutMs = 90_000;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  // Propagate caller cancellation (Stop button) to the in-flight fetch.
  const onCallerAbort = () => controller.abort();
  params.signal?.addEventListener('abort', onCallerAbort, { once: true });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authBearer}`,
    'X-Request-Id': requestId,
  };
  if (turnstileToken) {
    headers['X-Turnstile-Token'] = turnstileToken;
  }

  const detach = () => params.signal?.removeEventListener('abort', onCallerAbort);
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildEdgeBody(params, model)),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutHandle);
    params.signal?.removeEventListener('abort', onCallerAbort);
    if (params.signal?.aborted) {
      // User cancelled: surface a real AbortError (never retried, never shown as an error).
      throw createAbortError();
    }
    if (isAbortError(err)) {
      throw new EdgeGeminiError('Edge Gemini request timed out or was aborted', {
        status: 408,
        requestId,
      });
    }
    throw err;
  } finally {
    // The timeout covers time-to-headers only; a stream may legitimately run longer.
    clearTimeout(timeoutHandle);
  }
  return { response, requestId, detach };
}

async function readJsonResponse(opened: OpenedEdgeRequest, params: GeminiGenerateParams, model: string): Promise<GeminiGenerateResponse> {
  const { response, requestId, detach } = opened;
  let rawText: string;
  try {
    rawText = await response.text();
  } catch (err: unknown) {
    if (params.signal?.aborted) throw createAbortError();
    throw err;
  } finally {
    detach();
  }
  throwIfAborted(params.signal);
  let parsed: unknown = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = { raw: rawText };
  }

  if (!response.ok) throw edgeErrorFrom(response, parsed, requestId);
  return responseFromJson(parsed, model);
}

/** @internal exported for unit tests */
export async function callEdgeGenerate(
  params: GeminiGenerateParams,
  model: string,
  fetchImpl: typeof fetch = fetch,
  baseUrlOverride?: string,
  turnstileTokenOverride?: string,
): Promise<GeminiGenerateResponse> {
  const opened = await openEdgeRequest(params, model, fetchImpl, baseUrlOverride, turnstileTokenOverride);
  return readJsonResponse(opened, params, model);
}

/** @internal exported for unit tests — parses complete SSE blocks from `buffer`. */
export function parseSseEvents(buffer: string): { events: Array<{ event: string; data: string }>; rest: string } {
  const blocks = buffer.split(/\r?\n\r?\n/);
  const rest = blocks.pop() ?? '';
  const events: Array<{ event: string; data: string }> = [];
  for (const block of blocks) {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (data.length) events.push({ event, data: data.join('\n') });
  }
  return { events, rest };
}

/**
 * Streaming variant. Yields `delta` chunks (append), a `replace` chunk
 * (`replace: true`, overwrite everything shown) and a final metadata chunk
 * (empty text, finishReason/usage). If the edge answers with JSON (non-Lounge
 * route, error, or an older Worker) the whole reply is yielded as one chunk.
 *
 * @internal exported for unit tests
 */
export async function* callEdgeGenerateStream(
  params: GeminiGenerateParams,
  model: string,
  fetchImpl: typeof fetch = fetch,
  baseUrlOverride?: string,
  turnstileTokenOverride?: string,
): AsyncGenerator<GeminiGenerateResponse> {
  const opened = await openEdgeRequest({ ...params, stream: true }, model, fetchImpl, baseUrlOverride, turnstileTokenOverride);
  const { response, requestId, detach } = opened;
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('text/event-stream') || !response.body) {
    yield await readJsonResponse(opened, params, model);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;
  try {
    for (;;) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (err: unknown) {
        if (params.signal?.aborted) throw createAbortError();
        throw err;
      }
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const { events, rest } = parseSseEvents(buffer);
      buffer = rest;
      for (const ev of events) {
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(ev.data) as Record<string, unknown>;
        } catch {
          continue;
        }
        throwIfAborted(params.signal);
        if (ev.event === 'delta' && typeof data.text === 'string') {
          yield { text: data.text, modelUsed: model, raw: data };
        } else if (ev.event === 'replace' && typeof data.text === 'string') {
          yield { text: data.text, replace: true, modelUsed: model, raw: data };
        } else if (ev.event === 'done') {
          finished = true;
          yield {
            text: '',
            modelUsed: model,
            modelVersion: typeof data.modelVersion === 'string' ? data.modelVersion : undefined,
            finishReason: typeof data.finishReason === 'string' ? data.finishReason : undefined,
            usageMetadata: (data.usageMetadata as GeminiGenerateResponse['usageMetadata']) ?? undefined,
            raw: data,
          };
        } else if (ev.event === 'error') {
          throw new EdgeGeminiError(
            typeof data.message === 'string' ? data.message : 'The AI stream failed',
            { status: 502, requestId: response.headers.get('x-request-id') || requestId },
          );
        }
      }
    }
    throwIfAborted(params.signal);
    if (!finished) {
      throw new EdgeGeminiError('The AI stream ended unexpectedly', {
        status: 502,
        requestId: response.headers.get('x-request-id') || requestId,
      });
    }
  } finally {
    detach();
    if (!finished) reader.cancel().catch(() => undefined);
  }
}

export async function callEdgeWithPoPRetry(
  params: GeminiGenerateParams,
  model: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeminiGenerateResponse> {
  let lastErr: unknown;
  const primaryUrl = getEdgeApiBaseUrl();

  for (let i = 0; i < 3; i++) {
    try {
      return await callEdgeGenerate(params, model, fetchImpl, primaryUrl);
    } catch (err: unknown) {
      lastErr = err;
      if (params.signal?.aborted || isAbortError(err)) throw err;
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

  const attempt = async (model: string) => {
    throwIfAborted(params.signal);
    return callEdgeWithPoPRetry(params, model, fetchImpl);
  };
  const shouldFallBack = (err: unknown) => isUnavailableError(err) || isModelNotFoundError(err);

  try {
    return await attempt(effectiveModel);
  } catch (err: unknown) {
    if (!shouldFallBack(err)) throw err;

    if (effectiveModel !== DEFAULT_MODEL) {
      console.warn(
        `[Gemini Edge] Model "${originalModel}" (mapped to "${effectiveModel}") unavailable. Retrying with "${DEFAULT_MODEL}"...`,
      );
      try {
        return await attempt(DEFAULT_MODEL);
      } catch (retryErr: unknown) {
        if (!shouldFallBack(retryErr)) throw retryErr;
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

/**
 * Streams with the same PoP retry + model fallback as generateWithFallback,
 * but only BEFORE the first chunk is yielded (never duplicates visible text).
 */
async function* streamWithFallback(
  params: GeminiGenerateParams,
  fetchImpl: typeof fetch,
): AsyncGenerator<GeminiGenerateResponse> {
  const effectiveModel = normalizeModel(params.model);
  const models =
    effectiveModel !== DEFAULT_MODEL ? [effectiveModel, DEFAULT_MODEL, SECONDARY_FALLBACK] : [DEFAULT_MODEL, SECONDARY_FALLBACK];
  const shouldFallBack = (err: unknown) => isUnavailableError(err) || isModelNotFoundError(err);
  const primaryUrl = getEdgeApiBaseUrl();

  for (let m = 0; m < models.length; m++) {
    const model = models[m];
    for (let attempt = 0; attempt < 3; attempt++) {
      throwIfAborted(params.signal);
      let yielded = false;
      try {
        for await (const chunk of callEdgeGenerateStream(params, model, fetchImpl, primaryUrl)) {
          yielded = true;
          yield chunk;
        }
        return;
      } catch (err: unknown) {
        if (yielded || params.signal?.aborted || isAbortError(err)) throw err;
        if (isNetworkOrRoutingError(err) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1) + Math.random() * 50));
          continue;
        }
        if (shouldFallBack(err) && m < models.length - 1) {
          console.warn(`[Gemini Edge] "${model}" unavailable. Retrying stream with "${models[m + 1]}"...`);
          break;
        }
        throw err;
      }
    }
  }
}

/**
 * Chat turn input. `contextParts` are extra user-role text parts placed BEFORE
 * the message in the same user turn (e.g. a delimited `<patient_data>` block),
 * so untrusted record data never has to live in the system instruction.
 */
export type EdgeChatMessageInput = string | { message: string; contextParts?: readonly string[] };

export interface EdgeChatSession {
  sendMessageStream: (input: EdgeChatMessageInput) => Promise<AsyncGenerator<GeminiGenerateResponse>>;
  sendMessage: (input: EdgeChatMessageInput) => Promise<GeminiGenerateResponse>;
}

export interface EdgeChatCreateParams {
  model?: string;
  history?: unknown;
  config?: GeminiGenerateConfig;
  /** Caller cancellation for every request made by this session. */
  signal?: AbortSignal;
  /** Edge feature flag (see GeminiGenerateParams.feature). */
  feature?: string;
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


/** @internal exported for unit tests */
export function buildChatContents(history: unknown, input: EdgeChatMessageInput): unknown[] {
  const contents: unknown[] = [];
  if (Array.isArray(history)) {
    for (const item of history) {
      contents.push(item);
    }
  }
  const message = typeof input === 'string' ? input : input.message;
  const contextParts = typeof input === 'string' ? [] : (input.contextParts ?? []);
  const parts = [
    ...contextParts.filter((t) => t.trim().length > 0).map((text) => ({ text })),
    { text: message },
  ];
  contents.push({ role: 'user', parts });
  return contents;
}

function createChatSession(
  createParams: EdgeChatCreateParams | undefined,
  fetchImpl: typeof fetch,
): EdgeChatSession {
  const model = createParams?.model;
  const history = createParams?.history;
  const config = createParams?.config;
  const signal = createParams?.signal;
  const feature = createParams?.feature;

  const run = (input: EdgeChatMessageInput) =>
    generateWithFallback(
      {
        model,
        contents: buildChatContents(history, input),
        config,
        systemInstruction: config?.systemInstruction,
        signal,
        feature,
      },
      fetchImpl,
    );

  return {
    sendMessage: async (input) => run(input),
    sendMessageStream: async (input) => streamWithFallback(
      {
        model,
        contents: buildChatContents(history, input),
        config,
        systemInstruction: config?.systemInstruction,
        signal,
        feature,
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
    if (!hasAuthTokenProvider()) {
      throw new Error(
        'Authentication required: Please sign in with a verified account to access Aegis AI.',
      );
    }

    const activeFetch = fetchImplForTests || fetch;

    aiInstance = {
      models: {
        generateContent: (params: GeminiGenerateParams) =>
          generateWithFallback(params, activeFetch),
        generateContentStream: async (params: GeminiGenerateParams) =>
          streamWithFallback(params, activeFetch),
      },
      chats: {
        create: (params?: EdgeChatCreateParams) => createChatSession(params, activeFetch),
      },
    };
  }
  return aiInstance;
}

export default getAI;
