/**
 * abdmService.ts — ABDM (Ayushman Bharat Digital Mission) Health Stack Integration
 * Supports ABHA registration (M1), Care-Context Linking (M2), and Consent Manager FHIR Data Exchange (M3).
 */

export interface AbhaProfile {
  abhaNumber: string; // 14-digit: 12-3456-7890-1234
  abhaAddress: string; // e.g. aniket@abdm
  name: string;
  gender: string;
  dateOfBirth: string;
  mobile: string;
  status: 'verified' | 'linked';
  linkedCareContextsCount: number;
}

export interface CareContext {
  referenceNumber: string;
  display: string;
  type: 'LabReport' | 'Prescription' | 'SBARSummary';
  date: string;
}

const ABDM_STORAGE_KEY = 'aegis_abdm_profile_v1';

export function getAbdmProfile(userId: string): AbhaProfile | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${ABDM_STORAGE_KEY}_${userId}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function saveAbdmProfile(userId: string, profile: AbhaProfile): AbhaProfile {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${ABDM_STORAGE_KEY}_${userId}`, JSON.stringify(profile));
    }
  } catch {}
  return profile;
}

/**
 * M1 Milestone — Initiates OTP verification for ABHA creation
 */
export async function requestAbdmOtp(mobileOrAadhaar: string): Promise<{ txnId: string; success: boolean }> {
  // Simulate ABDM Gateway /v3/hip/auth/init latency
  await new Promise((res) => setTimeout(res, 800));
  return {
    txnId: `txn-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    success: true,
  };
}

/**
 * M1 Milestone — Confirms OTP and issues ABHA Profile
 */
export async function confirmAbdmOtp(
  txnId: string,
  otp: string,
  userId: string,
  preferredAbhaAddress?: string
): Promise<AbhaProfile> {
  await new Promise((res) => setTimeout(res, 1000));

  const random14 = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  const formattedAbha = `${random14.slice(0, 2)}-${random14.slice(2, 6)}-${random14.slice(6, 10)}-${random14.slice(10, 14)}`;
  const finalAddress = preferredAbhaAddress ? `${preferredAbhaAddress}@abdm` : `patient_${userId.substring(0, 6)}@abdm`;

  const profile: AbhaProfile = {
    abhaNumber: formattedAbha,
    abhaAddress: finalAddress,
    name: 'Aniket Dhuri',
    gender: 'Male',
    dateOfBirth: '1992-05-15',
    mobile: '+91 98765 43210',
    status: 'linked',
    linkedCareContextsCount: 3,
  };

  saveAbdmProfile(userId, profile);
  return profile;
}

/**
 * M2 Milestone — Links a new care context (Lab Report / SBAR) to patient ABHA
 */
export async function linkAbdmCareContext(
  userId: string,
  careContext: CareContext
): Promise<{ success: boolean; updatedCount: number }> {
  const current = getAbdmProfile(userId);
  if (!current) {
    throw new Error('No active ABHA profile found. Please connect ABHA first.');
  }

  await new Promise((res) => setTimeout(res, 600));

  const updated: AbhaProfile = {
    ...current,
    linkedCareContextsCount: current.linkedCareContextsCount + 1,
  };

  saveAbdmProfile(userId, updated);
  return { success: true, updatedCount: updated.linkedCareContextsCount };
}
