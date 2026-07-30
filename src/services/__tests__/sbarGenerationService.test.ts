import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSBAR } from "../sbarGenerationService";
import { MedicationStatus } from "../../types/medical";

// Mock the AI SDK
vi.mock("../../lib/geminiClient", () => {
  const mockAi = {
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: `SITUATION:\nPatient requires review\nBACKGROUND:\nPatient has hypertension\nASSESSMENT:\nGlucose is high\nRECOMMENDATION:\nIncrease medication\nMISSING INFORMATION:\nNo recent weight\nCONFIDENCE:\nHigh`,
      }),
    },
  };
  return {
    default: vi.fn().mockReturnValue(mockAi),
    getAI: vi.fn().mockReturnValue(mockAi),
  };
});

vi.mock("../ai/contextService", () => ({
  getPatientContext: vi.fn().mockResolvedValue({
    profile: { name: "John Doe", dob: "1980-01-01", gender: "Male" },
    labHistory: [],
    medications: [],
    recentInsights: [],
    alerts: [],
    reportedSymptoms: [],
    knownConditions: ["Hypertension"],
    demographics: { age: "44 years", gender: "Male" },
  }),
  formatContextForPrompt: vi.fn().mockReturnValue("PATIENT PROFILE: John Doe"),
}));

vi.mock("../cacheService", () => ({
  generateSourceHash: vi.fn().mockResolvedValue("mock-hash"),
  getCachedReport: vi.fn().mockResolvedValue(null),
  saveCachedReport: vi.fn().mockResolvedValue(undefined),
}));

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
    const getAI = (await import("../../lib/geminiClient")).getAI;
    const mockInstance = getAI();
    vi.mocked(mockInstance.models.generateContent).mockRejectedValue(
      new Error("AI Failure")
    );

    await expect(generateSBAR("test-userId", mockProfile as any)).rejects.toThrow("Unable to generate summary");
  });
});
