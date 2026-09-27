import { describe, it, expect, vi } from "vitest";

vi.mock("../../../lib/firebase/firestore", () => ({
  getLabHistory: vi.fn().mockResolvedValue([]),
  getMedications: vi.fn().mockResolvedValue([]),
  getLatestInsights: vi.fn().mockResolvedValue([]),
  getDocuments: vi.fn().mockResolvedValue([]),
  getCoachChat: vi.fn().mockResolvedValue([]),
  getActiveReferrals: vi.fn().mockResolvedValue([]),
  getAllSpecialistChats: vi.fn().mockResolvedValue([
    {
      specialistId: "cardiologist",
      messages: [
        { role: "user", content: "What is LDL?" },
        { role: "assistant", content: "LDL is a type of cholesterol." },
        { role: "user", content: "mujhe marna chahta hu", kind: "triage" },
        { role: "assistant", content: "⚠️ **This may be a medical emergency. The AI guide has not answered this message.**", kind: "triage" },
      ],
    },
    {
      specialistId: "psychiatrist",
      messages: [
        { role: "user", content: "I can't breathe" },
        { role: "assistant", content: "⚠️ **This may be a medical emergency. The AI specialist has not answered this message.**" },
      ],
    },
  ]),
}));

import { getPatientContext, formatContextForPrompt } from "../contextService";
import type { UserProfile } from "../../../types/medical";

describe("getPatientContext — triage turns never propagate to other guides", () => {
  it("drops crisis messages and emergency cards from cross-guide notes and symptoms", async () => {
    const ctx = await getPatientContext("synthetic-user", { id: "synthetic-profile", name: "Synthetic" } as UserProfile);
    const prompt = formatContextForPrompt(ctx, { includeName: false });
    expect(prompt).not.toContain("marna");
    expect(prompt).not.toContain("can't breathe");
    expect(prompt).not.toContain("medical emergency");
    expect(prompt).toContain("LDL is a type of cholesterol.");
    expect(ctx.specialistConsultations?.map((c) => c.specialistId)).toEqual(["cardiologist"]);
  });
});
