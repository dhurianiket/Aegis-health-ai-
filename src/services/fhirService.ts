/**
 * fhirService.ts — HL7 FHIR R4 Standardized Exporter & Schema Mappings
 * Converts internal patient profiles, lab reports, and biomarker telemetry into valid FHIR R4 JSON bundles.
 */

export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    profile?: string[];
    lastUpdated?: string;
  };
  [key: string]: any;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'collection' | 'transaction' | 'document';
  entry: Array<{
    fullUrl: string;
    resource: FHIRResource;
  }>;
}

/**
 * Maps a patient profile entity to a FHIR R4 Patient Resource
 */
export function convertToFHIRPatient(profile: {
  id?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
}): FHIRResource {
  const patientId = profile.id || `patient-${Date.now()}`;
  return {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient'],
      lastUpdated: new Date().toISOString(),
    },
    active: true,
    name: [
      {
        use: 'official',
        text: profile.name || 'Anonymous Patient',
      },
    ],
    gender: (profile.gender || 'unknown').toLowerCase(),
    birthDate: profile.birthDate || '1990-01-01',
    telecom: [
      ...(profile.email ? [{ system: 'email', value: profile.email, use: 'home' }] : []),
      ...(profile.phone ? [{ system: 'phone', value: profile.phone, use: 'mobile' }] : []),
    ],
  };
}

/**
 * Maps a lab report observation into a FHIR R4 Observation Resource
 */
export function convertToFHIRObservation(
  biomarker: {
    name: string;
    value: number | string;
    unit?: string;
    referenceRange?: string;
    category?: string;
    loincCode?: string;
    interpretation?: 'normal' | 'abnormal' | 'critical';
  },
  patientId: string
): FHIRResource {
  const obsId = `obs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    resourceType: 'Observation',
    id: obsId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation'],
      lastUpdated: new Date().toISOString(),
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: biomarker.category || 'laboratory',
            display: 'Laboratory',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: biomarker.loincCode || '29463-7',
          display: biomarker.name,
        },
      ],
      text: biomarker.name,
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    effectiveDateTime: new Date().toISOString(),
    valueQuantity: typeof biomarker.value === 'number'
      ? {
          value: biomarker.value,
          unit: biomarker.unit || '',
          system: 'http://unitsofmeasure.org',
        }
      : undefined,
    valueString: typeof biomarker.value === 'string' ? biomarker.value : undefined,
    interpretation: biomarker.interpretation
      ? [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: biomarker.interpretation === 'normal' ? 'N' : biomarker.interpretation === 'critical' ? 'AA' : 'A',
                display: biomarker.interpretation.toUpperCase(),
              },
            ],
          },
        ]
      : undefined,
  };
}

/**
 * Maps a lab report entity to a FHIR R4 DiagnosticReport Resource Bundle
 */
export function convertReportToFHIRBundle(
  report: {
    id: string;
    title: string;
    date: string;
    category?: string;
    biomarkers?: Array<{
      name: string;
      value: number | string;
      unit?: string;
      referenceRange?: string;
      category?: string;
      loincCode?: string;
      interpretation?: 'normal' | 'abnormal' | 'critical';
    }>;
    summary?: string;
  },
  patient: { id?: string; name?: string; email?: string }
): FHIRBundle {
  const patientResource = convertToFHIRPatient(patient);
  const patientId = patientResource.id;

  const observations = (report.biomarkers || []).map((b) =>
    convertToFHIRObservation(b, patientId)
  );

  const diagnosticReport: FHIRResource = {
    resourceType: 'DiagnosticReport',
    id: `diag-${report.id}`,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord'],
      lastUpdated: new Date().toISOString(),
    },
    status: 'final',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11502-2',
          display: 'Laboratory report',
        },
      ],
      text: report.title,
    },
    subject: {
      reference: `Patient/${patientId}`,
    },
    effectiveDateTime: report.date || new Date().toISOString(),
    result: observations.map((obs) => ({
      reference: `Observation/${obs.id}`,
      display: obs.code.text,
    })),
    conclusion: report.summary || 'Clinical lab panel processed by Aegis Health AI.',
  };

  const entries = [
    {
      fullUrl: `urn:uuid:${patientResource.id}`,
      resource: patientResource,
    },
    {
      fullUrl: `urn:uuid:${diagnosticReport.id}`,
      resource: diagnosticReport,
    },
    ...observations.map((obs) => ({
      fullUrl: `urn:uuid:${obs.id}`,
      resource: obs,
    })),
  ];

  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: entries,
  };
}

/**
 * Triggers a client-side JSON file download of a FHIR R4 Bundle
 */
export function downloadFHIRBundle(bundle: FHIRBundle, filename: string = 'fhir_report_bundle.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
