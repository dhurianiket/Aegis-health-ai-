import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { auditSpecialistResponse } from "../specialistConsensus";
import { __setNimFetchForTests } from "../../nvidiaNimService";

describe("Specialist Consensus & Clinical Safety Co-Pilot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    __setNimFetchForTests(null);
  });

  it("should pass safety review when specialist provides accurate non-prescriptive health info", async () => {
    const mockNimAudit = {
      safetyPassed: true,
      redFlagDetected: false,
      redFlagEmergencyType: null,
      emergencyActionRequired: null,
      guidelineAdherence: true,
      contraindicatedAdviceFound: false,
      cautionaryNotice: null,
    };

    __setNimFetchForTests(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          choices: [{ message: { content: JSON.stringify(mockNimAudit) } }],
        }),
      } as unknown as Response),
    );

    const result = await auditSpecialistResponse({
      specialty: "Cardiology",
      userMessage: "What is a normal blood pressure reading?",
      primaryResponseText: "According to ICMR/CSI guidelines, normal blood pressure is less than 120/80 mmHg.",
    });

    expect(result.safetyPassed).toBe(true);
    expect(result.redFlagDetected).toBe(false);
    expect(result.guidelineAdherence).toBe(true);
    expect(result.auditorModel).toBe("nvidia/llama-3.1-nemotron-70b-instruct");
  });

  it("should flag red-flag emergency when user reports acute chest pain symptoms", async () => {
    const mockNimAudit = {
      safetyPassed: false,
      redFlagDetected: true,
      redFlagEmergencyType: "ACUTE_CORONARY",
      emergencyActionRequired: "Call 108/112 or visit the nearest emergency department immediately.",
      guidelineAdherence: true,
      contraindicatedAdviceFound: false,
      cautionaryNotice: "Acute cardiac red-flag detected.",
    };

    __setNimFetchForTests(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          choices: [{ message: { content: JSON.stringify(mockNimAudit) } }],
        }),
      } as unknown as Response),
    );

    const result = await auditSpecialistResponse({
      specialty: "Cardiology",
      userMessage: "I have heavy pressure on my chest spreading to my left arm and sweating for 20 minutes.",
      primaryResponseText: "You may be having a heart attack. Please seek emergency medical care.",
    });

    expect(result.safetyPassed).toBe(false);
    expect(result.redFlagDetected).toBe(true);
    expect(result.redFlagEmergencyType).toBe("ACUTE_CORONARY");
    expect(result.emergencyActionRequired).toContain("108/112");
  });

  it("should gracefully fall back to passthrough if NVIDIA NIM is unavailable", async () => {
    __setNimFetchForTests(
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => "Service Unavailable",
      } as unknown as Response),
    );

    const result = await auditSpecialistResponse({
      specialty: "Endocrinology",
      userMessage: "What is an HbA1c target for prediabetes?",
      primaryResponseText: "Under RSSDI guidelines, prediabetes is 5.7% to 6.4%.",
    });

    expect(result.safetyPassed).toBe(true);
    expect(result.auditorModel).toBe("fallback-passthrough");
  });
});
