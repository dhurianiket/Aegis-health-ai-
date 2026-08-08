import { describe, it, expect, vi } from "vitest";
import { 
  evaluateDrugLabContraindications, 
  buildBioRegimenSafetySummary,
  isMedInCategory,
  parseNumericValue,
  LabBiomarker
} from "../drugLabEngine";
import { 
  generateDoctorReport, 
  exportToPDF, 
  generateTrendNarrative,
  SBAROutput,
  TrendSummary,
  LabObservation
} from "../pdfExportService";
import { generateSBAR } from "../sbarGenerationService";
import { Medication } from "../../types/health";
import { MedicationStatus } from "../../types/medical";

// Helper to create fully typed Medication objects for tests
const createMockMed = (partial: Partial<Medication> & { id: string; genericName: string }): Medication => ({
  userId: "user-1",
  brandName: null,
  rxcui: null,
  dosage: "10mg",
  frequency: "daily",
  startDate: "2026-01-01",
  endDate: null,
  prescribedFor: null,
  addedAt: "2026-01-01T00:00:00Z",
  ...partial,
});

// Mock Gemini Client for AI calls in sbarGenerationService and pdfExportService
vi.mock("../../lib/geminiClient", () => {
  const mockAi = {
    models: {
      generateContent: vi.fn().mockImplementation(async (opts: any) => {
        const text = opts?.contents?.[0]?.parts?.[0]?.text || "";
        if (text.includes("trend narrative")) {
          return {
            text: JSON.stringify({
              narrative_paragraphs: ["Test trend paragraph."],
              overall_summary: "Test overall summary.",
              disclaimer: "Test disclaimer."
            })
          };
        }
        return {
          text: `INTRO PARAGRAPH:\nClinical summary.\nPART 1: SBAR CLINICAL SUMMARY\nS - SITUATION\nPatient situation.\nB - BACKGROUND\nPatient background.\nA - ASSESSMENT\nPatient assessment.\nR - RECOMMENDATION\nPatient recommendation.\nPART 2: AI DR SUMMARY\nPatient AI DR summary.`
        };
      })
    }
  };
  return {
    default: vi.fn().mockReturnValue(mockAi),
    getAI: vi.fn().mockReturnValue(mockAi)
  };
});

vi.mock("../ai/contextService", () => ({
  getPatientContext: vi.fn().mockResolvedValue({
    profile: { name: "Test Patient", dob: "1975-05-10", gender: "Female" },
    labHistory: [],
    medications: [],
    recentInsights: [],
    alerts: [],
    reportedSymptoms: [],
    knownConditions: ["Diabetes"],
    demographics: { age: "51 years", gender: "Female" }
  }),
  formatContextForPrompt: vi.fn().mockReturnValue("PATIENT CONTEXT DATA")
}));

vi.mock("../cacheService", () => ({
  generateSourceHash: vi.fn().mockResolvedValue("hash-12345"),
  getCachedReport: vi.fn().mockImplementation((userId: string, patientId: string, type: string, hash: string, ver: string, force: boolean) => {
    if (force) return Promise.resolve(null);
    if (userId === "cached-user") return Promise.resolve("CACHED SBAR REPORT CONTENT");
    return Promise.resolve(null);
  }),
  saveCachedReport: vi.fn().mockResolvedValue(undefined)
}));

