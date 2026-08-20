import { describe, it, expect } from 'vitest';
import {
  convertToFHIRPatient,
  convertToFHIRObservation,
  convertReportToFHIRBundle,
} from '../fhirService';
import {
  confirmAbdmOtp,
  linkAbdmCareContext,
  getAbdmProfile,
} from '../abdmService';

describe('FHIR R4 & ABDM Service Suite', () => {
  it('1. Converts patient entity to valid FHIR R4 Patient resource', () => {
    const patient = convertToFHIRPatient({
      id: 'user-777',
      name: 'Aniket Dhuri',
      email: 'dhurianiket@gmail.com',
      gender: 'male',
      birthDate: '1992-05-15',
    });

    expect(patient.resourceType).toBe('Patient');
    expect(patient.id).toBe('user-777');
    expect(patient.name[0].text).toBe('Aniket Dhuri');
    expect(patient.telecom[0].value).toBe('dhurianiket@gmail.com');
  });

  it('2. Converts lab biomarker into valid FHIR R4 Observation resource', () => {
    const obs = convertToFHIRObservation(
      {
        name: 'HbA1c (Glycated Hemoglobin)',
        value: 6.8,
        unit: '%',
        loincCode: '4548-4',
        interpretation: 'abnormal',
      },
      'patient-123'
    );

    expect(obs.resourceType).toBe('Observation');
    expect(obs.code.coding[0].code).toBe('4548-4');
    expect(obs.valueQuantity.value).toBe(6.8);
    expect(obs.interpretation[0].coding[0].code).toBe('A');
  });

  it('3. Generates complete FHIR R4 Bundle from lab report', () => {
    const bundle = convertReportToFHIRBundle(
      {
        id: 'rep-999',
        title: 'Comprehensive Metabolic Panel',
        date: '2026-08-20',
        biomarkers: [
          { name: 'Fasting Blood Glucose', value: 110, unit: 'mg/dL', loincCode: '2345-7' },
          { name: 'Serum Creatinine', value: 0.9, unit: 'mg/dL', loincCode: '2160-0' },
        ],
      },
      { id: 'user-777', name: 'Aniket Dhuri' }
    );

    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.entry.length).toBe(4); // Patient + DiagnosticReport + 2 Observations
    expect(bundle.entry[1].resource.resourceType).toBe('DiagnosticReport');
  });

  it('4. Confirms ABDM OTP and persists ABHA Profile', async () => {
    const profile = await confirmAbdmOtp('txn-123', '123456', 'test-user-99', 'aniket.test');

    expect(profile.abhaAddress).toBe('aniket.test@abdm');
    expect(profile.abhaNumber).toMatch(/^\d{2}-\d{4}-\d{4}-\d{4}$/);
    expect(profile.status).toBe('linked');

    const retrieved = getAbdmProfile('test-user-99');
    expect(retrieved?.abhaAddress).toBe('aniket.test@abdm');
  });

  it('5. Links new Care Context to active ABHA profile', async () => {
    await confirmAbdmOtp('txn-123', '123456', 'test-user-link', 'link.test');

    const res = await linkAbdmCareContext('test-user-link', {
      referenceNumber: 'REF-101',
      display: 'Lipid Panel',
      type: 'LabReport',
      date: '2026-08-20',
    });

    expect(res.success).toBe(true);
    expect(res.updatedCount).toBe(4);
  });
});
