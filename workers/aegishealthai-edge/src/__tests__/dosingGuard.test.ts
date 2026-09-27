import { describe, it, expect } from "vitest";
import {
  SAFE_DOSING_REPLY,
  applyLoungeOutputGuard,
  clampLoungeGenerationConfig,
  detectPatientDirectedDosing,
  extractDoseAmounts,
  resolveFeature,
} from "../dosingGuard";

describe("detectPatientDirectedDosing", () => {
  it.each([
    "Take metformin 500 mg twice daily with food.",
    "You should increase your insulin to 12 units at night.",
    "Start atorvastatin 40 mg at bedtime.",
    "Inject 10 units before breakfast.",
    "Your total daily insulin dose is 0.5 units/kg.",
    "Levothyroxine is dosed at 1.6 mcg/kg/day.",
    "Take 60,000 IU of vitamin D weekly.",
    "Reduce the dose to 2.5 mg.",
    "Take 2 tablets after dinner.",
    "Use 2 puffs of your inhaler every 4 hours.",
    // Hinglish
    "Aap raat ko 10 units insulin lagao.",
    "Metformin 500 mg subah lijiye.",
    "Dose badhao 20 units tak.",
    "Roz 1 goli khao.",
    // Hindi
    "रोज़ 500 मिलीग्राम लें।",
    "इंसुलिन 10 यूनिट बढ़ाएं।",
  ])("flags patient-directed dosing: %j", (text) => {
    expect(detectPatientDirectedDosing(text).matched).toBe(true);
  });

  it.each([
    "Your HbA1c is 7.9 % and fasting glucose is 142 mg/dL.",
    "LDL below 70 mg/dL is a common goal for people at very high risk.",
    "Your TSH is 5.2 mIU/L and vitamin D is 18 ng/mL.",
    "eGFR of 58 mL/min/1.73m² and UACR of 45 mg/g were reported.",
    "Potassium 5.1 mmol/L is within the report's range.",
    "Statins lower cholesterol; please ask your doctor whether one is right for you.",
    "Please discuss any change in your medicines with a registered medical practitioner.",
    "Take a 10 minute walk after meals.",
    "Insulin works like a key that lets sugar into cells.",
  ])("does not flag educational text / lab values: %j", (text) => {
    expect(detectPatientDirectedDosing(text).matched).toBe(false);
  });

  it("allows restating a recorded prescription, but not new amounts", () => {
    const known = new Set(extractDoseAmounts("ACTIVE MEDICATIONS:\n- Metformin: 500mg twice daily"));
    expect(detectPatientDirectedDosing("Your record says you take metformin 500 mg twice daily.", { knownDoses: known }).matched).toBe(false);
    expect(detectPatientDirectedDosing("Take metformin 1000 mg instead.", { knownDoses: known }).matched).toBe(true);
    // Change verbs are always flagged, even with a recorded amount.
    expect(detectPatientDirectedDosing("Increase metformin to 500 mg.", { knownDoses: known }).matched).toBe(true);
  });

  it("canonicalises dose amounts", () => {
    expect(extractDoseAmounts("500 mg, 10 Units, 2 tablets, 60,000 IU")).toEqual(["500mg", "10unit", "2tab", "60000iu"]);
  });
});

describe("applyLoungeOutputGuard", () => {
  const response = (text: string) => ({
    candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }],
    usageMetadata: { totalTokenCount: 10 },
    modelVersion: "gemini-3.8-flash",
  });

  it("replaces a dosing reply with the fixed safe message and keeps metadata", () => {
    const out = applyLoungeOutputGuard(response("Sure. Take 20 units of insulin tonight."));
    expect(out.replaced).toBe(true);
    const payload = out.payload as ReturnType<typeof response>;
    expect(payload.candidates).toHaveLength(1);
    expect(payload.candidates[0].content.parts[0].text).toBe(SAFE_DOSING_REPLY);
    expect(payload.modelVersion).toBe("gemini-3.8-flash");
    expect(SAFE_DOSING_REPLY).toMatch(/registered medical practitioner \(RMP\)/);
    expect(SAFE_DOSING_REPLY).toMatch(/112/);
  });

  it("passes safe replies through untouched", () => {
    const original = response("HbA1c reflects average sugar over about 3 months.");
    const out = applyLoungeOutputGuard(original);
    expect(out.replaced).toBe(false);
    expect(out.payload).toBe(original);
  });

  it("uses request contents as the recorded-dose whitelist", () => {
    const contents = [{ role: "user", parts: [{ text: "<patient_data>\n- Amlodipine: 5 mg daily\n</patient_data>" }, { text: "what are my meds?" }] }];
    expect(applyLoungeOutputGuard(response("You take amlodipine 5 mg daily."), contents).replaced).toBe(false);
  });

  it("ignores thought parts", () => {
    const payload = { candidates: [{ content: { parts: [{ text: "take 20 units", thought: true }, { text: "General info only." }] } }] };
    expect(applyLoungeOutputGuard(payload).replaced).toBe(false);
  });
});

describe("feature flag + token clamp", () => {
  it("reads the feature from header first, then body", () => {
    expect(resolveFeature("Specialist", {})).toBe("specialist");
    expect(resolveFeature(null, { aegisFeature: "specialist" })).toBe("specialist");
    expect(resolveFeature(null, { contents: [] })).toBeNull();
  });

  it("clamps Lounge maxOutputTokens server-side", () => {
    expect(clampLoungeGenerationConfig({ temperature: 0.1, maxOutputTokens: 99999 })).toEqual({ temperature: 0.1, maxOutputTokens: 4096 });
    expect(clampLoungeGenerationConfig(undefined)).toEqual({ maxOutputTokens: 1536 });
    expect(clampLoungeGenerationConfig({ maxOutputTokens: 1024 })).toEqual({ maxOutputTokens: 1024 });
  });
});