describe("M1 R1 Clinical Features Stress Tests", () => {

  // =========================================================================
  // 1. drugLabEngine.ts Stress & Edge-Case Testing
  // =========================================================================
  describe("1. drugLabEngine.ts Stress Tests", () => {

    describe("1.1 parseNumericValue Edge Cases", () => {
      it("handles null, undefined, numeric input, zero, and negative numbers", () => {
        expect(parseNumericValue(null)).toBeNull();
        expect(parseNumericValue(undefined)).toBeNull();
        expect(parseNumericValue(NaN)).toBeNull();
        expect(parseNumericValue(0)).toBe(0);
        expect(parseNumericValue(-4.5)).toBe(-4.5);
        expect(parseNumericValue(5.4)).toBe(5.4);
      });

      it("handles string representations with units, symbols, and whitespace", () => {
        expect(parseNumericValue("5.4 mmol/L")).toBe(5.4);
        expect(parseNumericValue("> 3.5")).toBe(3.5);
        expect(parseNumericValue("< 15.0 mL/min")).toBe(15.0);
        expect(parseNumericValue("eGFR: 29.5 mL/min/1.73m2")).toBe(29.5);
        expect(parseNumericValue("No numeric value here")).toBeNull();
        expect(parseNumericValue("")).toBeNull();
        expect(parseNumericValue("   ")).toBeNull();
      });
    });

    describe("1.2 isMedInCategory RxCUI & Case-Insensitive Matching", () => {
      it("matches medication by RxCUI", () => {
        const medWithRxCUI = createMockMed({
          id: "med-1",
          genericName: "Custom Generic Name",
          rxcui: "29046", // Lisinopril RxCUI
        });
        expect(isMedInCategory(medWithRxCUI, "acei")).toBe(true);
        expect(isMedInCategory(medWithRxCUI, "statin")).toBe(false);
      });

      it("matches medication by genericName or brandName lowercasing", () => {
        const medUpper = createMockMed({
          id: "med-2",
          genericName: "LISINOPRIL HYDROCHLOROTHIAZIDE",
        });
        expect(isMedInCategory(medUpper, "acei")).toBe(true);

        const medBrand = createMockMed({
          id: "med-3",
          genericName: "",
          brandName: "Glucophage XR",
        });
        expect(isMedInCategory(medBrand, "biguanide")).toBe(true);
      });

      it("returns false for unknown categories or unmatched medications", () => {
        const med = createMockMed({
          id: "med-4",
          genericName: "Vitamin C",
        });
        expect(isMedInCategory(med, "non_existent_cat")).toBe(false);
        expect(isMedInCategory(med, "acei")).toBe(false);
      });
    });

    describe("1.3 Biomarker Value Extremes (Zero, Negative, High Potassium, Low eGFR)", () => {
      const lisinopril = createMockMed({ id: "m-lis", genericName: "lisinopril", rxcui: "29046" });
      const spironolactone = createMockMed({ id: "m-spi", genericName: "spironolactone", rxcui: "9997" });
      const metformin = createMockMed({ id: "m-met", genericName: "metformin", rxcui: "6809", dosage: "1000mg" });
      const atorvastatin = createMockMed({ id: "m-ato", genericName: "atorvastatin", rxcui: "83367" });
      const warfarin = createMockMed({ id: "m-war", genericName: "warfarin", rxcui: "11289" });

      it("handles zero and negative potassium values without false hyperkalemia alerts", () => {
        const zeroK: LabBiomarker = { testName: "Serum Potassium", value: "0 mmol/L", numericValue: 0 };
        const negK: LabBiomarker = { testName: "Serum Potassium", value: "-2.5 mmol/L", numericValue: -2.5 };

        const resZero = evaluateDrugLabContraindications([lisinopril, spironolactone], [zeroK]);
        expect(resZero).toHaveLength(0);

        const resNeg = evaluateDrugLabContraindications([lisinopril, spironolactone], [negK]);
        expect(resNeg).toHaveLength(0);
      });

      it("evaluates potassium boundary conditions (4.99 vs 5.0 vs 8.5) for ACEi and Spironolactone", () => {
        const k499: LabBiomarker = { testName: "Potassium", value: "4.99 mmol/L" };
        const k50: LabBiomarker = { testName: "K+", value: "5.0 mmol/L" };
        const k85: LabBiomarker = { testName: "Potassium", value: "8.5 mmol/L" };

        expect(evaluateDrugLabContraindications([lisinopril], [k499])).toHaveLength(0);

        const res50Lis = evaluateDrugLabContraindications([lisinopril], [k50]);
        expect(res50Lis).toHaveLength(1);
        expect(res50Lis[0].severity).toBe("critical");
        expect(res50Lis[0].biomarkerValue).toContain("5 mmol/L");

        const res50Spi = evaluateDrugLabContraindications([spironolactone], [k50]);
        expect(res50Spi).toHaveLength(1);
        expect(res50Spi[0].severity).toBe("critical");

        const res85Both = evaluateDrugLabContraindications([lisinopril, spironolactone], [k85]);
        expect(res85Both).toHaveLength(2);
      });

      it("evaluates eGFR zero, negative, critical (< 30), moderate (30-44), and normal (>= 45) for Metformin", () => {
        const egfrNeg: LabBiomarker = { testName: "eGFR", value: "-5 mL/min" };
        const egfrZero: LabBiomarker = { testName: "eGFR", value: "0 mL/min" };
        const egfr29: LabBiomarker = { testName: "eGFR", value: "29 mL/min" };
        const egfr30: LabBiomarker = { testName: "eGFR", value: "30 mL/min" };
        const egfr44: LabBiomarker = { testName: "eGFR", value: "44 mL/min" };
        const egfr45: LabBiomarker = { testName: "eGFR", value: "45 mL/min" };

        const resNeg = evaluateDrugLabContraindications([metformin], [egfrNeg]);
        expect(resNeg).toHaveLength(1);
        expect(resNeg[0].severity).toBe("critical");

        const resZero = evaluateDrugLabContraindications([metformin], [egfrZero]);
        expect(resZero).toHaveLength(1);
        expect(resZero[0].severity).toBe("critical");

        const res29 = evaluateDrugLabContraindications([metformin], [egfr29]);
        expect(res29).toHaveLength(1);
        expect(res29[0].severity).toBe("critical");

        const res30 = evaluateDrugLabContraindications([metformin], [egfr30]);
        expect(res30).toHaveLength(1);
        expect(res30[0].severity).toBe("moderate");

        const res44 = evaluateDrugLabContraindications([metformin], [egfr44]);
        expect(res44).toHaveLength(1);
        expect(res44[0].severity).toBe("moderate");

        const res45 = evaluateDrugLabContraindications([metformin], [egfr45]);
        expect(res45).toHaveLength(0);
      });

      it("evaluates Creatinine levels (> 1.5 moderate, > 2.5 critical) across ACEi, NSAID, Metformin", () => {
        const creat15: LabBiomarker = { testName: "Creatinine", value: "1.5 mg/dL" };
        const creat16: LabBiomarker = { testName: "Serum Creatinine", value: "1.6 mg/dL" };
        const creat26: LabBiomarker = { testName: "Creatinine", value: "2.6 mg/dL" };

        const ibu = createMockMed({ id: "m-ibu", genericName: "ibuprofen" });

        expect(evaluateDrugLabContraindications([lisinopril], [creat15])).toHaveLength(0);

        const res16Lis = evaluateDrugLabContraindications([lisinopril], [creat16]);
        expect(res16Lis).toHaveLength(1);
        expect(res16Lis[0].severity).toBe("moderate");

        const res26Ibu = evaluateDrugLabContraindications([ibu], [creat26]);
        expect(res26Ibu).toHaveLength(1);
        expect(res26Ibu[0].severity).toBe("critical");
      });

      it("evaluates Statins with ALT/AST elevated > 120 U/L or HIGH flags", () => {
        const alt120: LabBiomarker = { testName: "ALT", value: "120 U/L" };
        const alt121: LabBiomarker = { testName: "ALT (SGPT)", value: "121 U/L" };
        const astFlag: LabBiomarker = { testName: "AST", value: "Normal 35", flag: "HIGH" };

        expect(evaluateDrugLabContraindications([atorvastatin], [alt120])).toHaveLength(0);

        const res121 = evaluateDrugLabContraindications([atorvastatin], [alt121]);
        expect(res121).toHaveLength(1);
        expect(res121[0].severity).toBe("moderate");

        const resFlag = evaluateDrugLabContraindications([atorvastatin], [astFlag]);
        expect(resFlag).toHaveLength(1);
        expect(resFlag[0].severity).toBe("moderate");
      });

      it("evaluates Anticoagulants with INR > 3.5", () => {
        const inr35: LabBiomarker = { testName: "INR", value: "3.5" };
        const inr36: LabBiomarker = { testName: "Prothrombin Time / INR", value: "3.6" };

        expect(evaluateDrugLabContraindications([warfarin], [inr35])).toHaveLength(0);

        const res36 = evaluateDrugLabContraindications([warfarin], [inr36]);
        expect(res36).toHaveLength(1);
        expect(res36[0].severity).toBe("critical");
        expect(res36[0].title).toContain("Supratherapeutic INR");
      });

      it("evaluates Flag-only potassium elevation when numericValue is absent", () => {
        const kFlag: LabBiomarker = { testName: "Potassium", value: "Elevated", flag: "HIGH" };
        const res = evaluateDrugLabContraindications([lisinopril], [kFlag]);
        expect(res).toHaveLength(1);
        expect(res[0].severity).toBe("critical");
      });
    });

    describe("1.4 buildBioRegimenSafetySummary Calculation Rigor", () => {
      it("calculates overall risk level, critical alerts, warnings, and compatible pairs", () => {
        const meds: Medication[] = [
          createMockMed({ id: "m1", genericName: "lisinopril" }),
          createMockMed({ id: "m2", genericName: "metformin" }),
          createMockMed({ id: "m3", genericName: "atorvastatin" })
        ];

        const labs: LabBiomarker[] = [
          { testName: "Potassium", value: "5.4 mmol/L" },
          { testName: "eGFR", value: "35 mL/min" }
        ];

        const mockDDI: any[] = [
          { id: "ddi-1", drugA: "lisinopril", drugB: "metformin", severity: "moderate", description: "Monitor" }
        ];

        const summary = buildBioRegimenSafetySummary(meds, labs, mockDDI);

        expect(summary.overallRiskLevel).toBe("critical");
        expect(summary.criticalAlertCount).toBe(1);
        expect(summary.warningCount).toBe(2);
        expect(summary.totalMedicationsCount).toBe(3);
        expect(summary.totalBiomarkersCount).toBe(2);
        expect(summary.compatibleCount).toBe(2);
      });

      it("returns safe risk level when no contraindications or interactions exist", () => {
        const meds: Medication[] = [
          createMockMed({ id: "m1", genericName: "atorvastatin" })
        ];
        const labs: LabBiomarker[] = [
          { testName: "ALT", value: "25 U/L" }
        ];

        const summary = buildBioRegimenSafetySummary(meds, labs, []);
        expect(summary.overallRiskLevel).toBe("safe");
        expect(summary.criticalAlertCount).toBe(0);
        expect(summary.warningCount).toBe(0);
      });
    });
  });

  // =========================================================================
  // 2. generateDoctorReport PDF Synthesis Stress Tests
  // =========================================================================
  describe("2. generateDoctorReport PDF Synthesis Stress Tests", () => {

    it("generates a valid PDF Blob with complete data payload", async () => {
      const sbar: SBAROutput = {
        situation: "Patient presented with elevated HbA1c and Serum Potassium.",
        background: "History of Type 2 Diabetes and Hypertension treated with Lisinopril.",
        assessment: ["HbA1c increased from 6.8% to 7.4%", "Potassium elevated at 5.2 mmol/L"],
        recommendation: ["Evaluate RAAS inhibitor therapy", "Repeat electrolyte panel in 14 days"]
      };

      const trendSummaries: TrendSummary[] = [
        { biomarker: "HbA1c", direction: "worsened", deltaPercent: 8.8 },
        { biomarker: "eGFR", direction: "improved", deltaPercent: -4.2 }
      ];

      const flaggedObservations: LabObservation[] = [
        { testName: "Potassium", value: 5.2, unit: "mmol/L", flag: "HIGH", referenceRange: "3.5 - 5.0" },
        { testName: "HbA1c", value: "7.4", unit: "%", flag: "CRITICAL", referenceRange: "< 5.7" }
      ];

      const pdfBlob = await generateDoctorReport({
        profile: { name: "Alice Smith", age: 48, sex: "Female", conditions: ["Hypertension", "Diabetes"] },
        sbar,
        trendSummaries,
        flaggedObservations,
        reportDateRange: { from: "2026-01-01", to: "2026-06-01" }
      });

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(500);
    });

    it("handles empty / missing profile properties gracefully without crashing", async () => {
      const pdfBlob = await generateDoctorReport({
        profile: { name: "" },
        sbar: { situation: "", background: "", assessment: [], recommendation: [] },
        trendSummaries: [],
        flaggedObservations: [],
        reportDateRange: { from: "", to: "" }
      });

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(500);
    });

    it("handles large dataset with 50+ flagged observations and long text entries without overflowing", async () => {
      const largeObservations: LabObservation[] = Array.from({ length: 50 }, (_, i) => ({
        testName: `Biomarker Complex Test Parameter #${i + 1} with Extra Long Clinical Title Name`,
        value: (10 + i * 0.5).toFixed(1),
        unit: "mg/dL",
        flag: i % 3 === 0 ? "CRITICAL" : "HIGH",
        referenceRange: "0.0 - 5.0"
      }));

      const largeTrends: TrendSummary[] = Array.from({ length: 25 }, (_, i) => ({
        biomarker: `Trended Marker #${i + 1}`,
        direction: i % 2 === 0 ? "up" : "down",
        deltaPercent: (i * 1.5).toFixed(1)
      }));

      const pdfBlob = await generateDoctorReport({
        profile: { name: "Stress Test Patient", age: 65, sex: "Male", conditions: Array.from({ length: 10 }, (_, i) => `Condition ${i}`) },
        sbar: {
          situation: "Extremely detailed situation summary string ".repeat(20),
          background: "Extremely detailed background summary string ".repeat(20),
          assessment: Array.from({ length: 15 }, (_, i) => `Assessment line item #${i + 1}: ${"details ".repeat(10)}`),
          recommendation: Array.from({ length: 15 }, (_, i) => `Recommendation line item #${i + 1}: ${"details ".repeat(10)}`)
        },
        trendSummaries: largeTrends,
        flaggedObservations: largeObservations,
        reportDateRange: { from: "2025-01-01", to: "2026-08-08" }
      });

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(5000);
    });
  });

  // =========================================================================
  // 3. pdfExportService.ts DOM-to-PDF & Trend Narrative Stress Tests
  // =========================================================================
  describe("3. pdfExportService.ts DOM-to-PDF & Trend Narrative Stress Tests", () => {
    it("throws error when elementId is not found in DOM", async () => {
      await expect(exportToPDF("non-existent-dom-element", "test.pdf")).rejects.toThrow(
        "Element with id non-existent-dom-element not found."
      );
    });

    it("generates trend narrative safely and falls back on error", async () => {
      const narrative = await generateTrendNarrative(JSON.stringify([{ marker: "Glucose", trend: "+12%" }]), "6 months");
      expect(narrative.narrative_paragraphs).toBeDefined();
      expect(narrative.overall_summary).toBeDefined();
      expect(narrative.disclaimer).toBeDefined();
    });
  });

  // =========================================================================
  // 4. sbarGenerationService.ts SBAR Generation & Cache Stress Tests
  // =========================================================================
  describe("4. sbarGenerationService.ts Stress Tests", () => {
    const mockProfile: any = {
      id: "p-123",
      name: "John Doe",
      dob: "1980-01-01",
      gender: "Male",
      chronicConditions: ["Hypertension"]
    };

    it("generates SBAR report successfully", async () => {
      const result = await generateSBAR("user-1", mockProfile, true);
      expect(result).toContain("SBAR CLINICAL SUMMARY");
      expect(result).toContain("S - SITUATION");
      expect(result).toContain("B - BACKGROUND");
      expect(result).toContain("A - ASSESSMENT");
      expect(result).toContain("R - RECOMMENDATION");
    });

    it("uses cached SBAR report when available and forceRefresh is false", async () => {
      const result = await generateSBAR("cached-user", mockProfile, false);
      expect(result).toBe("CACHED SBAR REPORT CONTENT");
    });

    it("bypasses cache when forceRefresh is true", async () => {
      const result = await generateSBAR("cached-user", mockProfile, true);
      expect(result).not.toBe("CACHED SBAR REPORT CONTENT");
      expect(result).toContain("SBAR CLINICAL SUMMARY");
    });
  });
});
