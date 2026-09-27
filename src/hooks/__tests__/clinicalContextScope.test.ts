import { describe, it, expect } from "vitest";
import {
  resolvePrimaryProfileId,
  belongsToProfile,
  selectActiveMedications,
  extractLabBiomarkers,
  type ScopedMedication,
  type ClinicalDocumentData,
} from "../clinicalContextScope";

// ---- SYNTHETIC fixtures (no real patient data) ----
const PARENT = { id: "prof-parent", name: "Myself", createdAt: { seconds: 1_700_000_000 } };
const CHILD = { id: "prof-child", name: "Synthetic Child", createdAt: { seconds: 1_700_500_000 } };
const PROFILES = [CHILD, PARENT]; // order intentionally not creation order

function med(id: string, genericName: string, profileId?: string, endDate: string | null = null): ScopedMedication {
  return {
    id, userId: "u-synthetic", genericName, brandName: null, rxcui: null, dosage: "1 tab",
    frequency: null, startDate: null, endDate, prescribedFor: null,
    addedAt: `2026-01-0${id.length % 9 + 1}T00:00:00Z`, profileId,
  };
}

const MEDS: ScopedMedication[] = [
  med("m1", "ParentOnlyStatin", PARENT.id),
  med("m2", "ChildOnlySyrup", CHILD.id),
  med("m3", "LegacyUnscopedMed"), // no profileId (older/manual record)
  med("m4", "ParentStoppedMed", PARENT.id, "2025-12-01"),
];

const DOCS: Array<{ id: string; data: ClinicalDocumentData }> = [
  { id: "d1", data: { profileId: PARENT.id, extractedData: { lab_values: [{ testName: "ParentLDL", value: "190", unit: "mg/dL", flag: "HIGH" }] } } },
  { id: "d2", data: { profileId: CHILD.id, extractedData: { observations: [{ marker: "ChildHemoglobin", value: 11.2, unit: "g/dL" }] } } },
  { id: "d3", data: { extractedData: { labResults: [{ markerName: "LegacyTSH", numeric_value: 2.1 }] } } },
];

describe("resolvePrimaryProfileId", () => {
  it("picks the earliest-created profile", () => {
    expect(resolvePrimaryProfileId(PROFILES)).toBe(PARENT.id);
  });
  it("single profile is primary", () => {
    expect(resolvePrimaryProfileId([CHILD])).toBe(CHILD.id);
  });
  it("falls back to the profile named Myself when timestamps are missing", () => {
    expect(resolvePrimaryProfileId([{ id: "a", name: "Kid" }, { id: "b", name: "Myself" }])).toBe("b");
  });
  it("fails closed (null) when undecidable", () => {
    expect(resolvePrimaryProfileId([{ id: "a", name: "A" }, { id: "b", name: "B" }])).toBeNull();
    expect(resolvePrimaryProfileId([])).toBeNull();
  });
});

describe("belongsToProfile", () => {
  it("matches only the exact profileId", () => {
    expect(belongsToProfile({ profileId: CHILD.id }, CHILD.id, false)).toBe(true);
    expect(belongsToProfile({ profileId: PARENT.id }, CHILD.id, false)).toBe(false);
  });
  it("unscoped legacy records belong to the primary profile only", () => {
    expect(belongsToProfile({}, PARENT.id, true)).toBe(true);
    expect(belongsToProfile({}, CHILD.id, false)).toBe(false);
    expect(belongsToProfile({ profileId: "" }, CHILD.id, false)).toBe(false);
  });
  it("no active profile => nothing", () => {
    expect(belongsToProfile({ profileId: PARENT.id }, null, true)).toBe(false);
  });
});

describe("no cross-profile leakage (synthetic parent + child)", () => {
  it("child sees only child meds — never parent or legacy meds", () => {
    const names = selectActiveMedications(MEDS, CHILD.id, false).map((m) => m.genericName);
    expect(names).toEqual(["ChildOnlySyrup"]);
  });
  it("parent sees own + legacy active meds, never the child's, never stopped meds", () => {
    const names = selectActiveMedications(MEDS, PARENT.id, true).map((m) => m.genericName).sort();
    expect(names).toEqual(["LegacyUnscopedMed", "ParentOnlyStatin"]);
  });
  it("child sees only child labs", () => {
    const labs = extractLabBiomarkers(DOCS, CHILD.id, false);
    expect(labs.map((l) => l.testName)).toEqual(["ChildHemoglobin"]);
    expect(labs[0].value).toBe("11.2");
  });
  it("parent sees own + legacy labs, never the child's", () => {
    const labs = extractLabBiomarkers(DOCS, PARENT.id, true).map((l) => l.testName).sort();
    expect(labs).toEqual(["LegacyTSH", "ParentLDL"]);
  });
});
