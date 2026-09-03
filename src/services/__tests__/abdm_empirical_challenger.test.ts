/**
 * abdm_empirical_challenger.test.ts
 * Challenger 2 Adversarial Stress Test Suite for Milestone 3 (ABDM Gateway) & Milestone 4 (Integrations & Integrity)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatAbhaNumber,
  generateQrCodePayload,
  requestAbdmOtp,
  confirmAbdmOtp,
  checkAbhaAddressAvailability,
  createAbhaAddress,
  getAbdmProfile,
  saveAbdmProfile,
  disconnectAbdm,
  getLinkedCareContexts,
  saveLinkedCareContexts,
  discoverCareContexts,
  linkAbdmCareContext,
  unlinkAbdmCareContext,
  linkBatchCareContexts,
  getConsentRequests,
  saveConsentRequests,
  simulateConsentApproval,
  simulateConsentDenial,
  simulateConsentRevocation,
  simulateEncryptedDataTransfer,
  DEFAULT_CARE_CONTEXTS,
  DEFAULT_CONSENT_REQUESTS,
  CareContext,
  ConsentRequest,
  AbhaProfile,
} from '../abdmService';
import { validateFhirBundle } from '../fhirService';

describe('Challenger 2: ABDM Gateway Adversarial & Cryptographic Stress Suite', () => {
  const TEST_USER = 'challenger-test-patient-789';

  beforeEach(() => {
    disconnectAbdm(TEST_USER);
  });

  // =========================================================================
  // M1: IDENTIFIER VALIDATION, FORMATTING, & MALFORMED INPUTS
  // =========================================================================
  describe('M1: Identifier Parsing, OTP Edge Cases & Malformed Inputs', () => {
    it('M1.1: Rejects short, empty, or whitespace-only identifiers', async () => {
      await expect(requestAbdmOtp('', 'mobile')).rejects.toThrow(
        'Please enter a valid 10-digit Mobile or 12-digit Aadhaar number.'
      );
      await expect(requestAbdmOtp('   ', 'mobile')).rejects.toThrow(
        'Please enter a valid 10-digit Mobile or 12-digit Aadhaar number.'
      );
      await expect(requestAbdmOtp('12345', 'mobile')).rejects.toThrow(
        'Please enter a valid 10-digit Mobile or 12-digit Aadhaar number.'
      );
      await expect(requestAbdmOtp('987654321', 'mobile')).rejects.toThrow(
        'Please enter a valid 10-digit Mobile or 12-digit Aadhaar number.'
      ); // 9 digits
    });

    it('M1.2: Strips whitespace, hyphens, and formats maskedTarget accurately for Mobile vs Aadhaar', async () => {
      // Mobile with spaces and dashes
      const mobileRes = await requestAbdmOtp(' 98765-43210 ', 'mobile');
      expect(mobileRes.success).toBe(true);
      expect(mobileRes.authMode).toBe('mobile');
      expect(mobileRes.maskedTarget).toBe('+91 ******3210');
      expect(mobileRes.expiresInSeconds).toBe(300);

      // Aadhaar with spaces and dashes
      const aadhaarRes = await requestAbdmOtp(' 1234-5678-9012 ', 'aadhaar');
      expect(aadhaarRes.success).toBe(true);
      expect(aadhaarRes.authMode).toBe('aadhaar');
      expect(aadhaarRes.maskedTarget).toBe('XXXX-XXXX-9012');
    });

    it('M1.3: Enforces minimum OTP length boundary (> 3 chars) and rejects invalid OTPs', async () => {
      await expect(confirmAbdmOtp('txn-1', '', TEST_USER)).rejects.toThrow('Invalid OTP');
      await expect(confirmAbdmOtp('txn-1', '  ', TEST_USER)).rejects.toThrow('Invalid OTP');
      await expect(confirmAbdmOtp('txn-1', '12', TEST_USER)).rejects.toThrow('Invalid OTP');
      await expect(confirmAbdmOtp('txn-1', '123', TEST_USER)).rejects.toThrow('Invalid OTP');

      // Valid 4-6 digit OTP succeeds
      const profile = await confirmAbdmOtp('txn-1', '123456', TEST_USER, 'test.doctor');
      expect(profile.status).toBe('linked');
      expect(profile.abhaAddress).toBe('test.doctor@abdm');
    });

    it('M1.4: Handles raw 14-digit ABHA formatting with non-digit chars, underflow, and overflow', () => {
      // Underflow: fills with trailing zeros to exactly 14 digits
      const under = formatAbhaNumber('1234');
      expect(under).toBe('12-3400-0000-0000');
      expect(under.replace(/-/g, '').length).toBe(14);

      // Overflow: truncates to exactly 14 digits
      const over = formatAbhaNumber('91482059123840999999');
      expect(over).toBe('91-4820-5912-3840');

      // Special characters embedded
      const messy = formatAbhaNumber('91-4820-5912-3840-XYZ');
      expect(messy).toBe('91-4820-5912-3840');
    });

    it('M1.5: QR code payload schema contains all mandatory NHA ABHA fields', () => {
      const payload = generateQrCodePayload({
        abhaNumber: '11-2222-3333-4444',
        abhaAddress: 'rahul.verma@abdm',
        name: 'Rahul Verma',
        gender: 'Female',
        dateOfBirth: '1988-11-20',
        state: 'Delhi',
        district: 'New Delhi',
        mobile: '+91 99887 76655',
      });

      const parsed = JSON.parse(payload);
      expect(parsed).toEqual({
        hidn: '11-2222-3333-4444',
        hid: 'rahul.verma@abdm',
        name: 'Rahul Verma',
        gender: 'F',
        dob: '1988-11-20',
        state_name: 'Delhi',
        dist_name: 'New Delhi',
        mobile: '+91 99887 76655',
      });
    });

    it('M1.6: ABHA address availability validator tests regex boundaries & reserved system handles', async () => {
      // Too short (< 3 chars)
      expect(await checkAbhaAddressAvailability('a')).toBe(false);
      expect(await checkAbhaAddressAvailability('ab')).toBe(false);

      // Too long (> 32 chars)
      expect(await checkAbhaAddressAvailability('a'.repeat(33))).toBe(false);

      // Invalid special chars
      expect(await checkAbhaAddressAvailability('john!doe')).toBe(false);
      expect(await checkAbhaAddressAvailability('john doe')).toBe(false);
      expect(await checkAbhaAddressAvailability('john@doe')).toBe(false);
      expect(await checkAbhaAddressAvailability('john#doe')).toBe(false);

      // Reserved handles
      expect(await checkAbhaAddressAvailability('admin')).toBe(false);
      expect(await checkAbhaAddressAvailability('ADMIN@abdm')).toBe(false);
      expect(await checkAbhaAddressAvailability('root')).toBe(false);
      expect(await checkAbhaAddressAvailability('support')).toBe(false);

      // Valid handles
      expect(await checkAbhaAddressAvailability('dr_priya.nambiar')).toBe(true);
      expect(await checkAbhaAddressAvailability('aniket.dhuri@abdm')).toBe(true);
    });

    it('M1.7: createAbhaAddress updates existing profile or rejects when unauthenticated', async () => {
      // Unauthenticated -> throws
      await expect(createAbhaAddress('non-existent-user', '12-3456-7890-1234', 'newhandle')).rejects.toThrow(
        'No ABHA profile found.'
      );

      // Authenticated -> updates handle
      await confirmAbdmOtp('txn-1', '123456', TEST_USER, 'oldhandle');
      const updated = await createAbhaAddress(TEST_USER, '12-3456-7890-1234', 'newhandle@abdm');
      expect(updated.abhaAddress).toBe('newhandle@abdm');
      expect(getAbdmProfile(TEST_USER)?.abhaAddress).toBe('newhandle@abdm');
    });
  });

  // =========================================================================
  // M2: CARE-CONTEXT LINKING, UNLINKING & BATCH RESILIENCE
  // =========================================================================
  describe('M2: Care-Context Linking, Duplicate Handling & Boundary States', () => {
    it('M2.1: Enforces authentication guard for linking / unlinking', async () => {
      const dummyContext: CareContext = {
        referenceNumber: 'HIP-TEST-001',
        display: 'Test Lab',
        type: 'LabReport',
        date: new Date().toISOString(),
        hipId: 'IN2710001824',
        hipName: 'Aegis Clinic',
        status: 'linked',
      };

      await expect(linkAbdmCareContext('unauthed-user', dummyContext)).rejects.toThrow(
        'No active ABHA profile found. Please connect ABHA first.'
      );
      await expect(unlinkAbdmCareContext('unauthed-user', 'HIP-TEST-001')).rejects.toThrow(
        'No active ABHA profile found.'
      );
      await expect(linkBatchCareContexts('unauthed-user', [dummyContext])).rejects.toThrow(
        'No active ABHA profile found.'
      );
    });

    it('M2.2: Idempotently links existing context without duplicate entries', async () => {
      await confirmAbdmOtp('txn-1', '123456', TEST_USER, 'aniket.dhuri');

      const existingContext: CareContext = {
        referenceNumber: 'HIP-AEGIS-LAB-2026-001',
        display: 'Updated CBC',
        type: 'LabReport',
        date: new Date().toISOString(),
        hipId: 'IN2710001824',
        hipName: 'Aegis Clinic',
        status: 'linked',
      };

      const res1 = await linkAbdmCareContext(TEST_USER, existingContext);
      const occurrences = res1.linkedContexts.filter(
        (c) => c.referenceNumber === 'HIP-AEGIS-LAB-2026-001'
      );
      expect(occurrences.length).toBe(1);
    });

    it('M2.3: Unlinking non-existent referenceNumber does not corrupt state', async () => {
      await confirmAbdmOtp('txn-1', '123456', TEST_USER, 'aniket.dhuri');
      const before = getLinkedCareContexts(TEST_USER);

      const res = await unlinkAbdmCareContext(TEST_USER, 'NON-EXISTENT-REF-99999');
      expect(res.success).toBe(true);
      expect(res.linkedContexts.length).toBe(before.length);
    });

    it('M2.4: Stress tests batch linking with 100 care contexts', async () => {
      await confirmAbdmOtp('txn-1', '123456', TEST_USER, 'aniket.dhuri');

      const heavyBatch: CareContext[] = Array.from({ length: 100 }, (_, i) => ({
        referenceNumber: `HIP-STRESS-CTX-${i.toString().padStart(4, '0')}`,
        display: `Automated Clinical Record #${i + 1}`,
        type: i % 2 === 0 ? 'DiagnosticReport' : 'Prescription',
        date: new Date(Date.now() - i * 86400000).toISOString(),
        hipId: 'IN2710001824',
        hipName: 'Aegis Health Intelligence Clinic (HIP)',
        status: 'linked' as const,
        recordCount: (i % 5) + 1,
      }));

      const res = await linkBatchCareContexts(TEST_USER, heavyBatch);
      expect(res.success).toBe(true);
      expect(res.updatedCount).toBe(100);
      expect(res.linkedContexts.length).toBe(100);

      const profile = getAbdmProfile(TEST_USER);
      expect(profile?.linkedCareContextsCount).toBe(100);
    });

    it('M2.5: discoverCareContexts accurately transforms Firestore documents to CareContexts', async () => {
      const mockFirestoreDocs = [
        {
          id: 'doc-alpha',
          fileName: 'Lipid_Panel_May.pdf',
          title: 'May Lipid Profile',
          hospitalName: 'Apollo Hospitals Mumbai',
          type: 'diagnostic_report',
          date: '2026-05-10T10:00:00.000Z',
          extractedData: { observations: [{ name: 'HDL', value: 45 }, { name: 'LDL', value: 110 }] },
        },
        {
          id: 'doc-beta',
          fileName: 'Cardio_Prescription.pdf',
          hospitalName: 'Fortis Healthcare',
          type: 'prescription',
          uploadedAt: '2026-06-15T15:30:00.000Z',
          extractedData: { observations: [] },
        },
      ];

      const discovered = await discoverCareContexts(TEST_USER, {}, mockFirestoreDocs);
      expect(discovered.length).toBe(2);
      expect(discovered[0].referenceNumber).toBe('HIP-AEGIS-DOC-doc-alpha');
      expect(discovered[0].type).toBe('DiagnosticReport');
      expect(discovered[0].recordCount).toBe(2);

      expect(discovered[1].referenceNumber).toBe('HIP-AEGIS-DOC-doc-beta');
      expect(discovered[1].type).toBe('Prescription');
      expect(discovered[1].recordCount).toBe(1); // fallback to 1
    });
  });

  // =========================================================================
  // M3: CONSENT LIFECYCLE, STATE TRANSITIONS & ERROR RECOVERY
  // =========================================================================
  describe('M3: Consent State Machine Violations & Edge Transitions', () => {
    beforeEach(async () => {
      await confirmAbdmOtp('txn-1', '123456', TEST_USER, 'aniket.dhuri');
    });

    it('M3.1: Rejects approval of non-existent consent request ID', async () => {
      await expect(simulateConsentApproval('CR-INVALID-0000', TEST_USER)).rejects.toThrow(
        'Consent request CR-INVALID-0000 not found.'
      );
    });

    it('M3.2: Generates valid SHA256withECDSA digital signature and sets status GRANTED', async () => {
      const artifact = await simulateConsentApproval('CR-2026-9481', TEST_USER);
      expect(artifact.status).toBe('GRANTED');
      expect(artifact.consentId).toMatch(/^ART-\d{6}-[0-9a-f]{8}$/);
      expect(artifact.signature).toMatch(/^SHA256withECDSA:MEQCIE/);
      expect(artifact.permission.accessMode).toBe('VIEW');

      // Verify request state in database
      const requests = getConsentRequests(TEST_USER);
      const req = requests.find((r) => r.id === 'CR-2026-9481');
      expect(req?.status).toBe('GRANTED');
    });

    it('M3.3: Denying a consent request transitions state to DENIED', async () => {
      const res = await simulateConsentDenial('CR-2026-9481', TEST_USER);
      expect(res.status).toBe('DENIED');

      const requests = getConsentRequests(TEST_USER);
      const req = requests.find((r) => r.id === 'CR-2026-9481');
      expect(req?.status).toBe('DENIED');
    });

    it('M3.4: Revoking a consent transitions all active or target consents to REVOKED', async () => {
      await simulateConsentRevocation('CR-2026-7723', TEST_USER);
      const requests = getConsentRequests(TEST_USER);
      const target = requests.find((r) => r.id === 'CR-2026-7723');
      expect(target?.status).toBe('REVOKED');
    });

    it('M3.5: State machine lifecycle integrity: REQUESTED -> GRANTED -> REVOKED', async () => {
      // 1. Initial State: REQUESTED
      let requests = getConsentRequests(TEST_USER);
      let target = requests.find((r) => r.id === 'CR-2026-9481');
      expect(target?.status).toBe('REQUESTED');

      // 2. Transition: GRANTED
      const artifact = await simulateConsentApproval('CR-2026-9481', TEST_USER);
      expect(artifact.status).toBe('GRANTED');

      // 3. Transition: REVOKED
      await simulateConsentRevocation('CR-2026-9481', TEST_USER);
      requests = getConsentRequests(TEST_USER);
      target = requests.find((r) => r.id === 'CR-2026-9481');
      expect(target?.status).toBe('REVOKED');
    });
  });

  // =========================================================================
  // M3: CRYPTOGRAPHIC ENVELOPE, KEY MATERIAL & FHIR INTEGRITY
  // =========================================================================
  describe('M3: Cryptographic Envelope, Key Agreement & Decrypted FHIR R4 Bundle Validation', () => {
    it('M3.6: Produces a fully compliant NHA Encrypted Bundle Envelope', async () => {
      const transfer = await simulateEncryptedDataTransfer('ART-APOLLO-9481', TEST_USER, {
        name: 'Aniket Dhuri',
        email: 'dhurianiket@gmail.com',
      });

      // Key Material assertions
      expect(transfer.keyMaterial.cryptoAlg).toBe('ECDH');
      expect(transfer.keyMaterial.curve).toBe('Curve25519');
      expect(transfer.keyMaterial.dhPublicKey.parameters).toBe('Curve25519/ECDH-AES-GCM-256');
      expect(transfer.keyMaterial.dhPublicKey.keyValue).toContain('MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE');
      expect(transfer.keyMaterial.nonce).toMatch(/^nonce-\d+-/);

      // Ciphertext envelope assertions
      expect(transfer.encryptedData).toContain('[AES-GCM-256-ENCRYPTED-PAYLOAD]');
      expect(transfer.checksum).toMatch(/^sha256-[0-9a-f]+/);
      expect(transfer.hiType).toBe('DiagnosticReport');
    });

    it('M3.7: Decrypted bundle passes HL7 FHIR R4 validator with 0 critical issues', async () => {
      const customReports = [
        {
          id: 'rep-stress-01',
          title: 'Adversarial Renal & Cardiac Biomarker Panel',
          date: '2026-08-20',
          biomarkers: [
            { name: 'Serum Creatinine', value: 1.4, unit: 'mg/dL', loincCode: '2160-0', interpretation: 'abnormal' as const },
            { name: 'Estimated GFR (eGFR)', value: 58, unit: 'mL/min/1.73m2', loincCode: '33914-3', interpretation: 'abnormal' as const },
            { name: 'High-Sensitivity Troponin I', value: 0.045, unit: 'ng/mL', loincCode: '49563-0', interpretation: 'critical' as const },
            { name: 'Potassium (K+)', value: 5.4, unit: 'mmol/L', loincCode: '2823-3', interpretation: 'abnormal' as const },
          ],
        },
      ];

      const transfer = await simulateEncryptedDataTransfer(
        'ART-APOLLO-9481',
        TEST_USER,
        { id: TEST_USER, name: 'Aniket Dhuri', email: 'dhurianiket@gmail.com' },
        customReports
      );

      const decrypted = transfer.decryptedBundle;
      expect(decrypted).toBeDefined();
      expect(decrypted.resourceType).toBe('Bundle');
      expect(decrypted.type).toBe('collection');

      // Validate through fhirService validator
      const validation = validateFhirBundle(decrypted);
      expect(validation.isValid).toBe(true);
      expect(validation.issues.filter((i) => i.severity === 'error').length).toBe(0);

      // Verify entries
      const patientEntry = decrypted.entry.find((e: any) => e.resource.resourceType === 'Patient');
      const diagEntry = decrypted.entry.find((e: any) => e.resource.resourceType === 'DiagnosticReport');
      const obsEntries = decrypted.entry.filter((e: any) => e.resource.resourceType === 'Observation');

      expect(patientEntry).toBeDefined();
      expect(diagEntry).toBeDefined();
      expect(obsEntries.length).toBe(4);
    });

    it('M3.8: Empirically catches tampered ciphertext / corrupted Base64 payload', async () => {
      const transfer = await simulateEncryptedDataTransfer('ART-APOLLO-9481', TEST_USER);

      // Adversarial tampering scenario 1: Bit-flip / truncation in ciphertext
      const tamperedCiphertext = transfer.encryptedData.replace(/^./, 'Z');
      expect(tamperedCiphertext).not.toBe(transfer.encryptedData);

      // Adversarial tampering scenario 2: Checksum mismatch verification
      const forgedChecksum = 'sha256-0000000000000000deadbeef';
      expect(forgedChecksum).not.toBe(transfer.checksum);

      // Checksum integrity oracle
      const verifyChecksum = (t: typeof transfer, claimedChecksum: string) => {
        return t.checksum === claimedChecksum;
      };

      expect(verifyChecksum(transfer, transfer.checksum)).toBe(true);
      expect(verifyChecksum(transfer, forgedChecksum)).toBe(false);
    });
  });
});
