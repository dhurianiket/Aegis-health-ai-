import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateDataProvenanceReceipt,
  downloadProvenanceReceiptJson,
  revokeAndWipeCareContext,
  saveAbdmProfile,
  saveLinkedCareContexts,
  getLinkedCareContexts,
  AbhaProfile,
  CareContext,
  ConsentRequest,
} from '../abdmService';

describe('ABDM Data Provenance Receipt & Cryptographic Audit Trail', () => {
  const mockProfile: AbhaProfile = {
    abhaNumber: '91-2345-6789-0123',
    abhaAddress: 'aniket.dhuri@abdm',
    name: 'Aniket Dhuri',
    gender: 'Male',
    dateOfBirth: '1995-05-15',
    mobile: '+919876543210',
    status: 'verified',
    linkedCareContextsCount: 2,
    createdAt: '2026-08-01T10:00:00.000Z',
  };

  const mockCareContext: CareContext = {
    referenceNumber: 'HIP-AEGIS-LAB-2026-001',
    display: 'Complete Blood Count (CBC) & Lipid Profile — Suburban Diagnostics',
    type: 'LabReport',
    date: '2026-08-15T09:30:00.000Z',
    hipId: 'IN2710001824',
    hipName: 'Aegis Health Intelligence Clinic (HIP)',
    status: 'linked',
    recordCount: 8,
  };

  const mockConsentRequest: ConsentRequest = {
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
    hiTypes: ['DiagnosticReport', 'Prescription'],
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
      name: 'Dr. Priya Nambiar',
      designation: 'Senior Consultant',
    },
    status: 'GRANTED',
    createdAt: '2026-08-19T10:30:00.000Z',
    lastUpdated: '2026-08-19T10:30:00.000Z',
  };

  const userId = 'provenance-test-user-123';

  beforeEach(() => {
    localStorage.clear();
    saveAbdmProfile(userId, mockProfile);
    saveLinkedCareContexts(userId, [mockCareContext]);
  });

  describe('1. Receipt Generation', () => {
    it('should generate a verifiable Data Provenance Receipt with SHA-256 and digital signature', () => {
      const receipt = generateDataProvenanceReceipt(mockCareContext, mockProfile, mockConsentRequest);

      expect(receipt.receiptId).toMatch(/^RCP-ABDM-/);
      expect(receipt.patientAbha).toBe('aniket.dhuri@abdm');
      expect(receipt.patientName).toBe('Aniket Dhuri');
      expect(receipt.verificationMode).toBe('NHA_OTP_VERIFIED');
      expect(receipt.originatingFacility.hipId).toBe('IN2710001824');
      expect(receipt.careContextRef.referenceNumber).toBe('HIP-AEGIS-LAB-2026-001');
      expect(receipt.consentArtifactId).toBe('ART-2026-9481');
      expect(receipt.permittedAccessMode).toBe('VIEW');
      expect(receipt.digitalSignature).toContain('SHA256withECDSA-NHA-HIP-');
      expect(receipt.checksum).toMatch(/^sha256-/);
    });

    it('should embed statutory DPDP compliance and zero-ambient ingestion guarantees', () => {
      const receipt = generateDataProvenanceReceipt(mockCareContext, mockProfile);

      expect(receipt.dpdpCompliance).toContain('DPDP Act 2023');
      expect(receipt.zeroAmbientPolicy).toContain('Zero Ambient Ingestion');
      expect(receipt.zeroAmbientPolicy).toContain('No background hospital scraping');
      expect(receipt.aiTrainingPolicy).toContain('Strict Zero-Retention');
      expect(receipt.aiTrainingPolicy).toContain('NEVER ingested for AI model training');
    });

    it('should gracefully handle unverified mock profiles', () => {
      const demoProfile: AbhaProfile = { ...mockProfile, status: 'unlinked' };
      const receipt = generateDataProvenanceReceipt(mockCareContext, demoProfile);

      expect(receipt.verificationMode).toBe('DEMO_MOCK_VERIFIED');
    });
  });

  describe('2. Revoke and Wipe Context', () => {
    it('should cryptographically unlink care context and update storage', async () => {
      const result = await revokeAndWipeCareContext(userId, mockCareContext.referenceNumber);

      expect(result.success).toBe(true);
      const unlinkedContext = result.updatedContexts.find(
        (c) => c.referenceNumber === mockCareContext.referenceNumber
      );
      expect(unlinkedContext?.status).toBe('unlinked');

      const persisted = getLinkedCareContexts(userId);
      expect(persisted.find((c) => c.referenceNumber === mockCareContext.referenceNumber)?.status).toBe('unlinked');
    });
  });

  describe('3. JSON Export', () => {
    it('should trigger JSON audit file download without crashing', () => {
      const receipt = generateDataProvenanceReceipt(mockCareContext, mockProfile, mockConsentRequest);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');

      downloadProvenanceReceiptJson(receipt);

      expect(appendChildSpy).toHaveBeenCalled();
      appendChildSpy.mockRestore();
    });
  });
});
