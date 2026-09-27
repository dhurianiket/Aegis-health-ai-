/**
 * Lounge output guard: detects patient-directed medicine dosing in a Gemini
 * reply and replaces the whole reply with a fixed, safe message.
 *
 * Applies ONLY to Specialist Lounge requests (feature flag "specialist").
 * Report-extraction and other routes are never passed through this guard,
 * because they legitimately return dose strings printed on prescriptions.
 *
 * Pure module: no Worker/DOM globals, unit-testable with vitest.
 *
 * Detection (sentence level, English + Hindi/Hinglish basics):
 *   A. a per-kg dose calculation anywhere (e.g. "0.5 units/kg", "1.6 mcg/kg"), OR
 *   B. a sentence with a dose amount (number + mg/mcg/units/IU/ml/tablets/
 *      puffs/drops/goli…) AND a therapy-CHANGE verb (start/increase/reduce/
 *      stop/switch…, badhao/kam karo/shuru karo…, बढ़ाएं…), OR
 *   C. a sentence with a dose amount AND an administer verb (take/inject/
 *      dose…, lo/lijiye/lagao…, लें…) where the amount is NOT already in the
 *      request's own patient data (restating a recorded prescription is allowed).
 * Lab concentrations (mg/dL, mmol/L, IU/L, mL/min, mg/g) are NOT dose amounts.
 */

export const LOUNGE_FEATURE = "specialist";

export const SAFE_DOSING_REPLY = [
  "I can't give medicine doses or tell you to start, stop or change a medicine. Only a registered medical practitioner (RMP) who knows your full history can decide that safely.",
  "",
  "Please discuss your medicines and doses with your doctor or pharmacist. I'm happy to explain in general terms what a medicine does or help you prepare questions for your doctor.",
  "",
  "If you feel unwell or this is urgent, call **112** (or **108** for an ambulance).",
  "",
  "मैं दवा की खुराक नहीं बता सकता/सकती और न ही दवा शुरू, बंद या बदलने की सलाह दे सकता/सकती हूँ। कृपया अपने पंजीकृत डॉक्टर (RMP) से सलाह लें। आपात स्थिति में **112** पर कॉल करें।",
  "",
  "_AI health information, not medical advice. Please consult a registered medical practitioner before making health decisions._",
].join("\n");

const NUM = String.raw`\d+(?:[.,]\d+)*(?:\s*(?:-|–|to|se)\s*\d+(?:[.,]\d+)*)?`;
const UNIT =
  String.raw`(?:mg|mgs|milligrams?|mcg|µg|μg|micrograms?|units?|iu|ml|mls|millilit(?:er|re)s?|tablets?|tabs?|capsules?|caps?|puffs?|drops?|sachets?|goli(?:yan|yaan|yon)?|मिलीग्राम|यूनिट|गोली|गोलियां|गोलियाँ)`;
/** Denominators that turn a unit into a lab concentration / rate rather than a dose. */
const LAB_DENOMINATOR = String.raw`(?!\s*\/\s*(?:dl|l|ml|min|g|mmol|mol|hpf|µl|ul|mm3|cumm)(?![a-z]))`;

// Unicode-aware boundaries (JS \b is ASCII-only and fails for Devanagari).
const B_START = String.raw`(?<![\p{L}\p{N}])`;
const B_END = String.raw`(?![\p{L}\p{N}])`;

const DOSE_AMOUNT = new RegExp(`${B_START}${NUM}\\s*${UNIT}${B_END}${LAB_DENOMINATOR}`, "iu");
const PER_KG_DOSE = new RegExp(`${B_START}${NUM}\\s*(?:mg|mcg|µg|μg|units?|iu|ml)\\s*\\/\\s*kg${B_END}`, "iu");

/** Verbs that CHANGE therapy: any dose amount in the same sentence is flagged. */
const CHANGE_VERBS = [
  // English
  "start", "starting", "begin", "increase", "increasing", "raise", "reduce", "reducing", "decrease", "decreasing",
  "lower", "cut down", "titrate", "titrating", "double", "halve", "switch to", "add", "go up to", "bump up",
  "up your", "top up", "stop", "skip", "change to",
  // Hinglish (romanised)
  "badhao", "badhaiye", "badha do", "badhaye", "badhayein", "kam karo", "kam kijiye", "kam kar do",
  "shuru karo", "shuru kijiye", "shuru kar do", "band karo", "band kar do", "band kijiye",
  // Hindi (Devanagari)
  "बढ़ाएं", "बढ़ाइए", "बढ़ाएँ", "बढ़ाओ", "कम करें", "कम कीजिए", "शुरू करें", "शुरू कीजिए", "बंद करें",
];

