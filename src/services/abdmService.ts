/**
 * abdmService.ts — ABDM (Ayushman Bharat Digital Mission) Health Stack Integration
 * Supports ABHA registration (M1), Care-Context Linking (M2), and Consent Manager FHIR Data Exchange (M3).
 */

import {
  AbhaProfile,
  CareContext,
  ConsentRequest,
  ConsentArtifact,
  EncryptedBundleTransfer,
  AbdmAuthMode,
  AbdmAuthResponse,
  LinkContextResponse,
  KeyMaterial,
} from '../types/abdm';
import { exportToFhirBundle, FhirBundle } from './fhirService';

export * from '../types/abdm';

const ABDM_PROFILE_KEY = 'aegis_abdm_profile_v1';
const ABDM_CONTEXTS_KEY = 'aegis_abdm_contexts_v1';
const ABDM_CONSENTS_KEY = 'aegis_abdm_consents_v1';

// Default Seed Care Contexts
export const DEFAULT_CARE_CONTEXTS: CareContext[] = [
  {
    referenceNumber: 'HIP-AEGIS-LAB-2026-001',
    display: 'Complete Blood Count (CBC) & Lipid Profile — Suburban Diagnostics',
    type: 'LabReport',
    date: '2026-08-15T09:30:00.000Z',
    hipId: 'IN2710001824',
    hipName: 'Aegis Health Intelligence Clinic (HIP)',
    status: 'linked',
    recordCount: 8,
  },
  {
    referenceNumber: 'HIP-AEGIS-RX-2026-002',
    display: 'Hypertension Regimen (Lisinopril 10mg & Amlodipine 5mg) — Dr. R. Sharma',
    type: 'Prescription',
    date: '2026-07-28T14:15:00.000Z',
    hipId: 'IN2710001824',
    hipName: 'Aegis Health Intelligence Clinic (HIP)',
    status: 'linked',
    recordCount: 2,
  },
  {
    referenceNumber: 'HIP-AEGIS-LAB-2026-003',
    display: 'Comprehensive Metabolic Panel (CMP) & HbA1c — Metropolis Lab',
    type: 'DiagnosticReport',
    date: '2026-06-10T11:00:00.000Z',
    hipId: 'IN2710001824',
    hipName: 'Aegis Health Intelligence Clinic (HIP)',
    status: 'linked',
    recordCount: 6,
  },
  {
    referenceNumber: 'HIP-AEGIS-SBAR-2026-004',
    display: 'SBAR Clinical Handover & Multimodal Risk Analysis Summary',
    type: 'SBARSummary',
    date: '2026-08-20T08:00:00.000Z',
    hipId: 'IN2710001824',
    hipName: 'Aegis Health Intelligence Clinic (HIP)',
    status: 'unlinked',
    recordCount: 1,
  },
];

// Default Seed Consent Requests from External HIUs
export const DEFAULT_CONSENT_REQUESTS: ConsentRequest[] = [
  {
    id: 'CR-2026-9481',
    patientAbha: 'aniket.dhuri@abdm',
    purpose: {
      code: 'CAREMGT',
      text: 'Care Management & Multispecialist Polyclinic Consultation',
    },
    hiu: {
      id: 'HIU-APOLLO-001',
      name: 'Apollo Telehealth & Multispecialty Clinic',
    },
    hip: {
      id: 'HIP-AEGIS-001',
      name: 'Aegis Health Intelligence (HIP)',
    },
    hiTypes: ['DiagnosticReport', 'Prescription', 'OPConsultation'],
    permission: {
      accessMode: 'VIEW',
      dateRange: {
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-08-20T23:59:59.000Z',
      },
      dataEraseAt: '2026-09-20T23:59:59.000Z',
      frequency: { unit: 'HOUR', value: 1, repeats: 0 },
    },
    requester: {
      name: 'Dr. Priya Nambiar (Cardiologist)',
      designation: 'Senior Consultant',
    },
    status: 'REQUESTED',
    createdAt: '2026-08-19T10:30:00.000Z',
    lastUpdated: '2026-08-19T10:30:00.000Z',
  },
  {
    id: 'CR-2026-7723',
    patientAbha: 'aniket.dhuri@abdm',
    purpose: {
      code: 'BTG',
      text: 'Emergency Diagnostic Review & Critical Biomarker Handover',
    },
    hiu: {
      id: 'HIU-MAX-002',
      name: 'Max Super Speciality Hospital OPD',
    },
    hip: {
      id: 'HIP-AEGIS-001',
      name: 'Aegis Health Intelligence (HIP)',
    },
    hiTypes: ['DiagnosticReport'],
    permission: {
      accessMode: 'VIEW',
      dateRange: {
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-08-20T23:59:59.000Z',
      },
      dataEraseAt: '2026-08-27T23:59:59.000Z',
      frequency: { unit: 'HOUR', value: 1, repeats: 0 },
    },
    requester: {
      name: 'Dr. Rajesh Mehta (General Physician)',
      designation: 'Chief Medical Officer',
    },
    status: 'GRANTED',
    createdAt: '2026-08-18T14:20:00.000Z',
    lastUpdated: '2026-08-18T14:25:00.000Z',
  },
];

