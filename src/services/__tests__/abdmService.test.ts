import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatAbhaNumber,
  generateQrCodePayload,
  requestAbdmOtp,
  confirmAbdmOtp,
  checkAbhaAddressAvailability,
  getLinkedCareContexts,
  linkAbdmCareContext,
  unlinkAbdmCareContext,
  linkBatchCareContexts,
  getConsentRequests,
  simulateConsentApproval,
  simulateConsentDenial,
  simulateConsentRevocation,
  simulateEncryptedDataTransfer,
  disconnectAbdm,
} from '../abdmService';

describe('ABDM (Ayushman Bharat Digital Mission) Gateway Simulator Suite', () => {
  const testUserId = 'test-patient-user-123';

  beforeEach(() => {
    disconnectAbdm(testUserId);
  });

  describe('Milestone 1 (M1): ABHA Generation, OTP & Profile', () => {
    it('formats 14-digit raw strings into standard XX-XXXX-XXXX-XXXX representation', () => {
      expect(formatAbhaNumber('91482059123840')).toBe('91-4820-5912-3840');
      expect(formatAbhaNumber('12345678901234')).toBe('12-3456-7890-1234');
    });

    it('generates a valid JSON QR code payload conforming to NHA schema', () => {
      const payload = generateQrCodePayload({
        abhaNumber: '91-4820-5912-3840',
        abhaAddress: 'aniket.dhuri@abdm',
        name: 'Aniket Dhuri',
        gender: 'Male',
        dateOfBirth: '1992-05-15',
      });
      const parsed = JSON.parse(payload);
      expect(parsed.hidn).toBe('91-4820-5912-3840');
      expect(parsed.hid).toBe('aniket.dhuri@abdm');
      expect(parsed.name).toBe('Aniket Dhuri');
      expect(parsed.gender).toBe('M');
    });

    it('initiates OTP request for Aadhaar and Mobile numbers', async () => {
      const mobileRes = await requestAbdmOtp('9876543210', 'mobile');
      expect(mobileRes.success).toBe(true);
      expect(mobileRes.maskedTarget).toContain('3210');

      const aadhaarRes = await requestAbdmOtp('123456789012', 'aadhaar');
      expect(aadhaarRes.success).toBe(true);
      expect(aadhaarRes.maskedTarget).toContain('9012');
    });

    it('verifies OTP, generates ABHA profile, and persists to storage', async () => {
      const profile = await confirmAbdmOtp('txn-123', '123456', testUserId, 'aniket.dhuri');
      expect(profile.abhaAddress).toBe('aniket.dhuri@abdm');
      expect(profile.status).toBe('linked');
      expect(profile.abhaNumber.split('-').length).toBe(4);
      expect(profile.qrCodeString).toBeDefined();
    });

    it('validates ABHA address availability and handles system reserved keywords', async () => {
      expect(await checkAbhaAddressAvailability('aniket.dhuri')).toBe(true);
      expect(await checkAbhaAddressAvailability('admin')).toBe(false);
      expect(await checkAbhaAddressAvailability('hi')).toBe(false); // under 3 chars
    });
  });

  describe('Milestone 2 (M2): Care-Context Discovery and Linking', () => {
    beforeEach(async () => {
      await confirmAbdmOtp('txn-123', '123456', testUserId, 'aniket.dhuri');
    });

    it('retrieves default and dynamically linked care contexts', () => {
      const contexts = getLinkedCareContexts(testUserId);
      expect(contexts.length).toBeGreaterThanOrEqual(3);
      expect(contexts.some((c) => c.type === 'LabReport')).toBe(true);
    });

    it('links a new care context and increments profile active count', async () => {
      const newContext = {
        referenceNumber: 'HIP-AEGIS-LAB-9999',
        display: 'Lipid Panel & Liver Function Tests',
        type: 'LabReport' as const,
        date: new Date().toISOString(),
        hipId: 'IN2710001824',
        hipName: 'Aegis Health Intelligence Clinic (HIP)',
        status: 'linked' as const,
        recordCount: 5,
      };

      const res = await linkAbdmCareContext(testUserId, newContext);
      expect(res.success).toBe(true);
      expect(res.linkedContexts.some((c) => c.referenceNumber === 'HIP-AEGIS-LAB-9999')).toBe(true);
    });

    it('unlinks an existing care context gracefully', async () => {
      const res = await unlinkAbdmCareContext(testUserId, 'HIP-AEGIS-LAB-2026-001');
      expect(res.success).toBe(true);
      const unlinked = res.linkedContexts.find((c) => c.referenceNumber === 'HIP-AEGIS-LAB-2026-001');
      expect(unlinked?.status).toBe('unlinked');
    });

    it('supports batch linking of care contexts', async () => {
      const batch = [
        {
          referenceNumber: 'CC-BATCH-01',
          display: 'Batch Lab 1',
          type: 'LabReport' as const,
          date: new Date().toISOString(),
          hipId: 'IN2710001824',
          hipName: 'Aegis Clinic',
          status: 'linked' as const,
        },
        {
          referenceNumber: 'CC-BATCH-02',
          display: 'Batch Lab 2',
          type: 'Prescription' as const,
          date: new Date().toISOString(),
          hipId: 'IN2710001824',
          hipName: 'Aegis Clinic',
          status: 'linked' as const,
        },
      ];

      const res = await linkBatchCareContexts(testUserId, batch);
      expect(res.success).toBe(true);
      expect(res.updatedCount).toBe(2);
    });
  });

  describe('Milestone 3 (M3): Consent Manager & Encrypted FHIR Exchange', () => {
    beforeEach(async () => {
      await confirmAbdmOtp('txn-123', '123456', testUserId, 'aniket.dhuri');
    });

    it('retrieves incoming consent requests from external Health Information Users (HIUs)', () => {
      const requests = getConsentRequests(testUserId);
      expect(requests.length).toBeGreaterThanOrEqual(1);
      expect(requests[0].purpose.code).toBeDefined();
    });

    it('simulates consent approval and generates a cryptographically signed consent artifact', async () => {
      const artifact = await simulateConsentApproval('CR-2026-9481', testUserId);
      expect(artifact.status).toBe('GRANTED');
      expect(artifact.consentRequestId).toBe('CR-2026-9481');
      expect(artifact.signature).toContain('SHA256withECDSA');
      expect(artifact.permission.accessMode).toBe('VIEW');
    });

    it('simulates consent denial and status update', async () => {
      const updated = await simulateConsentDenial('CR-2026-9481', testUserId);
      expect(updated.status).toBe('DENIED');
    });

    it('simulates consent revocation', async () => {
      await simulateConsentRevocation('CR-2026-7723', testUserId);
      const requests = getConsentRequests(testUserId);
      const target = requests.find((r) => r.id === 'CR-2026-7723');
      expect(target?.status).toBe('REVOKED');
    });

    it('executes ECDH Key Agreement and simulates AES-GCM-256 FHIR R4 Bundle exchange', async () => {
      const transfer = await simulateEncryptedDataTransfer('ART-9481-123', testUserId, {
        name: 'Aniket Dhuri',
        email: 'dhurianiket@gmail.com',
      });

      expect(transfer.transactionId).toContain('TXN-EHR-TRANSFER');
      expect(transfer.keyMaterial.cryptoAlg).toBe('ECDH');
      expect(transfer.keyMaterial.curve).toBe('Curve25519');
      expect(transfer.encryptedData).toContain('AES-GCM-256-ENCRYPTED-PAYLOAD');
      expect(transfer.checksum).toContain('sha256-');
      expect(transfer.decryptedBundle).toBeDefined();
      expect(transfer.decryptedBundle.resourceType).toBe('Bundle');
      expect(transfer.decryptedBundle.entry.length).toBeGreaterThan(0);
    });
  });
});
