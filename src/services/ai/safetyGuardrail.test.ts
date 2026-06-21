import { describe, it, expect } from "vitest";
import { runSafetyCheck } from "./safetyGuardrail";

describe("AI Safety Guardrails", () => {
  it("should catch and modify forbidden phrases", () => {
    const input =
      "Based on your labs, I diagnose you with diabetes. You must stop taking metformin.";
    const result = runSafetyCheck(input);

    expect(result.passed).toBe(false);
    expect(result.flags).toContain(
      "Forbidden Phrase Detected: I diagnose you with",
    );
    expect(result.flags).toContain(
      "Forbidden Phrase Detected: You must stop taking",
    );
    expect(result.modifiedContent).toContain(
      "[Please consult your doctor regarding this specific recommendation]",
    );
  });

  it("should append disclaimer if missing", () => {
    const input = "Your blood sugar is elevated.";
    const result = runSafetyCheck(input);

    expect(result.passed).toBe(false);
    expect(result.flags).toContain("Missing mandatory disclaimer");
    expect(result.modifiedContent).toContain(
      "*DISCLAIMER: This information is for educational purposes only and is not a medical diagnosis",
    );
  });

  it("should pass content that already has disclaimer and no forbidden phrases", () => {
    const input = "Your blood sugar is elevated. Not a medical diagnosis.";
    const result = runSafetyCheck(input);

    expect(result.passed).toBe(true);
    expect(result.flags.length).toBe(0);
    expect(result.modifiedContent).toBe(input);
  });
});
