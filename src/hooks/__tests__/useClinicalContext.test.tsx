import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ---- SYNTHETIC fixtures ----
const PARENT = { id: "prof-parent", name: "Myself", fullName: "Myself", userId: "u1", createdAt: "2026-01-01T00:00:00Z", chronicConditions: [], allergies: [] };
const CHILD = { id: "prof-child", name: "Synthetic Child", fullName: "Synthetic Child", userId: "u1", createdAt: "2026-02-01T00:00:00Z", chronicConditions: [], allergies: [] };

const ALL_MEDS = [
  { id: "m1", genericName: "ParentOnlyStatin", dosage: "10mg", endDate: null, addedAt: "2026-01-02", profileId: PARENT.id },
  { id: "m2", genericName: "ChildOnlySyrup", dosage: "5ml", endDate: null, addedAt: "2026-02-02", profileId: CHILD.id },
  { id: "m3", genericName: "LegacyUnscopedMed", dosage: "1 tab", endDate: null, addedAt: "2025-12-01" },
];
const ALL_DOCS = [
  { id: "d1", profileId: PARENT.id, extractedData: { lab_values: [{ testName: "ParentLDL", value: "190", unit: "mg/dL", flag: "HIGH" }] } },
  { id: "d2", profileId: CHILD.id, extractedData: { lab_values: [{ testName: "ChildHemoglobin", value: "11.2", unit: "g/dL" }] } },
];

type Listener = { sub: string; profileFilter: string | null; next: (snap: unknown) => void; unsubscribed: boolean };

const h = vi.hoisted(() => ({
  profileState: { activeProfile: null as unknown, profiles: [] as unknown[] },
  listeners: [] as Array<{ sub: string; profileFilter: string | null; next: (snap: unknown) => void; unsubscribed: boolean }>,
}));

vi.mock("../../context/AuthContext", () => ({ useAuth: () => ({ user: { uid: "u1" } }) }));
vi.mock("../../context/ProfileContext", () => ({ useProfile: () => h.profileState }));
vi.mock("../../lib/firebase/config", () => ({ db: {} }));
vi.mock("../../services/googleFormsService", () => ({ getForm: vi.fn(), getFormResponses: vi.fn() }));
vi.mock("firebase/firestore", () => ({
  collection: (_db: unknown, ...path: string[]) => ({ sub: path[path.length - 1] }),
  where: (field: string, _op: string, value: string) => ({ field, value }),
  query: (base: { sub: string }, ...cs: Array<{ field: string; value: string }>) => ({
    sub: base.sub,
    profileFilter: cs.find((c) => c.field === "profileId")?.value ?? null,
  }),
  onSnapshot: (q: { sub: string; profileFilter: string | null }, next: (s: unknown) => void) => {
    const l: Listener = { sub: q.sub, profileFilter: q.profileFilter, next, unsubscribed: false };
    h.listeners.push(l);
    return () => { l.unsubscribed = true; };
  },
}));

import { useClinicalContext } from "../useClinicalContext";

/** Deliberately IGNORES the server-side filter: worst case, all docs are delivered. */
function emitAll(l: Listener) {
  const rows = l.sub === "medications" ? ALL_MEDS : ALL_DOCS;
  l.next({ docs: rows.map(({ id, ...data }) => ({ id, data: () => data })) });
}

function active(sub: string) {
  return h.listeners.filter((l) => l.sub === sub && !l.unsubscribed);
}

describe("useClinicalContext profile scoping", () => {
  beforeEach(() => {
    h.listeners.length = 0;
    h.profileState.profiles = [PARENT, CHILD];
  });

  it("child profile: server-side filter + no parent/legacy meds or labs in the prompt", () => {
    h.profileState.activeProfile = CHILD;
    const { result } = renderHook(() => useClinicalContext());
    expect(active("medications")[0].profileFilter).toBe(CHILD.id);
    expect(active("documents")[0].profileFilter).toBe(CHILD.id);
    act(() => { active("medications").forEach(emitAll); active("documents").forEach(emitAll); });

    const ctx = result.current.contextString;
    expect(result.current.medications.map((m) => m.genericName)).toEqual(["ChildOnlySyrup"]);
    expect(result.current.labBiomarkers.map((l) => l.testName)).toEqual(["ChildHemoglobin"]);
    expect(ctx).toContain("ChildOnlySyrup");
    expect(ctx).not.toContain("ParentOnlyStatin");
    expect(ctx).not.toContain("LegacyUnscopedMed");
    expect(ctx).not.toContain("ParentLDL");
  });

  it("switching profile unsubscribes, clears stale data and re-subscribes", () => {
    h.profileState.activeProfile = PARENT;
    const { result, rerender } = renderHook(() => useClinicalContext());
    const parentListeners = [...active("medications"), ...active("documents")];
    act(() => { parentListeners.forEach(emitAll); });
    expect(result.current.medications.map((m) => m.genericName).sort()).toEqual(["LegacyUnscopedMed", "ParentOnlyStatin"]);
    expect(result.current.contextString).toContain("ParentLDL");

    h.profileState.activeProfile = CHILD;
    rerender();

    // Old listeners torn down; stale parent data cleared before new snapshot.
    expect(parentListeners.every((l) => l.unsubscribed)).toBe(true);
    expect(result.current.medications).toEqual([]);
    expect(result.current.labBiomarkers).toEqual([]);
    expect(result.current.contextString).not.toContain("ParentOnlyStatin");
    expect(result.current.contextString).not.toContain("ParentLDL");

    // A late snapshot from the old (parent) listener must be ignored.
    act(() => { parentListeners.forEach(emitAll); });
    expect(result.current.medications).toEqual([]);

    act(() => { active("medications").forEach(emitAll); active("documents").forEach(emitAll); });
    expect(result.current.medications.map((m) => m.genericName)).toEqual(["ChildOnlySyrup"]);
    expect(result.current.contextString).not.toContain("ParentLDL");
  });
});
