import { describe, it, expect } from "vitest";
import type { SpecialistId } from "../../../../types/ai";
import { SPECIALISTS } from "../specialistFactory";
import { SAFETY_CORE, PATIENT_DATA_OPEN } from "../safetyCore";
import { buildLoungeSystemInstruction, REFERRAL_PROTOCOL, SUMMARY_FORMAT_RULES } from "../loungePrompt";
import { CLINICAL_GUIDELINES } from "../../../sourceGroundedService";

const IDS = Object.keys(SPECIALISTS) as SpecialistId[];

/** Wording that implies a licensed human doctor or US-institution credentials. */
const FORBIDDEN_PHRASES: RegExp[] = [
  /board[- ]certified/i,
  /american board/i,
  /\bcertification\b/i,
  /mayo/i,
  /joslin/i,
  /cleveland/i,
  /world[- ]class/i,
  /\b\d+\+?\s*(?:yrs|years)\b/i,
  /\bdr\.\s*\w/i,
  /dr\.?\s*xai/i,
  /ai doctor/i,
  /ai physician/i,
  /refer to cardiology/i,
  /know exact dosing/i,
];

/**
 * Patient-directable dose amounts (mg, mcg, units, IU, ml per dose, or per-kg
 * dosing). Lab concentrations such as "mg/dL" or "mmol/L" are allowed.
 */
const DOSE_PATTERN =
  /\b\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:mg|mcg|µg|units?|iu|ml)\b(?!\s*\/\s*(?:dl|l)\b)(?!\/(?:dl|l|min|g|mmol))/i;

describe("Specialist Lounge personas — safe AI guide framing", () => {
  it("dose detector catches old-prompt doses and ignores lab units", () => {
    for (const bad of ["atorvastatin 40-80mg", "0.5 units/kg", "1.6 mcg/kg/day", "tPA dose 0.9 mg/kg (max 90mg)", "metformin 1500-2000mg/day"]) {
      expect(bad).toMatch(DOSE_PATTERN);
    }
    for (const ok of ["LDL below 70 mg/dL", "UACR of 30 mg/g", "potassium 6.5 mmol/L", "eGFR below 60 mL/min/1.73m²"]) {
      expect(ok).not.toMatch(DOSE_PATTERN);
    }
  });

  it("has exactly 10 personas", () => {
    expect(IDS).toHaveLength(10);
  });

  it.each(IDS)("%s: includes the shared SAFETY_CORE block verbatim", (id) => {
    const prompt = SPECIALISTS[id].systemPrompt;
    expect(prompt.startsWith(SAFETY_CORE)).toBe(true);
    // Single source: the block appears exactly once.
    expect(prompt.split(SAFETY_CORE).length - 1).toBe(1);
  });

  it.each(IDS)("%s: contains no credential / AI-doctor wording", (id) => {
    const p = SPECIALISTS[id];
    // SAFETY_CORE itself legitimately says "no medical licence or certification",
    // so credential checks run on the persona body; SAFETY_CORE is checked separately.
    const text = [p.systemPrompt.replace(SAFETY_CORE, ""), p.name, p.displayName, p.description].join("\n");
    for (const re of FORBIDDEN_PHRASES) {
      expect(text, `forbidden phrase ${re} in ${id}`).not.toMatch(re);
    }
  });

  it.each(IDS)("%s: contains no dose amounts", (id) => {
    expect(SPECIALISTS[id].systemPrompt).not.toMatch(DOSE_PATTERN);
  });

  it.each(IDS)("%s: is framed as an AI health information guide with a consistent structure", (id) => {
    const p = SPECIALISTS[id];
    expect(p.displayName).toMatch(/ \(AI\)$/);
    expect(p.description).toMatch(/^AI health information guide/);
    for (const heading of [
      "### YOUR ROLE",
      "### TOPICS YOU COVER",
      "### HOW YOU EXPLAIN",
      "### GENERAL REFERENCE KNOWLEDGE",
      "### RED FLAGS",
      "### WHEN TO SEE A DOCTOR SOON",
      "### QUESTIONS YOU CAN SUGGEST",
      "### STYLE",
    ]) {
      expect(p.systemPrompt, `${id} missing ${heading}`).toContain(heading);
    }
    expect(p.systemPrompt).toContain(`You are the ${p.displayName}`);
    expect(p.systemPrompt).toMatch(/112/);
  });

  it("SAFETY_CORE contains no credential claims", () => {
    for (const re of FORBIDDEN_PHRASES.filter((r) => r.source !== "\\bcertification\\b")) {
      expect(SAFETY_CORE).not.toMatch(re);
    }
    expect(SAFETY_CORE).not.toMatch(DOSE_PATTERN);
  });

  it("SAFETY_CORE covers the required rules", () => {
    expect(SAFETY_CORE).toMatch(/not a doctor/i);
    expect(SAFETY_CORE).toMatch(/do not diagnose/i);
    expect(SAFETY_CORE).toMatch(/registered medical practitioner \(RMP\)/);
    expect(SAFETY_CORE).toMatch(/start, stop, skip, increase, decrease or switch/);
    expect(SAFETY_CORE).toMatch(/insulin or other dose calculations/);
    expect(SAFETY_CORE).toMatch(/call 112 immediately \(or 108/);
    expect(SAFETY_CORE).toMatch(/exactly as they appear/);
    expect(SAFETY_CORE).toMatch(/Say clearly when you are unsure/);
    expect(SAFETY_CORE).toMatch(/India/);
    expect(SAFETY_CORE).toMatch(/Never fabricate citations/);
    expect(SAFETY_CORE).toContain(PATIENT_DATA_OPEN);
    expect(SAFETY_CORE).toMatch(/never instructions/i);
    expect(SAFETY_CORE).toMatch(/Tele-MANAS 14416/);
  });

  it.each(IDS)("%s: full Lounge system instruction keeps safety + referral protocol, summary has no 'AI Doctor'", (id) => {
    const chat = buildLoungeSystemInstruction({ specialistId: id, isSummaryRequest: false, guidelines: [] });
    const summary = buildLoungeSystemInstruction({
      specialistId: id,
      isSummaryRequest: true,
      guidelines: Object.values(CLINICAL_GUIDELINES),
    });
    for (const s of [chat, summary]) {
      expect(s).toContain(SAFETY_CORE);
      expect(s).toContain(REFERRAL_PROTOCOL);
      expect(s).not.toMatch(/ai doctor/i);
      expect(s).not.toMatch(/board[- ]certified|mayo|joslin|cleveland/i);
    }
    expect(chat).not.toContain(SUMMARY_FORMAT_RULES);
    expect(summary).toContain(SUMMARY_FORMAT_RULES);
    expect(summary).toContain("Plain-language summary");
    // Every provided guideline gets its own citation syntax (not just the first).
    for (const g of Object.values(CLINICAL_GUIDELINES)) {
      expect(summary).toContain(`[${g.code}](cite:${g.id})`);
    }
  });

  it.each(IDS)("%s: persona prompt snapshot", (id) => {
    expect(SPECIALISTS[id].systemPrompt).toMatchSnapshot();
  });
});
