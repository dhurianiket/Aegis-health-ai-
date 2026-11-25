import { isPlainObject } from "./payloadSecurity";

export const ALLOWED_TTS_LANGUAGES = new Set([
  "en-IN",
  "hi-IN",
  "mr-IN",
  "gu-IN",
  "bn-IN",
  "ta-IN",
  "te-IN",
  "kn-IN",
  "ml-IN",
  "pa-IN",
]);

export const MAX_TTS_TEXT_CHARS = 3000;

export interface ValidatedTtsRequest {
  text: string;
  languageCode: string;
  speakingRate: number;
}

/**
 * Validates and normalizes Cloud Text-to-Speech payloads.
 */
export function validateTtsPayload(
  rawBody: Record<string, unknown>,
): { ok: true; data: ValidatedTtsRequest } | { ok: false; error: string } {
  if (typeof rawBody.text !== "string") {
    return { ok: false, error: "text must be a non-empty string" };
  }
  const cleanText = rawBody.text.replace(/[*_#`~]/g, "").trim();
  if (!cleanText) {
    return { ok: false, error: "text must not be empty after sanitization" };
  }
  if (cleanText.length > MAX_TTS_TEXT_CHARS) {
    return { ok: false, error: `text exceeds maximum of ${MAX_TTS_TEXT_CHARS} characters` };
  }

  const languageCode =
    typeof rawBody.languageCode === "string" && rawBody.languageCode.trim()
      ? rawBody.languageCode.trim()
      : "en-IN";
  if (!ALLOWED_TTS_LANGUAGES.has(languageCode)) {
    return { ok: false, error: `Unsupported TTS languageCode: ${languageCode}` };
  }

  let speakingRate = 1.0;
  if (rawBody.speakingRate !== undefined) {
    if (typeof rawBody.speakingRate !== "number" || !Number.isFinite(rawBody.speakingRate)) {
      return { ok: false, error: "speakingRate must be a finite number" };
    }
    speakingRate = Math.max(0.75, Math.min(1.75, rawBody.speakingRate));
  }

  return {
    ok: true,
    data: { text: cleanText, languageCode, speakingRate },
  };
}

/**
 * Synthesizes regional clinical audio as base64 MP3 using Google Cloud Text-to-Speech.
 */
export async function synthesizeClinicalSpeech(params: {
  text: string;
  languageCode: string;
  speakingRate: number;
  projectId: string;
  accessToken: string;
  signal?: AbortSignal;
}): Promise<{ ok: true; audioContent: string; languageCode: string } | { ok: false; status: number; error: string }> {
  const { text, languageCode, speakingRate, projectId, accessToken, signal } = params;
  const endpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "x-goog-user-project": projectId,
    "Content-Type": "application/json",
    "User-Agent": "AegisHealthAI-Edge/2.0",
  };

  const callTts = (includeGender: boolean) =>
    fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        input: { text },
        voice: includeGender ? { languageCode, ssmlGender: "FEMALE" } : { languageCode },
        audioConfig: { audioEncoding: "MP3", speakingRate },
      }),
      signal,
    });

  let res = await callTts(true);
  if (res.status === 400 && !signal?.aborted) {
    res = await callTts(false);
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status >= 500 ? 502 : res.status,
      error: `Cloud Text-to-Speech returned HTTP ${res.status}`,
    };
  }

  const data = (await res.json()) as { audioContent?: unknown };
  if (typeof data.audioContent !== "string" || !data.audioContent) {
    return { ok: false, status: 502, error: "Cloud Text-to-Speech returned empty audioContent" };
  }

  return { ok: true, audioContent: data.audioContent, languageCode };
}

export interface NormalizedAirQuality {
  aqi: number | null;
  category: string;
  dominantPollutant: string;
  pm25: number | null;
  pm10: number | null;
  healthAdvice: string;
  provider: "google-air-quality";
  fetchedAt: string;
}

/**
 * Validates geographic coordinates for Air Quality API lookup.
 */
export function validateLatLngPayload(
  rawBody: Record<string, unknown>,
): { ok: true; latitude: number; longitude: number } | { ok: false; error: string } {
  const { latitude, longitude } = rawBody;
  if (typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: "latitude must be a finite number between -90 and 90" };
  }
  if (typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: "longitude must be a finite number between -180 and 180" };
  }
  return { ok: true, latitude, longitude };
}

function extractPollutantValue(
  pollutants: unknown,
  targetCode: string,
): number | null {
  if (!Array.isArray(pollutants)) return null;
  for (const item of pollutants) {
    if (!isPlainObject(item)) continue;
    if (String(item.code || "").toLowerCase() === targetCode) {
      const conc = item.concentration;
      if (isPlainObject(conc) && typeof conc.value === "number" && Number.isFinite(conc.value)) {
        return Math.round(conc.value * 10) / 10;
      }
    }
  }
  return null;
}

/**
 * Queries Google Cloud Air Quality API and returns a normalized clinical-context summary.
 */
export async function fetchGoogleAirQuality(params: {
  latitude: number;
  longitude: number;
  projectId: string;
  accessToken: string;
  signal?: AbortSignal;
}): Promise<{ ok: true; data: NormalizedAirQuality } | { ok: false; status: number; error: string }> {
  const { latitude, longitude, projectId, accessToken, signal } = params;
  const res = await fetch("https://airquality.googleapis.com/v1/currentConditions:lookup", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "x-goog-user-project": projectId,
      "Content-Type": "application/json",
      "User-Agent": "AegisHealthAI-Edge/2.0",
    },
    body: JSON.stringify({
      location: { latitude, longitude },
      extraComputations: ["HEALTH_RECOMMENDATIONS", "POLLUTANT_CONCENTRATION"],
    }),
    signal,
  });

  if (!res.ok) {
    return {
      ok: false,
      status: res.status >= 500 ? 502 : res.status,
      error: `Google Air Quality API returned HTTP ${res.status}`,
    };
  }

  const raw = (await res.json()) as {
    indexes?: Array<{ code?: unknown; aqi?: unknown; category?: unknown; dominantPollutant?: unknown }>;
    pollutants?: unknown;
    healthRecommendations?: Record<string, unknown>;
  };

  const primaryIndex = Array.isArray(raw.indexes) && raw.indexes.length > 0 ? raw.indexes[0] : undefined;
  const aqi =
    primaryIndex && typeof primaryIndex.aqi === "number" && Number.isFinite(primaryIndex.aqi)
      ? Math.round(primaryIndex.aqi)
      : null;
  const category =
    primaryIndex && typeof primaryIndex.category === "string" && primaryIndex.category
      ? primaryIndex.category
      : "Unknown";
  const dominantPollutant =
    primaryIndex && typeof primaryIndex.dominantPollutant === "string" && primaryIndex.dominantPollutant
      ? primaryIndex.dominantPollutant
      : "";

  const rec = isPlainObject(raw.healthRecommendations) ? raw.healthRecommendations : {};
  const healthAdvice =
    typeof rec.generalPopulation === "string" && rec.generalPopulation
      ? rec.generalPopulation
      : typeof rec.lungDiseasePopulation === "string"
        ? rec.lungDiseasePopulation
        : "";

  return {
    ok: true,
    data: {
      aqi,
      category,
      dominantPollutant,
      pm25: extractPollutantValue(raw.pollutants, "pm25"),
      pm10: extractPollutantValue(raw.pollutants, "pm10"),
      healthAdvice,
      provider: "google-air-quality",
      fetchedAt: typeof Date !== "undefined" ? new Date().toISOString() : "",
    },
  };
}