/**
 * Verbs that ADMINISTER a dose. Flagged unless every dose amount in the
 * sentence already appears in the request's own patient data (i.e. the reply
 * is merely restating a recorded prescription such as "your record lists
 * metformin 500 mg").
 */
const ADMIN_VERBS = [
  // English
  "take", "takes", "inject", "injecting", "give yourself", "use", "apply", "dose", "dosage", "dosing",
  "should take", "can take", "try",
  // Hinglish (romanised)
  "lo", "lijiye", "lijie", "lijiyega", "le lo", "lelo", "lena", "lein", "len", "le lijiye", "khao", "khaiye",
  "khayein", "khaye", "khana", "lagao", "lagaiye", "lagwao", "lagayein", "dose lo", "khurak",
  // Hindi (Devanagari)
  "लें", "लीजिए", "लीजिये", "लो", "लेना", "खाएं", "खाइए", "खाएँ", "लगाएं", "लगाइए", "इंजेक्शन", "खुराक",
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function verbRegex(verbs: readonly string[]): RegExp {
  return new RegExp(
    `${B_START}(?:${verbs.map((v) => escapeRegex(v).replace(/ /g, "\\s+")).join("|")})${B_END}`,
    "iu",
  );
}

const CHANGE_VERB = verbRegex(CHANGE_VERBS);
const ADMIN_VERB = verbRegex(ADMIN_VERBS);
const DOSE_AMOUNT_GLOBAL = new RegExp(DOSE_AMOUNT.source, "giu");

const UNIT_CANON: ReadonlyArray<[RegExp, string]> = [
  [/^(?:mg|mgs|milligrams?|मिलीग्राम)$/iu, "mg"],
  [/^(?:mcg|µg|μg|micrograms?)$/iu, "mcg"],
  [/^(?:units?|यूनिट)$/iu, "unit"],
  [/^iu$/iu, "iu"],
  [/^(?:ml|mls|millilit(?:er|re)s?)$/iu, "ml"],
  [/^(?:tablets?|tabs?|goli(?:yan|yaan|yon)?|गोली|गोलियां|गोलियाँ)$/iu, "tab"],
  [/^(?:capsules?|caps?)$/iu, "cap"],
  [/^puffs?$/iu, "puff"],
  [/^drops?$/iu, "drop"],
  [/^sachets?$/iu, "sachet"],
];

/** Canonical dose strings (e.g. "500mg", "10unit") found in `text`. */
export function extractDoseAmounts(text: string): string[] {
  const out: string[] = [];
  for (const m of text.normalize("NFKC").matchAll(DOSE_AMOUNT_GLOBAL)) {
    const raw = m[0].toLowerCase().replace(/\s+/g, "");
    const unitMatch = raw.match(/[^\d.,\-–]+$/u);
    const unitRaw = unitMatch ? unitMatch[0] : "";
    const num = raw.slice(0, raw.length - unitRaw.length).replace(/,/g, "");
    const canon = UNIT_CANON.find(([re]) => re.test(unitRaw))?.[1] ?? unitRaw;
    out.push(`${num}${canon}`);
  }
  return out;
}

export interface DosingDetection {
  matched: boolean;
  reason?: "per_kg_dose" | "change_dose" | "directive_dose";
  /** The offending sentence (for tests / debugging only — never log in production). */
  sentence?: string;
}

export interface DosingDetectionOptions {
  /** Canonical dose strings already present in the request's patient data. */
  knownDoses?: ReadonlySet<string>;
}

/** Splits text into sentence-ish chunks (., !, ?, danda, newlines). Decimals survive (no whitespace after '.'). */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।])\s+|\n+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function detectPatientDirectedDosing(text: string, options: DosingDetectionOptions = {}): DosingDetection {
  if (!text) return { matched: false };
  const normalised = text.normalize("NFKC");
  const perKg = normalised.match(PER_KG_DOSE);
  if (perKg) return { matched: true, reason: "per_kg_dose", sentence: perKg[0] };
  const known = options.knownDoses ?? new Set<string>();
  for (const sentence of splitSentences(normalised)) {
    if (!DOSE_AMOUNT.test(sentence)) continue;
    if (CHANGE_VERB.test(sentence)) {
      return { matched: true, reason: "change_dose", sentence };
    }
    if (ADMIN_VERB.test(sentence)) {
      const doses = extractDoseAmounts(sentence);
      if (doses.some((d) => !known.has(d))) {
        return { matched: true, reason: "directive_dose", sentence };
      }
    }
  }
  return { matched: false };
}

