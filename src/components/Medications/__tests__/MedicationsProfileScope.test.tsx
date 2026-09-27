import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const { saveMedicationMock } = vi.hoisted(() => ({ saveMedicationMock: vi.fn() }));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "synthetic-user" } }),
}));
vi.mock("../../../context/ProfileContext", () => ({
  useProfile: () => ({ activeProfile: { id: "synthetic-child-profile", name: "Synthetic Child" } }),
}));
vi.mock("../../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({ labBiomarkers: [], drugLabContraindications: [] }),
}));
vi.mock("../../../services/medicationService", () => ({
  getActiveMedications: vi.fn().mockResolvedValue([]),
  getInteractions: vi.fn().mockResolvedValue([]),
  saveMedication: saveMedicationMock,
  lookupRxCUI: vi.fn().mockResolvedValue("rx-synthetic"),
}));
vi.mock("../../../lib/auditLogger", () => ({ logAuditEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../../lib/firebase/config", () => ({ db: {} }));
vi.mock("../InteractionMatrix", () => ({ default: () => null }));

import Medications, { buildNewMedication } from "../Medications";

describe("Medications page — profile-scoped saves", () => {
  beforeEach(() => {
    saveMedicationMock.mockReset().mockResolvedValue("med-1");
  });

  it("buildNewMedication includes the profileId", () => {
    const med = buildNewMedication({
      userId: "u",
      profileId: "p-child",
      name: "  Syntheticmed ",
      dose: "",
      frequency: "Once daily",
      startDate: "2026-09-27",
      rxcui: null,
    });
    expect(med).toMatchObject({ userId: "u", profileId: "p-child", genericName: "Syntheticmed", dosage: null, endDate: null });
  });

  it("saves a new medication with the active profileId", async () => {
    await act(async () => {
      render(<Medications />);
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /Add Medication/i })[0]);
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("e.g. Metformin"), { target: { value: "Syntheticmed" } });
    });
    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText("e.g. Metformin").closest("form") as HTMLFormElement);
    });
    expect(saveMedicationMock).toHaveBeenCalledTimes(1);
    const [uid, payload] = saveMedicationMock.mock.calls[0];
    expect(uid).toBe("synthetic-user");
    expect(payload).toMatchObject({ profileId: "synthetic-child-profile", genericName: "Syntheticmed" });
  });
});