// Helper: LocalStorage Persistence
export function getAbdmProfile(userId: string): AbhaProfile | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${ABDM_PROFILE_KEY}_${userId}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

export function saveAbdmProfile(userId: string, profile: AbhaProfile): AbhaProfile {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${ABDM_PROFILE_KEY}_${userId}`, JSON.stringify(profile));
    }
  } catch {}
  return profile;
}

export function disconnectAbdm(userId: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(`${ABDM_PROFILE_KEY}_${userId}`);
      window.localStorage.removeItem(`${ABDM_CONTEXTS_KEY}_${userId}`);
      window.localStorage.removeItem(`${ABDM_CONSENTS_KEY}_${userId}`);
    }
  } catch {}
}

export function getLinkedCareContexts(userId: string): CareContext[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${ABDM_CONTEXTS_KEY}_${userId}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return DEFAULT_CARE_CONTEXTS;
}

export function saveLinkedCareContexts(userId: string, contexts: CareContext[]): CareContext[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${ABDM_CONTEXTS_KEY}_${userId}`, JSON.stringify(contexts));
    }
  } catch {}
  return contexts;
}

export function getConsentRequests(userId: string): ConsentRequest[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${ABDM_CONSENTS_KEY}_${userId}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return DEFAULT_CONSENT_REQUESTS;
}

export function saveConsentRequests(userId: string, requests: ConsentRequest[]): ConsentRequest[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${ABDM_CONSENTS_KEY}_${userId}`, JSON.stringify(requests));
    }
  } catch {}
  return requests;
}

// ----------------------------------------------------
// MILESTONE 1 (M1): ABHA Generation & OTP Verification
// ----------------------------------------------------

export function formatAbhaNumber(raw14: string): string {
  const digits = raw14.replace(/\D/g, '').padEnd(14, '0').slice(0, 14);
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
}

export function generateQrCodePayload(profile: Partial<AbhaProfile>): string {
  return JSON.stringify({
    hidn: profile.abhaNumber || '91-4820-5912-3840',
    hid: profile.abhaAddress || 'aniket.dhuri@abdm',
    name: profile.name || 'Aniket Dhuri',
    gender: profile.gender === 'Female' ? 'F' : 'M',
    dob: profile.dateOfBirth || '1992-05-15',
    state_name: profile.state || 'Maharashtra',
    dist_name: profile.district || 'Mumbai',
    mobile: profile.mobile || '+91 98765 43210',
  });
}

export async function requestAbdmOtp(
  identifier: string,
  authMode: AbdmAuthMode = 'mobile'
): Promise<AbdmAuthResponse> {
  const cleanId = identifier.replace(/\s|-/g, '');
  if (!cleanId || cleanId.length < 10) {
    throw new Error('Please enter a valid 10-digit Mobile or 12-digit Aadhaar number.');
  }

  // Simulate ABDM Gateway latency
  await new Promise((res) => setTimeout(res, 200));

  const masked =
    authMode === 'aadhaar'
      ? `XXXX-XXXX-${cleanId.slice(-4)}`
      : `+91 ******${cleanId.slice(-4)}`;

  return {
    txnId: `txn-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    authMode,
    maskedTarget: masked,
    success: true,
    expiresInSeconds: 300,
  };
}

