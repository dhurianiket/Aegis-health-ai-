import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  reconcileDualModelConsensus,
  normalizeMarkerName,
  valuesMatch,
} from "../consensusExtractionService";
import { __setBedrockFetchForTests } from "../bedrockService";

describe("Dual-Model Consensus Extraction Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    __setBedrockFetchForTests(null);
  });

  describe("Helper Functions", () => {
    it("normalizeMarkerName should normalize biomarker strings for fuzzy comparison", () => {
      expect(normalizeMarkerName("Total Cholesterol")).toBe("cholesterol");
      expect(normalizeMarkerName("Blood Glucose (Fasting)")).toBe("bloodglucose");
      expect(normalizeMarkerName("HbA1c / Glycated Hemoglobin")).toBe("hba1cglycatedhemoglobin");
    });

    it("valuesMatch should handle tolerances, nulls, and decimal precision", () => {
      expect(valuesMatch(14.0, 14.0)).toBe(true);
      expect(valuesMatch(14.0, 14.05, 0.01)).toBe(true); // < 1% difference
      expect(valuesMatch(14.0, 140.0, 0.01)).toBe(false); // Decimal shift
      expect(valuesMatch(null, null)).toBe(true);
      expect(valuesMatch(null, 14.0)).toBe(false);
      expect(valuesMatch(0, 0)).toBe(true);
    });
  });

  describe("reconcileDualModelConsensus", () => {
    it("should produce FULL_CONSENSUS when Claude verifies all Gemini-extracted markers", async () => {
      const mockClaudeVerification = {
        verifiedMarkers: [
          {
            testName: "Hemoglobin",
            agrees: true,
            verifiedValue: 14.2,
            verifiedUnit: "g/dL",
            verifiedFlag: "NORMAL",
            discrepancyNote: null,
          },
          {
            testName: "Fasting Blood Glucose",
            agrees: true,
            verifiedValue: 95,
            verifiedUnit: "mg/dL",
            verifiedFlag: "NORMAL",
            discrepancyNote: null,
          },
        ],
        verifiedPrescriptions: [
          {
            medicationName: "Metformin",
            agrees: true,
            discrepancyNote: null,
          },
        ],
        overallConfidence: 0.99,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          output: {
            message: {
              content: [{ text: JSON.stringify(mockClaudeVerification) }],
            },
          },
        }),
      } as unknown as Response);

      __setBedrockFetchForTests(mockFetch);

      const primaryGeminiExtraction = {
        documentType: "lab_report",
        observations: [
          { testName: "Hemoglobin", value: 14.2, unit: "g/dL", flag: "NORMAL" },
          { testName: "Fasting Blood Glucose", value: 95, unit: "mg/dL", flag: "NORMAL" },
        ],
        prescriptions: [
          { medicationName: "Metformin", dosage: "500mg", frequency: "Twice daily" },
        ],
      };

      const result = await reconcileDualModelConsensus(primaryGeminiExtraction);

      expect(result.consensusSummary.overallConsensus).toBe("FULL_CONSENSUS");
      expect(result.consensusSummary.agreementPercentage).toBe(100);
      expect(result.consensusSummary.verifiedMarkers).toBe(2);
      expect(result.consensusSummary.discrepancyMarkers).toBe(0);

      expect(result.observations[0].consensusStatus).toBe("VERIFIED");
      expect(result.observations[0].modelsAgreed).toContain("gemini");
      expect(result.observations[0].modelsAgreed).toContain("claude");
      expect(result.prescriptions[0].consensusStatus).toBe("VERIFIED");
    });

    it("should flag DISCREPANCY when Claude detects an OCR decimal shift (e.g. 140 vs 14.0)", async () => {
      const mockClaudeVerification = {
        verifiedMarkers: [
          {
            testName: "Hemoglobin",
            agrees: false,
            verifiedValue: 14.0,
            verifiedUnit: "g/dL",
            verifiedFlag: "NORMAL",
            discrepancyNote: "OCR decimal point missing: report states 14.0 g/dL, not 140 g/dL.",
          },
        ],
        verifiedPrescriptions: [],
        overallConfidence: 0.75,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          output: {
            message: {
              content: [{ text: JSON.stringify(mockClaudeVerification) }],
            },
          },
        }),
      } as unknown as Response);

      __setBedrockFetchForTests(mockFetch);

      const primaryGeminiExtraction = {
        documentType: "lab_report",
        observations: [
          { testName: "Hemoglobin", value: 140, unit: "g/dL", flag: "HIGH" },
        ],
      };

      const result = await reconcileDualModelConsensus(primaryGeminiExtraction);

      expect(result.consensusSummary.overallConsensus).toBe("DISCREPANCY_FLAGGED");
      expect(result.consensusSummary.discrepancyMarkers).toBe(1);
      expect(result.observations[0].consensusStatus).toBe("DISCREPANCY");
      expect(result.observations[0].claudeValue).toBe(14.0);
      expect(result.observations[0].discrepancyNote).toContain("OCR decimal point missing");
    });

    it("should gracefully return SINGLE_MODEL_FALLBACK if Bedrock is offline or errors", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => "ServiceUnavailable",
      } as unknown as Response);

      __setBedrockFetchForTests(mockFetch);

      const primaryGeminiExtraction = {
        documentType: "lab_report",
        observations: [
          { testName: "Total Cholesterol", value: 185, unit: "mg/dL", flag: "NORMAL" },
        ],
      };

      const result = await reconcileDualModelConsensus(primaryGeminiExtraction);

      expect(result.consensusSummary.overallConsensus).toBe("SINGLE_MODEL_FALLBACK");
      expect(result.observations[0].consensusStatus).toBe("SINGLE_MODEL_FALLBACK");
      expect(result.observations[0].modelsAgreed).toEqual(["gemini"]);
      expect(result.observations[0].discrepancyNote).toContain("Bedrock verification fallback");
    });

    it("should immediately return fallback report if skipBedrock option is true", async () => {
      const primaryGeminiExtraction = {
        documentType: "lab_report",
        observations: [
          { testName: "TSH", value: 2.5, unit: "uIU/mL", flag: "NORMAL" },
        ],
      };

      const result = await reconcileDualModelConsensus(primaryGeminiExtraction, {
        skipBedrock: true,
      });

      expect(result.consensusSummary.overallConsensus).toBe("SINGLE_MODEL_FALLBACK");
      expect(result.observations[0].discrepancyNote).toContain("skipped by configuration");
    });
  });
});
