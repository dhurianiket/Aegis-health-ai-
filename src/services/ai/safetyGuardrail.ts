/**
 * SafetyGuardrail - Filters and validates AI outputs for clinical safety.
 */

const FORBIDDEN_PHRASES = [
  "I diagnose you with",
  "You have [condition]",
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

export interface SafetyCheckResult {
  passed: boolean;
  modifiedContent: string;
  flags: string[];
}

export const runSafetyCheck = (content: string): SafetyCheckResult => {
  const flags: string[] = [];
  let modifiedContent = content;

  // 1. Check for forbidden prescriptive language
  FORBIDDEN_PHRASES.forEach((phrase) => {
    if (modifiedContent.toLowerCase().includes(phrase.toLowerCase())) {
      flags.push(`Forbidden Phrase Detected: ${phrase}`);
      // Replace with a safer alternative or just flag it
      modifiedContent = modifiedContent.replace(
        new RegExp(phrase, "gi"),
        "[Please consult your doctor regarding this specific recommendation]",
      );
    }
  });

  // 2. Ensure disclaimers are present if not already
  const hasDisclaimer = MANDATORY_DISCLAIMERS.some((d) =>
    content.toLowerCase().includes(d.toLowerCase()),
  );

  if (!hasDisclaimer) {
    flags.push("Missing mandatory disclaimer");
    modifiedContent +=
      "\n\n---\n*DISCLAIMER: This information is for educational purposes only and is not a medical diagnosis. Always consult your physician before making any changes to your treatment plan.*";
  }

  return {
    passed: flags.length === 0,
    modifiedContent,
    flags,
  };
};
