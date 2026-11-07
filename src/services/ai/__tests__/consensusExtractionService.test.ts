import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  reconcileDualModelConsensus,
  normalizeMarkerName,
  valuesMatch,
} from "../consensusExtractionService";
import { __setBedrockFetchForTests } from "../bedrockService";
import { __setNimFetchForTests } from "../nvidiaNimService";

describe("Tri-Model Consensus Extraction Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    __setBedrockFetchForTests(null);
    __setNimFetchForTests(null);
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

  describe("reconcileDualModelConsensus (Tri-Model Architecture)", () => {
    it("should produce FULL_CONSENSUS when Gemini, Claude, and Nemotron all unanimously agree (3/3)", async () => {
      const mockAudit = {
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

      const mockBedrockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          output: {
            message: {
              content: [{ text: JSON.stringify(mockAudit) }],
            },
          },
        }),
      } as unknown as Response);

      const mockNimFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          choices: [
            {
              message: {
                content: JSON.stringify(mockAudit),
              },
            },
          ],
        }),
      } as unknown as Response);

      __setBedrockFetchForTests(mockBedrockFetch);
      __setNimFetchForTests(mockNimFetch);

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
      expect(result.consensusSummary.engine).toContain("Tri-Model Consensus");
      expect(result.observations[0].consensusStatus).toBe("VERIFIED");
      expect(result.observations[0].modelsAgreed).toContain("gemini");
      expect(result.observations[0].modelsAgreed).toContain("claude");
      expect(result.observations[0].modelsAgreed).toContain("nvidia_nim");
      expect(result.prescriptions[0].consensusStatus).toBe("VERIFIED");
    });

    it("should automatically AMEND values via 2-of-3 Quorum when Claude & Nemotron agree, overriding Gemini decimal shift", async () => {
      // Gemini extracted 140 (decimal shift error), but Claude and Nemotron both verify 14.0
      const mockAuditCorrected = {
        verifiedMarkers: [
          {
            testName: "Hemoglobin",
            agrees: false,
            verifiedValue: 14.0,
            verifiedUnit: "g/dL",
            verifiedFlag: "NORMAL",
            discrepancyNote: "OCR decimal shift detected: actual report value is 14.0 g/dL.",
          },
        ],
        verifiedPrescriptions: [],
      };

      __setBedrockFetchForTests(
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            output: {
              message: {
                content: [{ text: JSON.stringify(mockAuditCorrected) }],
              },
            },
          }),
        } as unknown as Response),
      );

      __setNimFetchForTests(
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockAuditCorrected),
                },
              },
            ],
          }),
        } as unknown as Response),
      );

      const primaryGeminiExtraction = {
        documentType: "lab_report",
        observations: [
          { testName: "Hemoglobin", value: 140, unit: "g/dL", flag: "HIGH" },
        ],
      };

      const result = await reconcileDualModelConsensus(primaryGeminiExtraction);

      // Quorum automatically amends and reconciles the value
      expect(result.observations[0].consensusStatus).toBe("AMENDED");
      expect(result.observations[0].numeric_value).toBe(14.0);
      expect(result.observations[0].valueCanonical).toBe(14.0);
      expect(result.observations[0].discrepancyNote).toContain("Quorum reconciled (2-of-3)");
      expect(result.observations[0].modelsAgreed).toEqual(["claude", "nvidia_nim"]);
    });

    it("should gracefully fall back to Dual-Model (Gemini + Claude) when NVIDIA NIM fails", async () => {
      const mockClaudeVerification = {
        verifiedMarkers: [
          {
            testName: "Hemoglobin",
            agrees: true,
            verifiedValue: 13.5,
            verifiedUnit: "g/dL",
            verifiedFlag: "NORMAL",
            discrepancyNote: null,
          },
        ],
      };

      __setBedrockFetchForTests(
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            output: {
              message: {
                content: [{ text: JSON.stringify(mockClaudeVerification) }],
              },
            },
          }),
        } as unknown as Response),
      );

      // NIM returns 429 Rate Limit
      __setNimFetchForTests(
        vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          text: async () => "Rate limit exceeded",
        } as unknown as Response),
      );

      const primaryGeminiExtraction = {
        documentType: "lab_report",
        observations: [
          { testName: "Hemoglobin", value: 13.5, unit: "g/dL", flag: "NORMAL" },
        ],
      };

      const result = await reconcileDualModelConsensus(primaryGeminiExtraction);

      expect(result.consensusSummary.engine).toContain("Dual-Model Consensus: Gemini 3.8 Flash + AWS Bedrock Claude");
      expect(result.observations[0].consensusStatus).toBe("VERIFIED");
      expect(result.observations[0].modelsAgreed).toContain("gemini");
      expect(result.observations[0].modelsAgreed).toContain("claude");
    });

    it("should gracefully return SINGLE_MODEL_FALLBACK if all external auditors fail", async () => {
      __setBedrockFetchForTests(
        vi.fn().mockResolvedValue({
          ok: false,
          status: 503,
          text: async () => "Bedrock Unavailable",
        } as unknown as Response),
      );

      __setNimFetchForTests(
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => "NIM Internal Server Error",
        } as unknown as Response),
      );

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
    });

    it("should immediately return fallback report if skipBedrock and skipNim options are true", async () => {
      const primaryGeminiExtraction = {
        documentType: "lab_report",
        observations: [
          { testName: "TSH", value: 2.5, unit: "uIU/mL", flag: "NORMAL" },
        ],
      };

      const result = await reconcileDualModelConsensus(primaryGeminiExtraction, {
        skipBedrock: true,
        skipNim: true,
      });

      expect(result.consensusSummary.overallConsensus).toBe("SINGLE_MODEL_FALLBACK");
      expect(result.observations[0].discrepancyNote).toContain("skipped by configuration");
    });
  });
});
