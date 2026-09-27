import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const { state, getActiveMedicationsMock, getInteractionsMock } = vi.hoisted(() => ({
  state: {
    ctx: {
      activeProfile: { id: "p-primary", name: "Myself" } as { id: string; name: string },
      profiles: [
        { id: "p-primary", name: "Myself", createdAt: 1 },
        { id: "p-child", name: "Synthetic Child", createdAt: 2 },
      ],
    },
  },
  getActiveMedicationsMock: vi.fn(),
  getInteractionsMock: vi.fn(),
}));

const AUTH = { user: { uid: "synthetic-user" } };
vi.mock("../../../context/AuthContext", () => ({ useAuth: () => AUTH }));
vi.mock("../../../context/ProfileContext", () => ({ useProfile: () => state.ctx }));
vi.mock("../../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({ labBiomarkers: [], drugLabContraindications: [] }),
}));
vi.mock("../../../services/medicationService", () => ({
  getActiveMedications: getActiveMedicationsMock,
  getInteractions: getInteractionsMock,
  saveMedication: vi.fn(),
  lookupRxCUI: vi.fn(),
}));
vi.mock("../../../lib/auditLogger", () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../../lib/firebase/config", () => ({ db: {} }));
vi.mock("../InteractionMatrix", () => ({ default: () => null }));

import Medications from "../Medications";

const MEDS = [
  { id: "1", genericName: "PrimaryTaggedMed", profileId: "p-primary", rxcui: "r1", endDate: null },
  { id: "2", genericName: "LegacyUntaggedMed", rxcui: "r2", endDate: null },
  { id: "3", genericName: "ChildTaggedMed", profileId: "p-child", rxcui: "r3", endDate: null },
  { id: "4", genericName: "ChildSecondMed", profileId: "p-child", rxcui: "r4", endDate: null },
];
const INTERACTIONS = [
  { id: "r1-r2", drugA: "PrimaryTaggedMed", drugB: "LegacyUntaggedMed", rxcuiA: "r1", rxcuiB: "r2", severity: "moderate", description: "d", plainSummary: "Primary pair synthetic warning", source: "rxnorm", checkedAt: "2026-09-27" },
  { id: "r3-r4", drugA: "ChildTaggedMed", drugB: "ChildSecondMed", rxcuiA: "r3", rxcuiB: "r4", severity: "mild", description: "d", plainSummary: "Child pair synthetic warning", source: "rxnorm", checkedAt: "2026-09-27" },
  { id: "r1-r3", drugA: "PrimaryTaggedMed", drugB: "ChildTaggedMed", rxcuiA: "r1", rxcuiB: "r3", severity: "severe", description: "d", plainSummary: "Cross-profile synthetic warning", source: "rxnorm", checkedAt: "2026-09-27" },
];

async function renderPage() {
  await act(async () => {
    render(<Medications />);
  });
}

describe("Medications list — scoped to the active profile", () => {
  beforeEach(() => {
    getActiveMedicationsMock.mockReset().mockResolvedValue(MEDS);
    getInteractionsMock.mockReset().mockResolvedValue(INTERACTIONS);
  });

  it("primary profile sees its tagged meds plus untagged legacy meds, not the child's", async () => {
    state.ctx = { ...state.ctx, activeProfile: { id: "p-primary", name: "Myself" } };
    await renderPage();
    const text = document.body.textContent ?? "";
    expect(text).toContain("PrimaryTaggedMed");
    expect(text).toContain("LegacyUntaggedMed");
    expect(text).not.toContain("ChildTaggedMed");
    expect(text).toContain("Primary pair synthetic warning");
    expect(text).not.toContain("Child pair synthetic warning");
    expect(text).not.toContain("Cross-profile synthetic warning");
  });

  it("secondary profile sees only its own tagged meds (no legacy, no primary)", async () => {
    state.ctx = { ...state.ctx, activeProfile: { id: "p-child", name: "Synthetic Child" } };
    await renderPage();
    expect(screen.getAllByText("ChildTaggedMed").length).toBeGreaterThan(0);
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("PrimaryTaggedMed");
    expect(text).not.toContain("LegacyUntaggedMed");
    expect(text).toContain("Child pair synthetic warning");
    expect(text).not.toContain("Cross-profile synthetic warning");
  });
});
