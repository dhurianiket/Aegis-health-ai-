import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSBAR } from "../sbarGenerationService";
import { MedicationStatus } from "../../types/medical";

// Mock the AI SDK
vi.mock("../../lib/geminiClient", () => {
  const mockAi = {
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          situation: "Patient requires review",
          background: "Patient has hypertension",
          assessment: "Glucose is high",
          recommendation: "Increase medication",
        }),
      }),
    },
  };
  return {
    default: vi.fn().mockReturnValue(mockAi),
    getAI: vi.fn().mockReturnValue(mockAi),
  };
});

describe("SBARGenerationService", () => {
  const mockProfile: any = {
    name: "John Doe",
    dob: "1980-01-01",
    gender: "Male",
    chronicConditions: ["Hypertension"],
    allergies: ["Penicillin"],
  };

  const mockLabs: any[] = [
    { markerName: "Glucose", value: 200, unit: "mg/dL", status: "critical" },
  ];

  const mockMeds: any[] = [
    {
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Daily",
      status: MedicationStatus.ACTIVE,
    },
  ];

  it("should generate SBAR when AI succeeds", async () => {
    const sbar = await generateSBAR("test-userId", mockProfile as any);
    expect(sbar).toContain("SITUATION:\nPatient requires review");
    expect(sbar).toContain("BACKGROUND:\nPatient has hypertension");
    expect(sbar).toContain("ASSESSMENT:\nGlucose is high");
    expect(sbar).toContain("RECOMMENDATION:\nIncrease medication");
    expect(sbar).toContain("MISSING INFORMATION:\nNo recent weight");
    expect(sbar).toContain("CONFIDENCE:\nHigh");
  });

  it("should generate a fallback SBAR when AI fails", async () => {
    // Mock failure for this specific test
    vi.spyOn(console, "error").mockImplementation(() => {});
    const getAI = (await import("../../lib/geminiClient")).default;
    const mockInstance = (getAI as any).mock.results[0].value;
    vi.mocked(mockInstance.models.generateContent).mockRejectedValueOnce(
      new Error("AI Failure"),
    );

    const sbar = await generateSBAR("test-userId", mockProfile as any);

    expect(sbar).toContain("SITUATION:");
    expect(sbar).toContain("BACKGROUND:");
    expect(sbar).toContain("ASSESSMENT:");
    expect(sbar).toContain("RECOMMENDATION:");
    expect(sbar).toContain("Hypertension");
    expect(sbar).toContain("Glucose: 200");
  });
});
