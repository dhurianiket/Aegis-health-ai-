/**
 * SafetyGuardrail - Filters and validates AI outputs for clinical safety.
 */

const FORBIDDEN_PHRASES = [
  "I diagnose you with",
  "You have been diagnosed",
  "You must stop taking",
  "Stop your medication",
  "You don't need to see a doctor",
  "This is a cure for",
];

const MANDATORY_DISCLAIMERS = [
  "Not a medical diagnosis",
  "Consult your physician",
  "In case of emergency, call 911",
];

const FALLBACK_DISCLAIMER = "\n\n---\n*DISCLAIMER: This information is for educational purposes only and is not a medical diagnosis. Always consult your physician before making any changes to your treatment plan.*";

export interface SafetyCheckResult {
  passed: boolean;
  modifiedContent: string;
  flags: string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const runSafetyCheck = (content: string): SafetyCheckResult => {
  try {
    const flags: string[] = [];
    let modifiedContent = content;

    FORBIDDEN_PHRASES.forEach((phrase) => {
      if (modifiedContent.toLowerCase().includes(phrase.toLowerCase())) {
        flags.push(`Forbidden Phrase Detected: ${phrase}`);
        modifiedContent = modifiedContent.replace(
          new RegExp(escapeRegExp(phrase), "gi"),
          "[Please consult your doctor regarding this specific recommendation]",
        );
      }
    });

    const hasDisclaimer = MANDATORY_DISCLAIMERS.some((d) =>
      content.toLowerCase().includes(d.toLowerCase()),
    );

    if (!hasDisclaimer) {
      flags.push("Missing mandatory disclaimer");
      modifiedContent += FALLBACK_DISCLAIMER;
    }

    return {
      passed: flags.length === 0,
      modifiedContent,
      flags,
    };
  } catch (error) {
    console.error("Safety check failed:", error);
    // Fail closed for `passed` so callers (useCoach) apply modifiedContent.
    const safeContent =
      typeof content === "string" && content.length > 0
        ? content + FALLBACK_DISCLAIMER
        : FALLBACK_DISCLAIMER.trim();
    return {
      passed: false,
      modifiedContent: safeContent,
      flags: ["Internal Safety Filter Error"],
    };
  }
};
