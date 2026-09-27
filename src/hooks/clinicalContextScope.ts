/**
 * Pure helpers that scope clinical records (medications, lab documents) to the
 * ACTIVE family profile before they are folded into an AI prompt.
 *
 * Data model (see src/lib/firebase/firestore.ts + UploadCenter.tsx):
 *   - Records live in account-level collections `users/{uid}/medications` and
 *     `users/{uid}/documents`, and carry a `profileId` field naming the
 *     profile (`users/{uid}/profiles/{pid}`) they belong to.
 *   - Older / manually-added records may have NO `profileId`. Those are
 *     treated as belonging to the account's PRIMARY profile only, never to a
 *     secondary (e.g. child) profile.
 *
 * Keep this module free of Firebase/React imports so it is unit-testable.
 */
import type { Medication } from "../types/health";
import type { LabBiomarker } from "../services/drugLabEngine";

export interface ProfileScopedRecord {
  profileId?: string | null;
}

export interface ProfileLike {
  id: string;
  name?: string;
  fullName?: string;
  createdAt?: unknown;
}

export type ScopedMedication = Medication & {
  profileId?: string | null;
  name?: string;
};

export interface ClinicalDocumentData extends ProfileScopedRecord {
  extractedData?: unknown;
  lab_values?: unknown;
  observations?: unknown;
  labResults?: unknown;
  createdAt?: unknown;
  date?: unknown;
}

/** Converts Firestore Timestamp / Date / ISO string / epoch into millis. */
export function toMillis(value: unknown): number | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === "object") {
    const v = value as { toMillis?: unknown; seconds?: unknown };
    if (typeof v.toMillis === "function") {
      const t = (v.toMillis as () => unknown)();
      return typeof t === "number" && Number.isFinite(t) ? t : null;
    }
    if (typeof v.seconds === "number") return v.seconds * 1000;
  }
  return null;
}

/**
 * The primary profile is the account holder's own profile: the only profile,
 * else the earliest-created one (ProfileContext bootstraps it first), else a
 * profile literally named "Myself". Returns null when it cannot be decided,
 * in which case legacy unscoped records are shown to NO profile (fail-closed).
 */
export function resolvePrimaryProfileId(profiles: readonly ProfileLike[]): string | null {
  if (profiles.length === 0) return null;
  if (profiles.length === 1) return profiles[0].id;

  let best: { id: string; t: number } | null = null;
  let tie = false;
  for (const p of profiles) {
    const t = toMillis(p.createdAt);
    if (t === null) continue;
    if (!best || t < best.t) {
      best = { id: p.id, t };
      tie = false;
    } else if (t === best.t) {
      tie = true;
    }
  }
  if (best && !tie) return best.id;

  const myself = profiles.filter(
    (p) => (p.name ?? p.fullName ?? "").trim().toLowerCase() === "myself",
  );
  return myself.length === 1 ? myself[0].id : null;
}

/** True when `record` may be shown in the context of `activeProfileId`. */
export function belongsToProfile(
  record: ProfileScopedRecord,
  activeProfileId: string | null | undefined,
  isPrimaryProfile: boolean,
): boolean {
  if (!activeProfileId) return false;
  const pid = typeof record.profileId === "string" ? record.profileId.trim() : "";
  if (pid) return pid === activeProfileId;
  return isPrimaryProfile;
}

export function scopeToProfile<T extends ProfileScopedRecord>(
  records: readonly T[],
  activeProfileId: string | null | undefined,
  isPrimaryProfile: boolean,
): T[] {
  return records.filter((r) => belongsToProfile(r, activeProfileId, isPrimaryProfile));
}

/** Active (no endDate) medications for the profile, newest first. */
export function selectActiveMedications(
  meds: readonly ScopedMedication[],
  activeProfileId: string | null | undefined,
  isPrimaryProfile: boolean,
): ScopedMedication[] {
  return scopeToProfile(meds, activeProfileId, isPrimaryProfile)
    .filter((m) => !m.endDate)
    .map((m) => ({ m, t: toMillis(m.addedAt) ?? 0 }))
    .sort((a, b) => b.t - a.t)
    .map((x) => x.m);
}

function str(v: unknown): string {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

function firstArray(...candidates: unknown[]): unknown[] {
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

/** Extracts lab biomarkers from the profile's documents only. */
export function extractLabBiomarkers(
  docs: ReadonlyArray<{ id: string; data: ClinicalDocumentData }>,
  activeProfileId: string | null | undefined,
  isPrimaryProfile: boolean,
): LabBiomarker[] {
  const out: LabBiomarker[] = [];
  for (const { id, data } of docs) {
    if (!belongsToProfile(data, activeProfileId, isPrimaryProfile)) continue;
    const extracted =
      data.extractedData && typeof data.extractedData === "object"
        ? (data.extractedData as Record<string, unknown>)
        : (data as Record<string, unknown>);
    const obs = firstArray(extracted.lab_values, extracted.observations, extracted.labResults);
    for (const raw of obs) {
      if (!raw || typeof raw !== "object") continue;
      const l = raw as Record<string, unknown>;
      const testName = str(l.testName) || str(l.marker) || str(l.markerName);
      if (!testName) continue;
      const numericValue =
        typeof l.numericValue === "number"
          ? l.numericValue
          : typeof l.numeric_value === "number"
            ? l.numeric_value
            : null;
      out.push({
        id: str(l.id) || id,
        testName,
        marker: testName,
        value: str(l.value) || str(l.display_value) || str(l.numeric_value),
        numericValue,
        unit: str(l.unit) || str(l.unitOriginal),
        referenceRange: str(l.referenceRange) || str(l.reference_range),
        flag: str(l.flag) || str(l.status) || "NORMAL",
        date: str(l.date) || str(data.createdAt) || str(data.date) || undefined,
      });
    }
  }
  return out;
}
