import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  analyzeBiochemicalDrugClash,
  calculateHeuristicClash,
} from "../biochemicalClashService";
import { __setNimFetchForTests } from "../nvidiaNimService";

describe("Biochemical Drug-Drug Clash Engine (Pillar 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    __setNimFetchForTests(null);
  });

  it("should evaluate molecular and metabolic CYP450 clashes using NVIDIA Nemotron", async () => {
    const mockClashResponse = {
      cytochromeP450Clash: {
        hasEnzymeConflict: true,
        enzymesInvolved: ["CYP3A4"],
        mechanism: "competitive_inhibition",
        clinicalImpact: "Clarithromycin potent CYP3A4 inhibition elevates Simvastatin AUC up to 10-fold, escalating rhabdomyolysis risk.",
      },
      pharmacodynamicSynergy: {
        qtProlongationRisk: "moderate",
        hyperkalemiaRisk: "none",
        bleedingRiskEscalation: "none",
        serotoninSyndromeRisk: "none",
      },
      toxicityScore: 89,
      toxicityLevel: "critical_toxicity",
      molecularRecommendation: "Contraindicated combination. Discontinue simvastatin during macrolide therapy or switch to rosuvastatin/pravastatin.",
    };

    __setNimFetchForTests(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          model: "nvidia/nemotron-3.5-bolt-e4b",
          choices: [{ message: { content: JSON.stringify(mockClashResponse) } }],
        }),
      } as unknown as Response),
    );

    const result = await analyzeBiochemicalDrugClash("Simvastatin", "Clarithromycin");

    expect(result.cytochromeP450Clash.hasEnzymeConflict).toBe(true);
    expect(result.cytochromeP450Clash.enzymesInvolved).toContain("CYP3A4");
    expect(result.toxicityScore).toBe(89);
    expect(result.toxicityLevel).toBe("critical_toxicity");
    expect(result.engine).toBe("NVIDIA Nemotron Biochemical Engine");
  });

  it("should fall back gracefully to heuristic calculation when NIM is offline", async () => {
    __setNimFetchForTests(
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => "Service Unavailable",
      } as unknown as Response),
    );

    // RAAS + Spironolactone (Lisinopril + Spironolactone)
    const result = await analyzeBiochemicalDrugClash("Lisinopril", "Spironolactone");

    expect(result.pharmacodynamicSynergy.hyperkalemiaRisk).toBe("critical");
    expect(result.toxicityLevel).toBe("critical_toxicity");
    expect(result.engine).toBe("Pharmacological Heuristic Fallback");
  });

  it("should compute safe interaction baseline for compatible drugs", () => {
    const baseline = calculateHeuristicClash("Metformin", "Paracetamol");
    expect(baseline.toxicityScore).toBeLessThan(30);
    expect(baseline.toxicityLevel).toBe("safe");
  });
});
