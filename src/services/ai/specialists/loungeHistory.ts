import { isEmergencyTranscript } from "../safety/triage";

/**
 * A Specialist Lounge chat message as held in UI state / Firestore.
 * `kind: "triage"` marks both the user's crisis message and the fixed
 * emergency-card reply; neither must ever be sent to Gemini.
 */
export interface LoungeMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  kind?: "triage";
}

export interface GeminiHistoryItem {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

/**
 * Returns the indexes of messages that belong to a deterministic triage turn:
 * any message flagged `kind: "triage"`, any stored emergency transcript
 * (for chats saved before the flag existed), and the user message that
 * immediately precedes such a transcript.
 */
export function getTriageMessageIndexes(messages: readonly LoungeMessage[]): Set<number> {
  const excluded = new Set<number>();
  messages.forEach((m, i) => {
    const isTriageReply = m.role === "assistant" && (m.kind === "triage" || isEmergencyTranscript(m.content));
    if (m.kind === "triage") excluded.add(i);
    if (isTriageReply) {
      excluded.add(i);
      const prev = messages[i - 1];
      if (prev && prev.role === "user") excluded.add(i - 1);
    }
  });
  return excluded;
}

/** Builds the Gemini `history` for a Lounge turn, excluding triage turns and empty messages. */
export function buildLoungeGeminiHistory(messages: readonly LoungeMessage[]): GeminiHistoryItem[] {
  const excluded = getTriageMessageIndexes(messages);
  const history: GeminiHistoryItem[] = [];
  messages.forEach((m, i) => {
    if (excluded.has(i)) return;
    const text = String(m.content ?? "").trim();
    if (!text) return;
    history.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text }] });
  });
  return history;
}