/** Collects all text parts from a Gemini `contents` array (the request's own data). */
export function collectRequestText(contents: unknown): string {
  if (!Array.isArray(contents)) return typeof contents === "string" ? contents : "";
  const chunks: string[] = [];
  for (const c of contents) {
    const parts = c && typeof c === "object" ? (c as { parts?: unknown }).parts : undefined;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      const t = p && typeof p === "object" ? (p as { text?: unknown }).text : undefined;
      if (typeof t === "string") chunks.push(t);
    }
  }
  return chunks.join("\n");
}

interface GeminiPart {
  text?: unknown;
  thought?: unknown;
  [key: string]: unknown;
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[]; role?: unknown };
  finishReason?: unknown;
  [key: string]: unknown;
}
interface GeminiResponseShape {
  candidates?: GeminiCandidate[];
  [key: string]: unknown;
}

/** Concatenates the visible (non-thought) text of the first candidate. */
export function extractCandidateText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as GeminiResponseShape).candidates;
  const parts = Array.isArray(candidates) ? candidates[0]?.content?.parts : undefined;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p) => p && p.thought !== true && typeof p.text === "string")
    .map((p) => String(p.text))
    .join("");
}

/**
 * Returns the payload unchanged when safe; otherwise a copy whose first
 * candidate's text is replaced by SAFE_DOSING_REPLY (other candidates dropped).
 */
export function applyLoungeOutputGuard(
  payload: unknown,
  requestContents?: unknown,
): { payload: unknown; replaced: boolean; reason?: DosingDetection["reason"] } {
  const knownDoses = new Set(extractDoseAmounts(collectRequestText(requestContents)));
  const detection = detectPatientDirectedDosing(extractCandidateText(payload), { knownDoses });
  if (!detection.matched || !payload || typeof payload !== "object") {
    return { payload, replaced: false };
  }
  const original = payload as GeminiResponseShape;
  const first = original.candidates?.[0] ?? {};
  const safeCandidate: GeminiCandidate = {
    ...first,
    content: { role: "model", parts: [{ text: SAFE_DOSING_REPLY }] },
    finishReason: "STOP",
  };
  return {
    payload: { ...original, candidates: [safeCandidate] },
    replaced: true,
    reason: detection.reason,
  };
}

/** Lounge requests are identified by an explicit feature flag from the SPA (body field or header). */
export function resolveFeature(headerValue: string | null, body: unknown): string | null {
  const fromHeader = (headerValue || "").trim().toLowerCase();
  if (fromHeader) return fromHeader;
  if (body && typeof body === "object") {
    const v = (body as { aegisFeature?: unknown }).aegisFeature;
    if (typeof v === "string" && v.trim()) return v.trim().toLowerCase();
  }
  return null;
}

/** Server-side ceiling for Lounge output tokens (the SPA sends its own, lower, caps). */
export const LOUNGE_MAX_OUTPUT_TOKENS_CEILING = 4096;
export const LOUNGE_DEFAULT_MAX_OUTPUT_TOKENS = 1536;

/** Clamps generationConfig.maxOutputTokens for Lounge requests; never trusts the client alone. */
export function clampLoungeGenerationConfig(generationConfig: unknown): Record<string, unknown> {
  const cfg: Record<string, unknown> =
    generationConfig && typeof generationConfig === "object" ? { ...(generationConfig as Record<string, unknown>) } : {};
  const requested = typeof cfg.maxOutputTokens === "number" && Number.isFinite(cfg.maxOutputTokens) ? cfg.maxOutputTokens : LOUNGE_DEFAULT_MAX_OUTPUT_TOKENS;
  cfg.maxOutputTokens = Math.max(1, Math.min(Math.floor(requested), LOUNGE_MAX_OUTPUT_TOKENS_CEILING));
  return cfg;
}
