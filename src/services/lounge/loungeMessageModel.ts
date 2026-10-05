/**
 * Pure (Firebase-free) model for Specialist Lounge message storage.
 *
 * Layout (schema v2):
 *   users/{uid}/profiles/{pid}/specialistChats/{specialistId}            ← chat meta (no message text)
 *   users/{uid}/profiles/{pid}/specialistChats/{specialistId}/messages/{messageId}
 *
 * Each message doc carries `expireAt` for a Firestore TTL policy on the
 * `messages` collection group (default retention: 180 days).
 *
 * Legacy (schema v1) stored every message in one growing `messages` array on
 * the chat doc. It is migrated lazily on first load (see loungeStorage.ts).
 */

export const LOUNGE_SCHEMA_VERSION = 2;
export const LOUNGE_MESSAGE_TTL_DAYS = 180;
/** Must match the size limit enforced in firestore.rules. */
export const LOUNGE_MESSAGE_MAX_CHARS = 20000;
export const LOUNGE_MESSAGE_LOAD_LIMIT = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

export type LoungeStoredRole = "user" | "assistant";

export interface LoungeMessageInput {
  role: LoungeStoredRole;
  content: string;
  timestamp: Date;
  kind?: "triage";
}

/** Plain representation of a message doc (Dates are converted to Timestamps at write time). */
export interface LoungeMessageRecord {
  role: LoungeStoredRole;
  content: string;
  createdAt: Date;
  expireAt: Date;
  seq: number;
  schemaVersion: number;
  kind?: "triage";
}

export function computeExpireAt(createdAt: Date, ttlDays: number = LOUNGE_MESSAGE_TTL_DAYS): Date {
  return new Date(createdAt.getTime() + ttlDays * DAY_MS);
}

function validDate(d: Date | undefined, fallback: Date): Date {
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d : fallback;
}

/** Builds the Firestore payload for one message. Content is capped to the rules limit. */
export function buildMessageRecord(
  msg: LoungeMessageInput,
  seq: number,
  ttlDays: number = LOUNGE_MESSAGE_TTL_DAYS,
): LoungeMessageRecord {
  const createdAt = validDate(msg.timestamp, new Date());
  const record: LoungeMessageRecord = {
    role: msg.role === "user" ? "user" : "assistant",
    content: String(msg.content ?? "").slice(0, LOUNGE_MESSAGE_MAX_CHARS),
    createdAt,
    expireAt: computeExpireAt(createdAt, ttlDays),
    seq,
    schemaVersion: LOUNGE_SCHEMA_VERSION,
  };
  if (msg.kind === "triage") record.kind = "triage";
  return record;
}

function defaultRandomSuffix(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().split("-")[0].slice(0, 6);
    }
    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(4);
      crypto.getRandomValues(bytes);
      const num = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
      return Math.abs(num).toString(36).padStart(6, "0").slice(0, 6);
    }
  }
  return Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, "0");
}

/**
 * Sortable, collision-resistant id: zero-padded epoch millis + batch sequence +
 * random suffix. Lexicographic order == chronological order.
 */
export function buildMessageId(
  createdAt: Date,
  seq: number,
  random?: () => number | string
): string {
  const ms = String(Math.max(0, createdAt.getTime())).padStart(13, "0");
  const s = String(seq).padStart(3, "0");
  let r: string;
  if (random) {
    const val = random();
    r = typeof val === "number"
      ? Math.floor(val * 36 ** 6).toString(36).padStart(6, "0")
      : String(val).padStart(6, "0").slice(0, 6);
  } else {
    r = defaultRandomSuffix();
  }
  return `${ms}-${s}-${r}`;
}

/** Deterministic ids for migrated legacy messages, so a concurrent/retried migration never duplicates. */
export function buildLegacyMessageId(index: number): string {
  return `legacy-${String(index).padStart(5, "0")}`;
}

interface LegacyStoredMessage {
  role?: unknown;
  content?: unknown;
  text?: unknown;
  createdAt?: unknown;
  kind?: unknown;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (value && typeof value === "object") {
    const v = value as { toDate?: unknown; seconds?: unknown };
    if (typeof v.toDate === "function") {
      const d = (v.toDate as () => unknown)();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
    if (typeof v.seconds === "number") return new Date(v.seconds * 1000);
  }
  return null;
}

/** Normalises a legacy v1 `messages` array into message inputs (skips junk entries). */
export function normaliseLegacyMessages(raw: unknown, now: Date = new Date()): LoungeMessageInput[] {
  if (!Array.isArray(raw)) return [];
  const out: LoungeMessageInput[] = [];
  raw.forEach((entry, i) => {
    if (!entry || typeof entry !== "object") return;
    const m = entry as LegacyStoredMessage;
    const content = String(m.content ?? m.text ?? "");
    if (!content) return;
    // Legacy entries without a timestamp keep their relative order.
    const ts = toDate(m.createdAt) ?? new Date(now.getTime() - (raw.length - i) * 1000);
    const msg: LoungeMessageInput = { role: m.role === "user" ? "user" : "assistant", content, timestamp: ts };
    if (m.kind === "triage") msg.kind = "triage";
    out.push(msg);
  });
  return out;
}

export interface StoredMessageDoc {
  id: string;
  data: Record<string, unknown>;
}

/** Converts message docs (any order) into chronological message inputs. */
export function parseMessageDocs(docs: readonly StoredMessageDoc[]): LoungeMessageInput[] {
  return docs
    .map(({ id, data }) => {
      const created = toDate(data.createdAt) ?? new Date(0);
      const seq = typeof data.seq === "number" ? data.seq : 0;
      const msg: LoungeMessageInput = {
        role: data.role === "user" ? "user" : "assistant",
        content: String(data.content ?? ""),
        timestamp: created,
      };
      if (data.kind === "triage") msg.kind = "triage";
      return { id, created: created.getTime(), seq, msg };
    })
    .sort((a, b) => a.created - b.created || a.seq - b.seq || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((x) => x.msg);
}
