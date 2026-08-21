import { describe, it, expect } from 'vitest';
import { generateScanAndShareQrPayload, AbhaProfile } from '../abdmService';
import { INDIAN_LANGUAGES, regionalVoiceService } from '../ai/regionalVoiceService';
import { getSnomedCoding, SNOMED_DICTIONARY, mapToSnomedCodeableConcepts } from '../snomedService';
import { exportToFhirBundle } from '../fhirService';

describe('Pillar 1: ABDM OPD Counter Scan & Share Subsystem', () => {
  it('should generate NHA ABDM M1 compliant OPD Scan & Share JSON payload', () => {
    const mockProfile: AbhaProfile = {
      abhaNumber: '91-9988-7766-5544',
      abhaAddress: 'aniket.dhuri@abdm',
      name: 'Aniket Dhuri',
      gender: 'Male',
      dateOfBirth: '1995-05-15',
      mobile: '+919876543210',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421201',
      status: 'verified',
      linkedCareContextsCount: 3,
      createdAt: new Date().toISOString(),
    };

    const rawPayload = generateScanAndShareQrPayload(mockProfile);
    expect(rawPayload).toBeDefined();

    const parsed = JSON.parse(rawPayload);
    expect(parsed.action).toBe('ABDM_SCAN_AND_SHARE');
    expect(parsed.hidn).toBe('91-9988-7766-5544');
    expect(parsed.phrAddress).toBe('aniket.dhuri@abdm');
    expect(parsed.name).toBe('Aniket Dhuri');
    expect(parsed.gender).toBe('M');
    expect(parsed.state).toBe('Maharashtra');
    expect(parsed.hipId).toBe('IN2710001824');
  });
});

describe('Pillar 1: 10+ Indian Language Audio Narration Service', () => {
  it('should register all 10 Indian regional languages with BCP-47 tags', () => {
    const langs = regionalVoiceService.getAvailableLanguages();
    expect(langs.length).toBe(10);

    const codes = langs.map((l) => l.code);
    expect(codes).toContain('en-IN');
    expect(codes).toContain('hi-IN');
    expect(codes).toContain('mr-IN');
    expect(codes).toContain('gu-IN');
    expect(codes).toContain('bn-IN');
    expect(codes).toContain('ta-IN');
    expect(codes).toContain('te-IN');
    expect(codes).toContain('kn-IN');
    expect(codes).toContain('ml-IN');
    expect(codes).toContain('pa-IN');
  });
});

describe('Pillar 1: SNOMED CT Clinical Terminology & Dual LOINC FHIR Exporter', () => {
  it('should resolve canonical SNOMED CT concept codes for common clinical terms', () => {
    const diabetesCoding = getSnomedCoding('diabetes_t2');
    expect(diabetesCoding.system).toBe('http://snomed.info/sct');
    expect(diabetesCoding.code).toBe('44054006');
    expect(diabetesCoding.display).toContain('Type 2 diabetes');

    const hba1cCoding = getSnomedCoding('hba1c');
    expect(hba1cCoding.code).toBe('43150009');
  });

  it('should produce FHIR Observation resources with dual LOINC + SNOMED CT codings', () => {
    const mockPatient = { id: 'p-101', name: 'Aniket Dhuri' };
    const mockLabs = [
      {
        id: 'lab-1',
        name: 'HbA1c',
        value: 6.8,
        unit: '%',
        category: 'laboratory',
      },
    ];

    const bundle = exportToFhirBundle(mockPatient, mockLabs, 'SBAR clinical summary');
    expect(bundle.resourceType).toBe('Bundle');

    const obsEntry = bundle.entry.find((e) => e.resource.resourceType === 'Observation');
    expect(obsEntry).toBeDefined();

    const obs = obsEntry!.resource as any;
    expect(obs.code.coding.length).toBeGreaterThanOrEqual(2);

    const loincCoding = obs.code.coding.find((c: any) => c.system === 'http://loinc.org');
    const snomedCoding = obs.code.coding.find((c: any) => c.system === 'http://snomed.info/sct');

    expect(loincCoding).toBeDefined();
    expect(loincCoding.code).toBe('4548-4');

    expect(snomedCoding).toBeDefined();
    expect(snomedCoding.code).toBe('43150009');
  });
});
