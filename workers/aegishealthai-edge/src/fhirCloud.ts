import { isPlainObject } from "./payloadSecurity";

export const ALLOWED_FHIR_RESOURCE_TYPES = new Set([
  "Patient",
  "Observation",
  "DiagnosticReport",
  "DocumentReference",
  "MedicationStatement",
  "Condition",
  "AllergyIntolerance",
]);

export const MAX_FHIR_BUNDLE_ENTRIES = 150;
const SEGMENT_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;
const FHIR_DATE_PATTERN = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const FHIR_INSTANT_OR_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

const RESOURCE_ORDER: Record<string, number> = {
  Patient: 0,
  Observation: 1,
  MedicationStatement: 1,
  Condition: 1,
  AllergyIntolerance: 1,
  DiagnosticReport: 2,
  DocumentReference: 3,
};

export interface PreparedFhirTransaction {
  transactionBundle: {
    resourceType: "Bundle";
    type: "transaction";
    entry: Array<{
      fullUrl: string;
      resource: Record<string, unknown>;
      request: { method: "PUT"; url: string };
    }>;
  };
  patientId: string;
  resourceCount: number;
  resourceTypes: Record<string, number>;
}

/**
 * Derives an irreversible, FHIR-ID-safe per-user tenant prefix from a Firebase UID.
 */
