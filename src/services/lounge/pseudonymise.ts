/**
 * Pseudonymisation applied to record text before it is placed inside the
 * <patient_data> block sent to Gemini. Best-effort, regex-based: it removes
 * the obvious direct identifiers; it is NOT a guarantee of anonymity.
 */

export const REDACTION = {
  phone: "[phone removed]",
  email: "[email removed]",
  aadhaar: "[Aadhaar-like number removed]",
  abha: "[ABHA number removed]",
  abhaAddress: "[ABHA address removed]",
  name: "the user",
  surname: "[surname removed]",
} as const;

// ABHA number: 14 digits, usually 2-4-4-4 (e.g. 91-1234-5678-9012).
const ABHA_NUMBER = /\b\d{2}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
// ABHA address (PHR address): name@abdm / name@sbx.
const ABHA_ADDRESS = /\b[a-z0-9._-]{3,}@(?:abdm|sbx)\b/gi;
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// Aadhaar: 12 digits, first digit 2-9, often grouped 4-4-4.
const AADHAAR = /\b[2-9]\d{3}[-\s]?\d{4}[-\s]?\d{4}\b/g;
// Indian mobile: optional +91 / 91 / 0 prefix, 10 digits starting 6-9 (allow one space/hyphen after 5 digits).
const INDIAN_MOBILE = /(?<![\d.])(?:\+?91[-\s]?|0)?[6-9]\d{4}[-\s]?\d{5}(?![\d.])/g;
// Landline with STD code, e.g. 022-2345 6789 / (080) 23456789.
const LANDLINE = /(?<![\d.])\(?0\d{2,4}\)?[-\s]\d{3,4}[-\s]?\d{4}(?![\d.])/g;
// Labelled identifiers on report headers.
const LABELLED_ID =
  /(?<![[\w-])(?:(?:patient|pt\.?)\s*(?:id|uhid|mrn)|uhid|mrn|aadhaar(?:\s*no\.?)?|abha(?:\s*(?:no\.?|number|id))?|mobile(?:\s*no\.?)?|phone(?:\s*no\.?)?|contact(?:\s*no\.?)?)\s*[:#-]\s*[A-Za-z0-9][A-Za-z0-9/-]{3,23}(?:\s\d{3,6})?/gi;

/**
 * Words that commonly appear in reports/prompts. A surname equal to one of
 * these is NOT replaced on its own (only as part of the full name), so e.g. a
 * profile named "Synthetic Patient" does not turn "PATIENT PROFILE" into noise.
 */
const SURNAME_STOPWORDS = new Set([
  "patient", "profile", "name", "report", "test", "result", "results", "sample", "blood", "sugar", "urine",
  "male", "female", "doctor", "hospital", "clinic", "lab", "labs", "date", "age", "sex", "normal", "high",
  "low", "range", "value", "unit", "units", "summary", "note", "notes", "user", "self", "myself", "family",
  "child", "baby", "master", "health", "care", "guide", "heart", "kidney", "liver", "lung", "brain", "bone",
  "skin", "thyroid", "diabetes", "cancer", "fever", "pain", "white", "black", "brown", "green", "gold", "rose",
]);

const MAX_PSEUDONYMISE_CHUNK_CHARS = 50_000;
const MAX_FULLNAME_CHARS = 120;
const MAX_NAME_TOKENS = 6;

function processInChunks(text: string, transform: (chunk: string) => string): string {
  if (!text || text.length <= MAX_PSEUDONYMISE_CHUNK_CHARS) {
    return transform(text);
  }
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(text.length, cursor + MAX_PSEUDONYMISE_CHUNK_CHARS);
    if (end < text.length) {
      const lastNewline = text.lastIndexOf("\n", end);
      if (lastNewline > cursor) {
        end = lastNewline + 1;
      }
    }
    chunks.push(transform(text.slice(cursor, end)));
    cursor = end;
  }
  return chunks.join("");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const UNI_BOUNDARY_START = "(?<![\\p{L}\\p{N}\\p{M}])";
const UNI_BOUNDARY_END = "(?![\\p{L}\\p{N}\\p{M}])";

export function redactIdentifiers(text: string): string {
  if (!text) return text;
  const normalized = text.normalize("NFC");
  return processInChunks(normalized, (chunk) =>
    chunk
      .replace(ABHA_ADDRESS, REDACTION.abhaAddress)
      .replace(EMAIL, REDACTION.email)
      .replace(ABHA_NUMBER, REDACTION.abha)
      .replace(AADHAAR, REDACTION.aadhaar)
      .replace(INDIAN_MOBILE, REDACTION.phone)
      .replace(LANDLINE, REDACTION.phone)
      // Labelled ids last, so numbers already redacted above are not half-matched.
      .replace(LABELLED_ID, (m) => `${m.split(/[:#-]/)[0].trim()}: [identifier removed]`),
  );
}

/** First given name only (never the full name). Returns null when not derivable. */
export function firstNameOnly(fullName: string | null | undefined): string | null {
  const cleaned = String(fullName ?? "")
    .normalize("NFC")
    .slice(0, MAX_FULLNAME_CHARS)
    .replace(/^(?:mr|mrs|ms|miss|dr|master|baby|shri|smt|kumari)\.?\s+/i, "")
    .trim();
  const first = cleaned.split(/\s+/)[0] ?? "";
  if (!first || first.toLowerCase() === "myself") return null;
  return first;
}

/**
 * Replaces the profile's full name with the first name (or "the user") and
 * removes the surname (last token) wherever it appears on its own — e.g.
 * "Mr. Sharma" → first name, "Sharma" → "[surname removed]". Middle names are
 * left alone (they are often common words or other people's names). Surnames
 * shorter than 3 characters are skipped to avoid clobbering ordinary words.
 */
export function pseudonymiseName(text: string, fullName: string | null | undefined): string {
  if (!text || !fullName) return text;
  const normalizedText = text.normalize("NFC");
  const boundedFullName = String(fullName).normalize("NFC").slice(0, MAX_FULLNAME_CHARS).trim();
  const tokens = boundedFullName.split(/\s+/).filter(Boolean).slice(0, MAX_NAME_TOKENS);
  if (tokens.length === 0) return text;
  const first = firstNameOnly(boundedFullName);

  const fullNameRe =
    tokens.length > 1
      ? new RegExp(`${UNI_BOUNDARY_START}${tokens.map(escapeRegExp).join("\\s+")}${UNI_BOUNDARY_END}`, "giu")
      : null;
  const surname = tokens.length > 1 ? tokens[tokens.length - 1] : "";
  const hasRedactableSurname = Boolean(surname && surname.length >= 3 && !SURNAME_STOPWORDS.has(surname.toLowerCase()));
  const escapedSurname = hasRedactableSurname ? escapeRegExp(surname) : "";
  const titleSurnameRe = hasRedactableSurname
    ? new RegExp(`${UNI_BOUNDARY_START}(?:mr|mrs|ms|miss|shri|smt)\\.?\\s+${escapedSurname}${UNI_BOUNDARY_END}`, "giu")
    : null;
  const surnameRe = hasRedactableSurname
    ? new RegExp(`${UNI_BOUNDARY_START}${escapedSurname}${UNI_BOUNDARY_END}`, "giu")
    : null;

  return processInChunks(normalizedText, (chunk) => {
    let out = chunk;
    if (fullNameRe) {
      out = out.replace(fullNameRe, first ?? REDACTION.name);
    }
    if (titleSurnameRe) {
      out = out.replace(titleSurnameRe, first ?? REDACTION.name);
    }
    if (surnameRe) {
      out = out.replace(surnameRe, REDACTION.surname);
    }
    return out;
  });
}

/** Full pipeline for record text entering <patient_data>. */
export function pseudonymiseRecordText(text: string, fullName?: string | null): string {
  return redactIdentifiers(pseudonymiseName(text, fullName));
}
