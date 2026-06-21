import { describe, it, expect } from "vitest";
import { COACH_SYSTEM_INSTRUCTION } from "./coachService";

describe("Coach Service System Prompt Safety Guardrails", () => {
  it("should contain mandatory clinical safety rules", () => {
    expect(COACH_SYSTEM_INSTRUCTION).toContain(
      "NEVER diagnose conditions or prescribe medications",
    );
    expect(COACH_SYSTEM_INSTRUCTION).toContain(
      "ALWAYS recommend consulting a healthcare professional for medical decisions",
    );
    expect(COACH_SYSTEM_INSTRUCTION).toContain(
      "I cannot diagnose you. Please consult a doctor.",
    );
    expect(COACH_SYSTEM_INSTRUCTION).toContain("Flag critical values");
  });

  it("should contain edge case handling rules", () => {
    expect(COACH_SYSTEM_INSTRUCTION).toContain("Conflicting values");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("Missing markers");
    expect(COACH_SYSTEM_INSTRUCTION).toContain("Extreme outliers");
  });
});
