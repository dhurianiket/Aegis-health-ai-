import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateAge,
  isMinor,
  createPaediatricConsent,
  validatePaediatricConsent,
  request72HourErasure,
  getPaediatricSafetyNotice,
} from '../dpdpPaediatricService';
import { runSafetyCheck } from '../ai/safetyGuardrail';
import { UserProfile } from '../../types/medical';

describe('DPDP Act 2023 Section 9 Paediatric Privacy Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Age Calculation & Minor Determination', () => {
    it('should calculate age correctly for adults and minors', () => {
      // Minor: birth date 10 years ago
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const minorDob = tenYearsAgo.toISOString().split('T')[0];

      expect(calculateAge(minorDob)).toBe(10);
      expect(isMinor(minorDob)).toBe(true);

      // Adult: birth date 30 years ago
      const thirtyYearsAgo = new Date();
      thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
      const adultDob = thirtyYearsAgo.toISOString().split('T')[0];

      expect(calculateAge(adultDob)).toBe(30);
      expect(isMinor(adultDob)).toBe(false);
    });

    it('should return null and false for invalid or missing DOB', () => {
      expect(calculateAge(undefined)).toBeNull();
      expect(calculateAge('')).toBeNull();
      expect(calculateAge('invalid-date')).toBeNull();
      expect(isMinor(undefined)).toBe(false);
      expect(isMinor('invalid-date')).toBe(false);
    });

    it('should accurately handle boundary 18th birthday', () => {
      // Exactly 17 years and 364 days (minor)
      const almost18 = new Date();
      almost18.setFullYear(almost18.getFullYear() - 18);
      almost18.setDate(almost18.getDate() + 1); // 1 day before 18th birthday
      expect(isMinor(almost18.toISOString().split('T')[0])).toBe(true);

      // Exactly 18 years ago today (adult)
      const exactly18 = new Date();
      exactly18.setFullYear(exactly18.getFullYear() - 18);
      expect(isMinor(exactly18.toISOString().split('T')[0])).toBe(false);
    });
  });

  describe('2. Verifiable Guardian Consent Creation', () => {
    it('should create immutable DPDP Section 9 consent with strict defaults', () => {
      const consent = createPaediatricConsent(
        'Ramesh Sharma',
        'Parent',
        'Aarav Sharma',
        '2015-06-10'
      );

      expect(consent.isMinor).toBe(true);
      expect(consent.guardianName).toBe('Ramesh Sharma');
      expect(consent.guardianRelationship).toBe('Parent');
      expect(consent.guardianConsentGiven).toBe(true);
      expect(consent.strictNoAiTraining).toBe(true);
      expect(consent.noBehavioralTracking).toBe(true);
      expect(consent.dataRetentionPolicy).toBe('72h_erasure_on_demand');
      expect(consent.guardianConsentId).toMatch(/^DPDP-SEC9-/);
    });
  });

  describe('3. Statutory Compliance Validation', () => {
    it('should pass validation for adult profiles without requiring guardian consent', () => {
      const adultProfile: Partial<UserProfile> = {
        dob: '1990-01-01',
        fullName: 'Adult Patient',
      };
      const result = validatePaediatricConsent(adultProfile);
      expect(result.isValid).toBe(true);
      expect(result.requiresGuardianConsent).toBe(false);
    });

    it('should fail validation for minor profiles missing guardian consent', () => {
      const minorProfile: Partial<UserProfile> = {
        dob: '2016-04-12',
        fullName: 'Child Patient',
      };
      const result = validatePaediatricConsent(minorProfile);
      expect(result.isValid).toBe(false);
      expect(result.requiresGuardianConsent).toBe(true);
      expect(result.error).toContain('DPDP Act 2023 Section 9');
    });

    it('should fail validation if guardian name is blank', () => {
      const minorProfile: Partial<UserProfile> = {
        dob: '2016-04-12',
        fullName: 'Child Patient',
        paediatricConsent: {
          isMinor: true,
          guardianName: ' ',
          guardianRelationship: 'Parent',
          guardianConsentGiven: true,
          strictNoAiTraining: true,
          noBehavioralTracking: true,
          dataRetentionPolicy: '72h_erasure_on_demand',
        },
      };
      const result = validatePaediatricConsent(minorProfile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Guardian full name is required');
    });

    it('should pass validation when valid parental consent is attached', () => {
      const minorProfile: Partial<UserProfile> = {
        dob: '2016-04-12',
        fullName: 'Child Patient',
        paediatricConsent: createPaediatricConsent(
          'Sunita Sharma',
          'Lawful Guardian',
          'Child Patient',
          '2016-04-12'
        ),
      };
      const result = validatePaediatricConsent(minorProfile);
      expect(result.isValid).toBe(true);
      expect(result.requiresGuardianConsent).toBe(true);
    });
  });

  describe('4. 72-Hour Hard-Erasure SLA', () => {
    it('should schedule erasure exactly 72 hours from request and store audit log', async () => {
      const beforeTime = Date.now();
      const result = await request72HourErasure('user-123', 'profile-child-456');

      expect(result.success).toBe(true);
      expect(result.receiptId).toMatch(/^ERASE-DPDP-/);

      const scheduledTime = new Date(result.scheduledEraseAt).getTime();
      const diffHours = (scheduledTime - beforeTime) / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(72, 0.1);

      // Verify local storage audit log
      const auditLog = JSON.parse(
        localStorage.getItem('aegis_dpdp_erasure_requests_user-123') || '[]'
      );
      expect(auditLog.length).toBe(1);
      expect(auditLog[0].receiptId).toBe(result.receiptId);
      expect(auditLog[0].status).toBe('PENDING_SCHEDULED_PURGE');
    });
  });

  describe('5. Safety Guardrail Paediatric Disclaimers', () => {
    it('should append DPDP Act 2023 paediatric safety notice when isMinor is true', () => {
      const text = 'Recommended daily dose of Vitamin D3 is 400 IU. Consult your physician.';
      const result = runSafetyCheck(text, { isMinor: true });

      expect(result.modifiedContent).toContain('PAEDIATRIC SAFETY NOTICE (DPDP Act 2023 Sec 9)');
      expect(result.modifiedContent).toContain('Paediatric reference ranges and dosages vary strictly by age and weight');
    });

    it('should not duplicate paediatric notice if already mentioned', () => {
      const text = 'Paediatric guidance from doctor. Consult your physician.';
      const result = runSafetyCheck(text, { isMinor: true });

      expect(result.modifiedContent).not.toContain('PAEDIATRIC SAFETY NOTICE (DPDP Act 2023 Sec 9)');
    });

    it('should return statutory safety notice string', () => {
      const notice = getPaediatricSafetyNotice();
      expect(notice).toContain('DPDP Act 2023 Protected');
      expect(notice).toContain('72-hour right-to-erasure SLA');
    });
  });
});
