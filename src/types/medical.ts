/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum DocumentType {
  LAB_REPORT = "lab_report",
  PRESCRIPTION = "prescription",
  CONSULTATION_NOTE = "consultation_note",
  DISCHARGE_SUMMARY = "discharge_summary",
  IMAGING_REPORT = "imaging_report",
}

export enum LabStatus {
  NORMAL = "normal",
  ABNORMAL = "abnormal",
  CRITICAL = "critical",
}

export enum MedicationStatus {
  ACTIVE = "active",
  DISCONTINUED = "discontinued",
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  name?: string; // Compatibility with ProfileContext
  dob?: string;
  gender?: Gender;
  bloodType?: string;
  height?: number; // cm
  weight?: number; // kg
  clinicalNotes?: string;
  chronicConditions: string[];
  allergies: string[];
  medications?: Medication[];
  labValues?: LabResult[];
  doctorNotes?: string[];
  createdAt: string;
}

export interface MedicalDocument {
  id: string;
  userId: string;
  profileId?: string;
  type: DocumentType | string;
  date: string;
  extractedDate?: string;
  uploadedAt?: string;
  hospitalName?: string;
  doctorName?: string;
  fileName: string;
  fileUrl?: string;
  storagePath?: string;
  isProcessed: boolean;
  extractedData?: any;
  createdAt: string;
}

export interface LabResult {
  id: string;
  userId: string;
  profileId?: string;
  docId: string;
  date: string;
  extractedDate?: string;
  uploadedAt?: string;
  markerName: string;
  value: number;
  numeric_value?: number;
  display_value?: string;
  unit: string;
  referenceRange?: string;
  status: LabStatus | string;
}

export interface Medication {
  id: string;
  userId: string;
  profileId?: string;
  name: string;
  medicationName?: string;
  drugName?: string;
  dosage: string;
  frequency: string;
  status?: MedicationStatus | string;
  startDate: string;
  endDate?: string;
  purpose?: string;
}

export interface SpecialistInsight {
  id: string;
  userId: string;
  profileId?: string;
  specialty: string;
  timestamp: string;
  content: string;
  confidence: number;
  flags: string[];
  sourceDocIds: string[];
}

export interface HealthScore {
  id: string;
  userId: string;
  date: string;
  overall: number;
  systems: {
    blood: number;
    heart: number;
    liver: number;
    kidney: number;
    metabolic: number;
    inflammation: number;
  };
}

export enum Specialty {
  INTERNAL_MEDICINE = "Internal Medicine",
  ONCOLOGY = "Oncology",
  CARDIOLOGY = "Cardiology",
  ENDOCRINOLOGY = "Endocrinology",
  NEPHROLOGY = "Nephrology",
  HEPATOLOGY = "Hepatology",
  HEMATOLOGY = "Hematology",
  NUTRITION = "Nutrition & Preventive Medicine",
}

export interface SBARSummary {
  situation: string;
  background: string;
  assessment: string[];
  recommendation: string[];
}