export async function confirmAbdmOtp(
  txnId: string,
  otp: string,
  userId: string,
  preferredAddress?: string,
  authMode: AbdmAuthMode = 'mobile'
): Promise<AbhaProfile> {
  if (!otp || otp.trim().length < 4) {
    throw new Error('Invalid OTP. Please enter a valid 6-digit verification code.');
  }

  await new Promise((res) => setTimeout(res, 300));

  const random14 = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  const formattedAbha = formatAbhaNumber(random14);
  const handleClean = (preferredAddress || `patient_${userId.substring(0, 6)}`)
    .replace(/@abdm$/, '')
    .toLowerCase();
  const finalAddress = `${handleClean}@abdm`;

  const profile: AbhaProfile = {
    abhaNumber: formattedAbha,
    abhaAddress: finalAddress,
    name: 'Aniket Dhuri',
    gender: 'Male',
    dateOfBirth: '1992-05-15',
    mobile: '+91 98765 43210',
    email: 'dhurianiket@gmail.com',
    address: '104, Blue Ridge Towers, Powai',
    district: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400076',
    status: 'linked',
    linkedCareContextsCount: 3,
    qrCodeString: generateQrCodePayload({
      abhaNumber: formattedAbha,
      abhaAddress: finalAddress,
      name: 'Aniket Dhuri',
      gender: 'Male',
      dateOfBirth: '1992-05-15',
    }),
    token: `abdm-jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    refreshToken: `abdm-ref-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    lastLinkedAt: new Date().toISOString(),
  };

  saveAbdmProfile(userId, profile);
  saveLinkedCareContexts(userId, DEFAULT_CARE_CONTEXTS);
  return profile;
}

export async function checkAbhaAddressAvailability(addressHandle: string): Promise<boolean> {
  const clean = addressHandle.replace(/@abdm$/, '').trim();
  const validRegex = /^[a-zA-Z0-9._]{3,32}$/;
  if (!validRegex.test(clean)) return false;
  await new Promise((res) => setTimeout(res, 100));
  return !['admin', 'root', 'support'].includes(clean.toLowerCase());
}

export async function createAbhaAddress(
  userId: string,
  abhaNumber: string,
  preferredAddress: string
): Promise<AbhaProfile> {
  const current = getAbdmProfile(userId);
  if (!current) throw new Error('No ABHA profile found.');

  const cleanHandle = preferredAddress.replace(/@abdm$/, '').toLowerCase();
  const updated: AbhaProfile = {
    ...current,
    abhaAddress: `${cleanHandle}@abdm`,
    lastLinkedAt: new Date().toISOString(),
  };
  saveAbdmProfile(userId, updated);
  return updated;
}

// ----------------------------------------------------
// MILESTONE 2 (M2): Care-Context Linking
// ----------------------------------------------------

export async function discoverCareContexts(
  userId: string,
  activeProfile?: any,
  firestoreDocs?: any[]
): Promise<CareContext[]> {
  const existing = getLinkedCareContexts(userId);
  if (firestoreDocs && firestoreDocs.length > 0) {
    const dynamicContexts: CareContext[] = firestoreDocs.map((doc, idx) => ({
      referenceNumber: `HIP-AEGIS-DOC-${doc.id || idx}`,
      display: `${doc.fileName || doc.title || 'Clinical Document'} — ${doc.hospitalName || 'Aegis Lab'}`,
      type: doc.type?.includes('prescription') ? 'Prescription' : 'DiagnosticReport',
      date: doc.date || doc.uploadedAt || new Date().toISOString(),
      documentId: doc.id,
      hipId: 'IN2710001824',
      hipName: 'Aegis Health Intelligence Clinic (HIP)',
      status: 'linked',
      recordCount: doc.extractedData?.observations?.length || 1,
    }));
    return dynamicContexts;
  }
  return existing;
}

