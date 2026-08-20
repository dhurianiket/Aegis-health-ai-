/**
 * abdm.ts — TypeScript Interfaces for ABDM (Ayushman Bharat Digital Mission)
 * Standards compliant with National Health Authority (NHA) ABDM Sandbox Gateway v3 specs.
 * Covers ABHA Registration (M1), Care-Context Linking (M2), and Digital Consent & FHIR Data Exchange (M3).
 */

export type AbdmAuthMode = 'aadhaar' | 'mobile' | 'demo';

export interface AbhaProfile {
  abhaNumber: string;   // 14-digit format: XX-XXXX-XXXX-XXXX
  abhaAddress: string;  // e.g. aniket.dhuri@abdm
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;  // YYYY-MM-DD
  mobile: string;
  email?: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  status: 'verified' | 'linked' | 'unlinked';
  linkedCareContextsCount: number;
  qrCodeString?: string;
  token?: string;
  refreshToken?: string;
  createdAt: string;
  lastLinkedAt?: string;
}

export type CareContextType =
  | 'LabReport'
  | 'Prescription'
  | 'DiagnosticReport'
  | 'OPConsultation'
  | 'DischargeSummary'
  | 'SBARSummary'
  | 'ImmunizationRecord';

export interface CareContext {
  referenceNumber: string; // e.g. HIP-AEGIS-LAB-2026-001 or CC-LAB-001
  display: string;         // e.g. "Complete Blood Count (CBC) & Lipid Panel"
  type: CareContextType;
  date: string;            // ISO 8601 string
  documentId?: string;     // Internal Firestore docId
  hipId: string;           // Facility ID, e.g. "IN2710001824"
  hipName: string;         // "Aegis Health Intelligence Clinic (HIP)"
  status: 'linked' | 'unlinked' | 'pending';
  recordCount?: number;
}

export type ConsentStatus = 'REQUESTED' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';
export type HIType = 'DiagnosticReport' | 'Prescription' | 'OPConsultation' | 'DischargeSummary' | 'ImmunizationRecord';
export type AccessMode = 'VIEW' | 'STORE' | 'STREAM';

export interface ConsentPurpose {
  code: string; // e.g. "CAREMGT", "BTG", "PUBHLTH"
  text: string; // e.g. "Care Management & Polyclinic Specialist Review"
}

export interface ConsentPermission {
  accessMode: AccessMode;
  dateRange: {
    from: string; // ISO String
    to: string;   // ISO String
  };
  dataEraseAt: string; // ISO String
  frequency: {
    unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
    value: number;
    repeats: number;
  };
}

export interface ConsentRequest {
  id: string;          // Consent Request ID e.g. "CR-2026-9481"
  patientAbha: string; // e.g. "aniket.dhuri@abdm"
  purpose: ConsentPurpose;
  hiu: {
    id: string;   // e.g. "HIU-APOLLO-001"
    name: string; // e.g. "Apollo Multispecialty Tele-Diagnostics"
  };
  hip?: {
    id: string;   // e.g. "HIP-AEGIS-001"
    name: string; // e.g. "Aegis Health Intelligence"
  };
  hiTypes: HIType[];
  permission: ConsentPermission;
  requester: {
    name: string;
    designation?: string;
  };
  status: ConsentStatus;
  createdAt: string;
  lastUpdated: string;
}

export interface ConsentArtifact {
  consentId: string; // Artifact ID e.g. "ART-9842-1084"
  consentRequestId: string;
  patientAbha: string;
  hiuId: string;
  hipId: string;
  status: 'GRANTED' | 'REVOKED';
  signature: string; // Simulated SHA256withECDSA digital signature
  grantedAt: string;
  expiresAt: string;
  permission: ConsentPermission;
  hiTypes: HIType[];
}

export interface KeyMaterial {
  cryptoAlg: 'ECDH';
  curve: 'Curve25519';
  dhPublicKey: {
    expiry: string;
    parameters: string;
    keyValue: string;
  };
  nonce: string;
}

export interface EncryptedBundleTransfer {
  transactionId: string; // e.g. "TXN-EHR-TRANSFER-9481"
  consentId: string;
  keyMaterial: KeyMaterial;
  encryptedData: string; // Base64 ciphertext
  checksum: string;      // SHA-256 string
  hiType: HIType;
  transferredAt: string;
  recordCount: number;
  decryptedBundle?: any; // FHIR R4 Bundle for UI inspection & download
}

export interface AbdmAuthResponse {
  txnId: string;
  authMode: AbdmAuthMode;
  maskedTarget: string;
  success: boolean;
  expiresInSeconds: number;
}

export interface LinkContextResponse {
  success: boolean;
  updatedCount: number;
  linkedContexts: CareContext[];
}
