import { describe, it, expect } from "vitest";
import type { SpecialistId } from "../../../../types/ai";
import { SPECIALISTS } from "../specialistFactory";
import { CLINICAL_GUIDELINES, lookupRelevantGuidelines } from "../../../sourceGroundedService";

const ALL_SPECIALIST_IDS = Object.keys(SPECIALISTS) as SpecialistId[];

describe("Specialist Lounge Clinical Guidelines Grounding", () => {
  it("has exactly 10 specialists defined in SPECIALISTS", () => {
    expect(ALL_SPECIALIST_IDS).toHaveLength(10);
  });

  it.each(ALL_SPECIALIST_IDS)("%s: has at least 2 relevant clinical guidelines", (id) => {
    const guidelines = lookupRelevantGuidelines("", id);
    expect(guidelines.length).toBeGreaterThanOrEqual(2);
  });

  it.each(ALL_SPECIALIST_IDS)("%s: is grounded in both Indian and International authorities", (id) => {
    const guidelines = lookupRelevantGuidelines("", id);
    const hasIndia = guidelines.some((g) => g.region === "India");
    const hasInternational = guidelines.some((g) => g.region === "International");

    expect(hasIndia, `${id} should have at least one Indian clinical guideline`).toBe(true);
    expect(hasInternational, `${id} should have at least one International clinical guideline`).toBe(true);
  });

  it("every guideline in CLINICAL_GUIDELINES has required metadata and valid URLs", () => {
    for (const [key, guideline] of Object.entries(CLINICAL_GUIDELINES)) {
      expect(guideline.id).toBe(key);
      expect(guideline.code).toBeTruthy();
      expect(guideline.title).toBeTruthy();
      expect(guideline.organization).toBeTruthy();
      expect(guideline.summary).toBeTruthy();
      expect(guideline.evidenceLevel).toBeTruthy();
      expect(guideline.url).toMatch(/^https?:\/\//);
    }
  });

  it.each(ALL_SPECIALIST_IDS)("%s: specialist profile metadata lists guidelines matching clinical scope", (id) => {
    const profile = SPECIALISTS[id];
    expect(profile.guidelines.length).toBeGreaterThanOrEqual(2);
    // At least one guideline should mention an Indian or national guideline keyword
    const hasIndianReference = profile.guidelines.some(
      (g) => /ICMR|IHCI|RSSDI|ISG|IADVL|IOA|NCG|Tele-MANAS/i.test(g)
    );
    expect(hasIndianReference, `${id} profile metadata should reference an Indian guideline`).toBe(true);
  });

  it.each(ALL_SPECIALIST_IDS)("%s: has high-yield starter prompt chips complying with safety rules", async (id) => {
    const { SPECIALIST_STARTER_PROMPTS } = await import("../../../../components/Specialists/SpecialistLounge");
    const prompts = SPECIALIST_STARTER_PROMPTS[id];
    expect(prompts).toBeDefined();
    expect(prompts.length).toBeGreaterThanOrEqual(3);

    for (const prompt of prompts) {
      expect(prompt.trim().length).toBeGreaterThan(10);
      // Must not make doctor credential claims
      expect(prompt).not.toMatch(/\bdr\.\s*\w/i);
      expect(prompt).not.toMatch(/board[- ]certified/i);
      expect(prompt).not.toMatch(/ai doctor/i);
    }
  });
});