export async function linkAbdmCareContext(
  userId: string,
  careContext: CareContext
): Promise<LinkContextResponse> {
  const profile = getAbdmProfile(userId);
  if (!profile) throw new Error('No active ABHA profile found. Please connect ABHA first.');

  await new Promise((res) => setTimeout(res, 200));

  const existing = getLinkedCareContexts(userId);
  const foundIdx = existing.findIndex((c) => c.referenceNumber === careContext.referenceNumber);
  let updatedList: CareContext[];

  if (foundIdx >= 0) {
    updatedList = existing.map((c, i) =>
      i === foundIdx ? { ...c, status: 'linked' as const } : c
    );
  } else {
    updatedList = [...existing, { ...careContext, status: 'linked' as const }];
  }

  const activeCount = updatedList.filter((c) => c.status === 'linked').length;
  saveLinkedCareContexts(userId, updatedList);

  const updatedProfile: AbhaProfile = {
    ...profile,
    linkedCareContextsCount: activeCount,
    lastLinkedAt: new Date().toISOString(),
  };
  saveAbdmProfile(userId, updatedProfile);

  return { success: true, updatedCount: activeCount, linkedContexts: updatedList };
}

export async function unlinkAbdmCareContext(
  userId: string,
  referenceNumber: string
): Promise<LinkContextResponse> {
  const profile = getAbdmProfile(userId);
  if (!profile) throw new Error('No active ABHA profile found.');

  await new Promise((res) => setTimeout(res, 200));

  const existing = getLinkedCareContexts(userId);
  const updatedList = existing.map((c) =>
    c.referenceNumber === referenceNumber ? { ...c, status: 'unlinked' as const } : c
  );

  const activeCount = updatedList.filter((c) => c.status === 'linked').length;
  saveLinkedCareContexts(userId, updatedList);

  const updatedProfile: AbhaProfile = {
    ...profile,
    linkedCareContextsCount: activeCount,
  };
  saveAbdmProfile(userId, updatedProfile);

  return { success: true, updatedCount: activeCount, linkedContexts: updatedList };
}

export async function linkBatchCareContexts(
  userId: string,
  careContexts: CareContext[]
): Promise<LinkContextResponse> {
  const profile = getAbdmProfile(userId);
  if (!profile) throw new Error('No active ABHA profile found.');

  await new Promise((res) => setTimeout(res, 300));

  const updatedList = careContexts.map((c) => ({ ...c, status: 'linked' as const }));
  const activeCount = updatedList.length;

  saveLinkedCareContexts(userId, updatedList);
  saveAbdmProfile(userId, {
    ...profile,
    linkedCareContextsCount: activeCount,
    lastLinkedAt: new Date().toISOString(),
  });

  return { success: true, updatedCount: activeCount, linkedContexts: updatedList };
}

// ----------------------------------------------------
// MILESTONE 3 (M3): Consent Manager & Encrypted FHIR Data Exchange
// ----------------------------------------------------

