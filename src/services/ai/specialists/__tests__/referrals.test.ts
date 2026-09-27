import { describe, it, expect } from "vitest";
import { MAX_REFERRAL_REASON_LENGTH, parseReferralSuggestions, stripReferralTags } from "../referrals";

describe("referral tag handling", () => {
  it("parses valid tags into suggestions and strips them from the displayed text", () => {
    const reply = "Your eGFR is lower than before.\n[REFERRAL: nephrologist | eGFR trend worth reviewing]\nPlease discuss with your doctor.";
    const { cleanText, suggestions } = parseReferralSuggestions(reply, "cardiologist");
    expect(suggestions).toEqual([{ toSpecialist: "nephrologist", reason: "eGFR trend worth reviewing" }]);
    expect(cleanText).not.toContain("[REFERRAL");
    expect(cleanText).toContain("Please discuss with your doctor.");
  });

  it("drops unknown ids, self-referrals, duplicates and empty reasons; caps reason length", () => {
    const long = "x".repeat(500);
    const reply = [
      "[REFERRAL: surgeon | not a guide]",
      "[REFERRAL: cardiologist | self]",
      `[REFERRAL: NEPHROLOGIST | ${long}]`,
      "[REFERRAL: nephrologist | duplicate]",
      "[REFERRAL: dermatologist | ]",
    ].join(" ");
    const { cleanText, suggestions } = parseReferralSuggestions(reply, "cardiologist");
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].toSpecialist).toBe("nephrologist");
    expect(suggestions[0].reason).toHaveLength(MAX_REFERRAL_REASON_LENGTH);
    expect(cleanText).toBe("");
  });

  it("strips malformed tags too", () => {
    expect(stripReferralTags("Hello [REFERRAL: nephrologist] world")).toBe("Hello world");
  });
});
