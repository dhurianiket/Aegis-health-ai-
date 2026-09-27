import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// User-facing copy and prompts must not present the AI as a doctor.
const FILES = [
  "src/services/ai/coachService.ts",
  "src/services/sbarGenerationService.ts",
  "src/services/ai/promptFramework.ts",
  "src/components/LandingPage/LandingPage.tsx",
  "src/components/AIHelper/ChatCoach.tsx",
  "src/components/Export/ShareReport.tsx",
  "src/components/Dashboard/SBARPreview.tsx",
];

describe("no 'AI Doctor' wording in coach / SBAR / landing copy", () => {
  it.each(FILES)("%s", (file) => {
    const src = readFileSync(resolve(process.cwd(), file), "utf8");
    expect(src).not.toMatch(/AI\s*Doctor|AI\s*DR\b|AI\s*Dr\.|Dr\.?\s*XAI/i);
  });

  it("landing page uses 'Doctor Visit Prep'", () => {
    const src = readFileSync(resolve(process.cwd(), "src/components/LandingPage/LandingPage.tsx"), "utf8");
    expect(src).toContain("Doctor Visit Prep");
  });
});
