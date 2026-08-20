/**
 * fhir.ts — HL7 FHIR R4 Type Definitions for Aegis Health AI
 * Standardized schema definitions for HL7 FHIR R4 resources including
 * Patient, Observation, DiagnosticReport, DocumentReference, and Bundle.
 * Compliant with HL7 FHIR R4 and ABDM (Ayushman Bharat Digital Mission) FHIR profiles.
 */

export type FhirBundleType =
  | 'document'
  | 'message'
  | 'transaction'
  | 'transaction-response'
  | 'batch'
  | 'batch-response'
  | 'history'
  | 'searchset'
  | 'collection';

export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: FhirCoding[];
  tag?: FhirCoding[];
}

export interface FhirCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: FhirCodeableConcept;
  system?: string;
  value?: string;
  period?: { start?: string; end?: string };
  assigner?: FhirReference;
}

export interface FhirReference {
  reference?: string;
  type?: string;
  identifier?: FhirIdentifier;
  display?: string;
}

export interface FhirHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FhirContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
}

export interface FhirAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FhirQuantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string; // e.g. 'http://unitsofmeasure.org'
  code?: string;   // UCUM code
}

export interface FhirObservationReferenceRange {
  low?: FhirQuantity;
  high?: FhirQuantity;
  type?: FhirCodeableConcept;
  appliesTo?: FhirCodeableConcept[];
  age?: { low?: FhirQuantity; high?: FhirQuantity };
  text?: string;
}

export interface FhirObservationComponent {
  code: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: { low?: FhirQuantity; high?: FhirQuantity };
  valueRatio?: { numerator?: FhirQuantity; denominator?: FhirQuantity };
  dataAbsentReason?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  referenceRange?: FhirObservationReferenceRange[];
}

export interface FhirAttachment {
  contentType?: string;
  language?: string;
  data?: string; // Base64 encoded
  url?: string;
  size?: number;
  hash?: string; // Base64 SHA-1
  title?: string;
  creation?: string;
}

export interface FhirResource {
  resourceType: string;
  id: string;
  meta?: FhirMeta;
  implicitRules?: string;
  language?: string;
  text?: {
    status: 'generated' | 'extensions' | 'additional' | 'empty';
    div: string;
  };
  [key: string]: any;
}

export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string; // YYYY, YYYY-MM, or YYYY-MM-DD
  address?: FhirAddress[];
  maritalStatus?: FhirCodeableConcept;
  communication?: Array<{
    language: FhirCodeableConcept;
    preferred?: boolean;
  }>;
  generalPractitioner?: FhirReference[];
  managingOrganization?: FhirReference;
}

export interface FhirObservation extends FhirResource {
  resourceType: 'Observation';
  identifier?: FhirIdentifier[];
  basedOn?: FhirReference[];
  partOf?: FhirReference[];
  status:
    | 'registered'
    | 'preliminary'
    | 'final'
    | 'amended'
    | 'corrected'
    | 'cancelled'
    | 'entered-in-error'
    | 'unknown';
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  focus?: FhirReference[];
  encounter?: FhirReference;
  effectiveDateTime?: string;
  effectivePeriod?: { start?: string; end?: string };
  issued?: string;
  performer?: FhirReference[];
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: { low?: FhirQuantity; high?: FhirQuantity };
  valueRatio?: { numerator?: FhirQuantity; denominator?: FhirQuantity };
  dataAbsentReason?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  note?: Array<{ authorString?: string; time?: string; text: string }>;
  bodySite?: FhirCodeableConcept;
  method?: FhirCodeableConcept;
  specimen?: FhirReference;
  device?: FhirReference;
  referenceRange?: FhirObservationReferenceRange[];
  hasMember?: FhirReference[];
  derivedFrom?: FhirReference[];
  component?: FhirObservationComponent[];
}

export interface FhirDiagnosticReport extends FhirResource {
  resourceType: 'DiagnosticReport';
  identifier?: FhirIdentifier[];
  basedOn?: FhirReference[];
  status:
    | 'registered'
    | 'partial'
    | 'preliminary'
    | 'final'
    | 'amended'
    | 'corrected'
    | 'appended'
    | 'cancelled'
    | 'entered-in-error'
    | 'unknown';
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime?: string;
  effectivePeriod?: { start?: string; end?: string };
  issued?: string;
  performer?: FhirReference[];
  resultsInterpreter?: FhirReference[];
  specimen?: FhirReference[];
  result?: FhirReference[];
  imagingStudy?: FhirReference[];
  media?: Array<{
    comment?: string;
    link: FhirReference;
  }>;
  conclusion?: string;
  conclusionCode?: FhirCodeableConcept[];
  presentedForm?: FhirAttachment[];
}

export interface FhirDocumentReferenceContent {
  attachment: FhirAttachment;
  format?: FhirCoding;
}

export interface FhirDocumentReferenceContext {
  encounter?: FhirReference[];
  event?: FhirCodeableConcept[];
  period?: { start?: string; end?: string };
  facilityType?: FhirCodeableConcept;
  practiceSetting?: FhirCodeableConcept;
  sourcePatientInfo?: FhirReference;
  related?: FhirReference[];
}

export interface FhirDocumentReference extends FhirResource {
  resourceType: 'DocumentReference';
  masterIdentifier?: FhirIdentifier;
  identifier?: FhirIdentifier[];
  status: 'current' | 'superseded' | 'entered-in-error';
  docStatus?: 'preliminary' | 'final' | 'amended' | 'entered-in-error';
  type?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  subject?: FhirReference;
  date?: string;
  author?: FhirReference[];
  authenticator?: FhirReference;
  custodian?: FhirReference;
  relatesTo?: Array<{
    code: 'replaces' | 'transforms' | 'signs' | 'appends';
    target: FhirReference;
  }>;
  description?: string;
  securityLabel?: FhirCodeableConcept[];
  content: FhirDocumentReferenceContent[];
  context?: FhirDocumentReferenceContext;
}

export interface FhirBundleEntry<T extends FhirResource = FhirResource> {
  link?: Array<{ relation: string; url: string }>;
  fullUrl?: string;
  resource: T;
  search?: {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
  };
  request?: {
    method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    ifNoneMatch?: string;
    ifMatch?: string;
    ifNoneExist?: string;
  };
  response?: {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
    outcome?: FhirResource;
  };
}

export interface FhirBundle extends FhirResource {
  resourceType: 'Bundle';
  identifier?: FhirIdentifier;
  type: FhirBundleType;
  timestamp?: string;
  total?: number;
  link?: Array<{ relation: string; url: string }>;
  entry: FhirBundleEntry[];
  signature?: {
    type: FhirCoding[];
    when: string;
    who: FhirReference;
    onBehalfOf?: FhirReference;
    targetFormat?: string;
    sigFormat?: string;
    data?: string;
  };
}

export interface FhirValidationIssue {
  severity: 'error' | 'warning' | 'information';
  code: string;
  diagnostics: string;
  location?: string[];
}

export interface FhirValidationResult {
  isValid: boolean;
  resourceCount: number;
  resourceTypes: Record<string, number>;
  issues: FhirValidationIssue[];
  validatedAt: string;
}
