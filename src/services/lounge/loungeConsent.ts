/**
 * Per-profile, per-purpose consent for the Specialist Lounge (DPDP-style
 * notice + consent). Stored at users/{uid}/profiles/{pid}/consents/{purpose}.
 */
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase/config";

export const LOUNGE_CONSENT_PURPOSE = "specialist_lounge_ai";
/** Bump when the disclosure text materially changes: users are asked again. */
export const LOUNGE_CONSENT_VERSION = "2026-09-27.v1";

export const LOUNGE_CONSENT_DISCLOSURES: readonly string[] = [
  "Health Guides (AI) give general educational information only. They are not doctors and do not diagnose, prescribe or change medicines. Always discuss decisions with a registered medical practitioner (RMP).",
  "To answer, your question and relevant parts of this profile's health records (e.g. lab values, medicines, report summaries) are sent to Google (Gemini API) through Cloudflare. This processing may happen on servers outside India.",
  "We do not send the profile's full name, and we remove obvious identifiers (phone numbers, email addresses, Aadhaar/ABHA-like numbers) from report text before it is sent.",
  "Lounge conversations are stored in your account and deleted automatically after 180 days. You can delete all Lounge data for this profile at any time.",
  "In an emergency, do not use this chat — call 112 (national emergency) or 108 (ambulance) immediately.",
];

export interface LoungeConsentRecord {
  purpose: typeof LOUNGE_CONSENT_PURPOSE;
  version: string;
  accepted: true;
  isMinorProfile: boolean;
  guardianConfirmed: boolean;
  /** Firestore server timestamp on write; Date/Timestamp-like on read. */
  acceptedAt?: unknown;
}

export function isLoungeConsentCurrent(
  record: Partial<LoungeConsentRecord> | null | undefined,
  version: string = LOUNGE_CONSENT_VERSION,
): boolean {
  if (!record || record.accepted !== true) return false;
  if (record.purpose !== LOUNGE_CONSENT_PURPOSE || record.version !== version) return false;
  if (record.isMinorProfile && record.guardianConfirmed !== true) return false;
  return true;
}

/** A minor profile can only be consented for by a parent / lawful guardian. */
export function canSubmitLoungeConsent(input: {
  acknowledged: boolean;
  isMinorProfile: boolean;
  guardianConfirmed: boolean;
}): boolean {
  if (!input.acknowledged) return false;
  if (input.isMinorProfile && !input.guardianConfirmed) return false;
  return true;
}

function consentRef(uid: string, profileId: string) {
  return doc(db, "users", uid, "profiles", profileId, "consents", LOUNGE_CONSENT_PURPOSE);
}

export async function getLoungeConsent(uid: string, profileId: string): Promise<LoungeConsentRecord | null> {
  const snap = await getDoc(consentRef(uid, profileId));
  return snap.exists() ? (snap.data() as LoungeConsentRecord) : null;
}

export async function saveLoungeConsent(
  uid: string,
  profileId: string,
  input: { isMinorProfile: boolean; guardianConfirmed: boolean },
): Promise<LoungeConsentRecord> {
  const record: LoungeConsentRecord = {
    purpose: LOUNGE_CONSENT_PURPOSE,
    version: LOUNGE_CONSENT_VERSION,
    accepted: true,
    isMinorProfile: input.isMinorProfile,
    guardianConfirmed: input.isMinorProfile ? input.guardianConfirmed : false,
  };
  await setDoc(consentRef(uid, profileId), { ...record, acceptedAt: serverTimestamp() });
  return record;
}