export async function simulateConsentApproval(
  consentRequestId: string,
  userId: string
): Promise<ConsentArtifact> {
  await new Promise((res) => setTimeout(res, 300));

  const requests = getConsentRequests(userId);
  const target = requests.find((r) => r.id === consentRequestId);
  if (!target) throw new Error(`Consent request ${consentRequestId} not found.`);

  const updatedRequests = requests.map((r) =>
    r.id === consentRequestId
      ? { ...r, status: 'GRANTED' as const, lastUpdated: new Date().toISOString() }
      : r
  );
  saveConsentRequests(userId, updatedRequests);

  const artifactId = `ART-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const artifact: ConsentArtifact = {
    consentId: artifactId,
    consentRequestId: target.id,
    patientAbha: target.patientAbha,
    hiuId: target.hiu.id,
    hipId: target.hip?.id || 'HIP-AEGIS-001',
    status: 'GRANTED',
    signature: `SHA256withECDSA:MEQCIEy8${Math.random().toString(36).substring(2, 10)}TAgIdR5k0${Math.random().toString(36).substring(2, 10)}=`,
    grantedAt: new Date().toISOString(),
    expiresAt: target.permission.dataEraseAt,
    permission: target.permission,
    hiTypes: target.hiTypes,
  };

  return artifact;
}

export async function simulateConsentDenial(
  consentRequestId: string,
  userId: string
): Promise<ConsentRequest> {
  await new Promise((res) => setTimeout(res, 200));
  const requests = getConsentRequests(userId);
  const updatedRequests = requests.map((r) =>
    r.id === consentRequestId
      ? { ...r, status: 'DENIED' as const, lastUpdated: new Date().toISOString() }
      : r
  );
  saveConsentRequests(userId, updatedRequests);
  const updated = updatedRequests.find((r) => r.id === consentRequestId)!;
  return updated;
}

export async function simulateConsentRevocation(
  consentId: string,
  userId: string
): Promise<void> {
  await new Promise((res) => setTimeout(res, 200));
  const requests = getConsentRequests(userId);
  const updatedRequests = requests.map((r) =>
    r.id === consentId || r.status === 'GRANTED'
      ? { ...r, status: 'REVOKED' as const, lastUpdated: new Date().toISOString() }
      : r
  );
  saveConsentRequests(userId, updatedRequests);
}

export async function simulateEncryptedDataTransfer(
  consentId: string,
  userId: string,
  activeProfile?: any,
  labReports?: any[]
): Promise<EncryptedBundleTransfer> {
  await new Promise((res) => setTimeout(res, 400));

  // 1. Generate FHIR R4 Bundle
  const patient = {
    id: userId,
    name: activeProfile?.name || 'Aniket Dhuri',
    email: activeProfile?.email || 'dhurianiket@gmail.com',
  };

  const sampleReport = {
    id: `rep-${Date.now()}`,
    title: 'Comprehensive Diagnostic Panel & Lipid Profile',
    date: new Date().toISOString().split('T')[0],
    biomarkers: [
      { name: 'HbA1c (Glycated Hemoglobin)', value: 5.6, unit: '%', loincCode: '4548-4', interpretation: 'normal' as const },
      { name: 'Fasting Blood Glucose', value: 92, unit: 'mg/dL', loincCode: '2345-7', interpretation: 'normal' as const },
      { name: 'Total Cholesterol', value: 178, unit: 'mg/dL', loincCode: '2093-3', interpretation: 'normal' as const },
      { name: 'Serum Creatinine', value: 0.9, unit: 'mg/dL', loincCode: '2160-0', interpretation: 'normal' as const },
    ],
    summary: 'Clinical lab panel processed and encrypted via ABDM HIP gateway.',
  };

  const fhirBundle = exportToFhirBundle(patient, labReports && labReports.length > 0 ? labReports : [sampleReport]);
  const rawFhirString = JSON.stringify(fhirBundle);

  // 2. Simulated ECDH Key Agreement
  const keyMaterial: KeyMaterial = {
    cryptoAlg: 'ECDH',
    curve: 'Curve25519',
    dhPublicKey: {
      expiry: new Date(Date.now() + 86400000).toISOString(),
      parameters: 'Curve25519/ECDH-AES-GCM-256',
      keyValue: `MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    },
    nonce: `nonce-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
  };

  // 3. Simulated AES-GCM-256 Ciphertext & Checksum
  let hash = 0;
  for (let i = 0; i < rawFhirString.length; i++) {
    hash = (hash << 5) - hash + rawFhirString.charCodeAt(i);
    hash |= 0;
  }
  const checksum = `sha256-${Math.abs(hash).toString(16).padStart(16, '0')}${Date.now().toString(16)}`;

  // Simulated Base64 Ciphertext
  let base64Mock: string;
  try {
    if (typeof window !== 'undefined' && window.btoa) {
      base64Mock = window.btoa(rawFhirString.substring(0, 120)) + '...[AES-GCM-256-ENCRYPTED-PAYLOAD]';
    } else {
      base64Mock = Buffer.from(rawFhirString.substring(0, 120)).toString('base64') + '...[AES-GCM-256-ENCRYPTED-PAYLOAD]';
    }
  } catch {
    base64Mock = 'U2FsdGVkX1+v8z4fH3...[AES-GCM-256-ENCRYPTED-PAYLOAD]';
  }

  return {
    transactionId: `TXN-EHR-TRANSFER-${Date.now().toString().slice(-6)}`,
    consentId,
    keyMaterial,
    encryptedData: base64Mock,
    checksum,
    hiType: 'DiagnosticReport',
    transferredAt: new Date().toISOString(),
    recordCount: sampleReport.biomarkers.length,
    decryptedBundle: fhirBundle,
  };
}