export async function deriveFhirTenantPrefix(uid: string): Promise<string> {
  const normalized = uid.trim();
  if (!normalized) {
    throw new Error("Authenticated user UID is required for FHIR tenant scoping");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < 8; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return `u-${hex}`;
}

/**
 * Builds the Cloud Healthcare API v1 FHIR R4 base URL after validating every path segment.
 */
export function buildHealthcareFhirBaseUrl(
  projectId: string,
  location: string,
  datasetId: string,
  fhirStoreId: string,
): string {
  const parts = [projectId, location, datasetId, fhirStoreId];
  for (const part of parts) {
    if (!SEGMENT_PATTERN.test(part)) {
      throw new Error("Invalid Cloud Healthcare configuration identifier");
    }
  }
  return `https://healthcare.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}/datasets/${encodeURIComponent(datasetId)}/fhirStores/${encodeURIComponent(fhirStoreId)}/fhir`;
}

function sanitizeFhirIdSuffix(rawId: unknown, fallback: string, index: number): string {
  const candidate = typeof rawId === "string" ? rawId.trim() : "";
  const cleaned = candidate.replace(/[^A-Za-z0-9-.]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const suffix = cleaned || `${fallback.toLowerCase()}-${index}`;
  return suffix.slice(0, 44);
}

function buildScopedResourceId(tenantPrefix: string, rawId: unknown, resourceType: string, index: number): string {
  if (resourceType === "Patient") {
    return `${tenantPrefix}-self`;
  }
  const suffix = sanitizeFhirIdSuffix(rawId, resourceType, index);
  const full = suffix.startsWith(`${tenantPrefix}-`) ? suffix : `${tenantPrefix}-${suffix}`;
  return full.slice(0, 64);
}

function normalizeFhirInstant(raw: unknown): string {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00:00Z`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(trimmed)) {
      return trimmed.includes(":") && trimmed.split(":").length === 2 ? `${trimmed}:00Z` : `${trimmed}Z`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return new Date().toISOString();
}

function normalizeFhirDateTime(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (FHIR_DATE_PATTERN.test(trimmed)) return trimmed;
  if (FHIR_INSTANT_OR_DATETIME_PATTERN.test(trimmed)) {
    if (trimmed.includes("T") && !/(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
      return trimmed.split(":").length === 2 ? `${trimmed}:00Z` : `${trimmed}Z`;
    }
    return trimmed;
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

function pruneFhirValue(value: unknown, depth: number = 0): unknown {
  if (depth > 16 || value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const items: unknown[] = [];
    for (const item of value) {
      const cleaned = pruneFhirValue(item, depth + 1);
      if (cleaned !== undefined) items.push(cleaned);
    }
    return items.length > 0 ? items : undefined;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const cleaned = pruneFhirValue(val, depth + 1);
      if (cleaned !== undefined) {
        out[key] = cleaned;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return undefined;
}

function extractRawObservationId(reference: unknown): string | null {
  if (typeof reference !== "string") return null;
  const trimmed = reference.trim();
  if (trimmed.startsWith("Observation/")) {
    return trimmed.slice("Observation/".length);
  }
  if (trimmed.startsWith("urn:uuid:")) {
    return trimmed.slice("urn:uuid:".length);
  }
  return null;
}

/**
 * Normalizes a client-generated FHIR R4 Bundle into an idempotent, tenant-scoped transaction Bundle.
 * All resource IDs and subject/patient references are pinned to the authenticated user's hash prefix.
 */
export async function prepareTenantTransactionBundle(
  rawBundle: unknown,
  uid: string,
): Promise<{ ok: true; data: PreparedFhirTransaction } | { ok: false; error: string }> {
  if (!isPlainObject(rawBundle) || rawBundle.resourceType !== "Bundle") {
    return { ok: false, error: "Payload must be a FHIR R4 Bundle resource" };
  }
  if (!Array.isArray(rawBundle.entry) || rawBundle.entry.length === 0) {
    return { ok: false, error: "FHIR Bundle must contain at least one entry" };
  }
  if (rawBundle.entry.length > MAX_FHIR_BUNDLE_ENTRIES) {
    return { ok: false, error: `FHIR Bundle exceeds maximum of ${MAX_FHIR_BUNDLE_ENTRIES} entries` };
  }

  const tenantPrefix = await deriveFhirTenantPrefix(uid);
  const patientId = `${tenantPrefix}-self`;
  const patientRef = `Patient/${patientId}`;

  // First pass: validate resource types and establish deterministic scoped IDs.
  const seenIds = new Map<string, number>();
  const observationIdMap = new Map<string, string>();
  const rawResources: Array<{
    resourceType: string;
    scopedId: string;
    rawResource: Record<string, unknown>;
  }> = [];

  for (let i = 0; i < rawBundle.entry.length; i++) {
    const rawEntry = rawBundle.entry[i];
    if (!isPlainObject(rawEntry) || !isPlainObject(rawEntry.resource)) {
      return { ok: false, error: `Bundle entry[${i}] is missing a valid resource object` };
    }
    const res = rawEntry.resource;
    const resourceType = typeof res.resourceType === "string" ? res.resourceType.trim() : "";
    if (!ALLOWED_FHIR_RESOURCE_TYPES.has(resourceType)) {
      return {
        ok: false,
        error: `Unsupported FHIR resourceType "${resourceType || "unknown"}" at entry[${i}]`,
      };
    }

    const originalId = typeof res.id === "string" ? res.id.trim() : "";
    let scopedId = buildScopedResourceId(tenantPrefix, originalId, resourceType, i);

    if (resourceType !== "Patient") {
      const key = `${resourceType}/${scopedId}`;
      const count = (seenIds.get(key) || 0) + 1;
      seenIds.set(key, count);
      if (count > 1) {
        scopedId = `${scopedId.slice(0, 56)}-${count}`;
      }
      if (resourceType === "Observation" && originalId) {
        observationIdMap.set(originalId, scopedId);
      }
    }

    rawResources.push({ resourceType, scopedId, rawResource: res });
  }

  // Deduplicate Patient to one authoritative resource pinned to ${tenantPrefix}-self,
  // or synthesize a minimal Patient resource so referential integrity holds.
  let hasPatient = false;
  const preparedEntries: Array<{
    order: number;
    entry: {
      fullUrl: string;
      resource: Record<string, unknown>;
      request: { method: "PUT"; url: string };
    };
    resourceType: string;
  }> = [];

  for (const item of rawResources) {
    if (item.resourceType === "Patient" && hasPatient) {
      continue;
    }
    if (item.resourceType === "Patient") {
      hasPatient = true;
    }

    const cleaned = pruneFhirValue(item.rawResource);
    if (!isPlainObject(cleaned)) {
      return { ok: false, error: `Invalid ${item.resourceType} resource content` };
    }

    cleaned.id = item.scopedId;
    cleaned.resourceType = item.resourceType;

    // Strip client meta.lastUpdated so Cloud Healthcare manages versioning/timestamps.
    if (isPlainObject(cleaned.meta)) {
      const metaCopy: Record<string, unknown> = { ...cleaned.meta };
      delete metaCopy.lastUpdated;
      if (Object.keys(metaCopy).length > 0) {
        cleaned.meta = metaCopy;
      } else {
        delete cleaned.meta;
      }
    }

    if (item.resourceType === "Patient") {
      if (typeof cleaned.birthDate === "string" && !FHIR_DATE_PATTERN.test(cleaned.birthDate)) {
        delete cleaned.birthDate;
      }
    } else if (item.resourceType === "AllergyIntolerance") {
      cleaned.patient = { reference: patientRef };
    } else {
      cleaned.subject = { reference: patientRef };
    }

    if (item.resourceType === "Observation") {
      const normDate = normalizeFhirDateTime(cleaned.effectiveDateTime);
      if (normDate) {
        cleaned.effectiveDateTime = normDate;
      } else {
        delete cleaned.effectiveDateTime;
      }
      if (!cleaned.status) cleaned.status = "final";
    }

    if (item.resourceType === "DiagnosticReport") {
      if (!cleaned.status) cleaned.status = "final";
      const normDate = normalizeFhirDateTime(cleaned.effectiveDateTime);
      if (normDate) {
        cleaned.effectiveDateTime = normDate;
      } else {
        delete cleaned.effectiveDateTime;
      }
      cleaned.issued = normalizeFhirInstant(cleaned.issued);

      if (Array.isArray(cleaned.result)) {
        const mappedResults = cleaned.result
          .map((refObj) => {
            if (!isPlainObject(refObj)) return null;
            const rawObsId = extractRawObservationId(refObj.reference);
            if (!rawObsId) return null;
            const mappedObsId = observationIdMap.get(rawObsId);
            if (!mappedObsId) return null;
            return {
              ...refObj,
              reference: `Observation/${mappedObsId}`,
            };
          })
          .filter(Boolean);
        if (mappedResults.length > 0) {
          cleaned.result = mappedResults;
        } else {
          delete cleaned.result;
        }
      }
    }

    if (item.resourceType === "DocumentReference") {
      if (!cleaned.status) cleaned.status = "current";
      cleaned.date = normalizeFhirInstant(cleaned.date);
    }

    const resourceUrl = `${item.resourceType}/${item.scopedId}`;
    preparedEntries.push({
      order: RESOURCE_ORDER[item.resourceType] ?? 1,
      resourceType: item.resourceType,
      entry: {
        fullUrl: resourceUrl,
        resource: cleaned,
        request: {
          method: "PUT",
          url: resourceUrl,
        },
      },
    });
  }

  if (!hasPatient) {
    preparedEntries.unshift({
      order: 0,
      resourceType: "Patient",
      entry: {
        fullUrl: patientRef,
        resource: {
          resourceType: "Patient",
          id: patientId,
          active: true,
        },
        request: {
          method: "PUT",
          url: patientRef,
        },
      },
    });
  }

  preparedEntries.sort((a, b) => a.order - b.order);

  const resourceTypes: Record<string, number> = {};
  for (const item of preparedEntries) {
    resourceTypes[item.resourceType] = (resourceTypes[item.resourceType] || 0) + 1;
  }

  return {
    ok: true,
    data: {
      transactionBundle: {
        resourceType: "Bundle",
        type: "transaction",
        entry: preparedEntries.map((item) => item.entry),
      },
      patientId,
      resourceCount: preparedEntries.length,
      resourceTypes,
    },
  };
}
