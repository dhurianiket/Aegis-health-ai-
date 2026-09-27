import { describe, it, expect } from "vitest";
import { buildLoungeGeminiHistory, type LoungeMessage } from "../loungeHistory";
import { buildEmergencyTranscript, triageMessage } from "../../safety/triage";

const t = new Date("2026-09-27T00:00:00Z");

describe("buildLoungeGeminiHistory", () => {
  it("excludes flagged triage turns (crisis message + fixed card)", () => {
    const triage = triageMessage("I can't breathe");
    const msgs: LoungeMessage[] = [
      { role: "user", content: "What is HbA1c?", timestamp: t },
      { role: "assistant", content: "HbA1c reflects average sugar.", timestamp: t },
      { role: "user", content: "I can't breathe", timestamp: t, kind: "triage" },
      { role: "assistant", content: buildEmergencyTranscript(triage), timestamp: t, kind: "triage" },
      { role: "user", content: "Thanks, feeling fine now. What is LDL?", timestamp: t },
    ];
    const history = buildLoungeGeminiHistory(msgs);
    const texts = history.map((h) => h.parts[0].text);
    expect(texts).toEqual(["What is HbA1c?", "HbA1c reflects average sugar.", "Thanks, feeling fine now. What is LDL?"]);
    expect(history.map((h) => h.role)).toEqual(["user", "model", "user"]);
  });

  it("also excludes legacy unflagged triage turns saved before the flag existed", () => {
    const legacyCard = "⚠️ **This may be a medical emergency. The AI specialist has not answered this message.**\n\nCall **112** now.";
    const msgs: LoungeMessage[] = [
      { role: "user", content: "seene me dard", timestamp: t },
      { role: "assistant", content: legacyCard, timestamp: t },
      { role: "user", content: "hello", timestamp: t },
    ];
    expect(buildLoungeGeminiHistory(msgs).map((h) => h.parts[0].text)).toEqual(["hello"]);
  });
});
