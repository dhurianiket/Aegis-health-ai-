import { describe, it, expect } from "vitest";
import {
  LOUNGE_MESSAGE_MAX_CHARS,
  buildLegacyMessageId,
  buildMessageId,
  buildMessageRecord,
  computeExpireAt,
  normaliseLegacyMessages,
  parseMessageDocs,
} from "../loungeMessageModel";
import { canSubmitLoungeConsent, isLoungeConsentCurrent, LOUNGE_CONSENT_DISCLOSURES, LOUNGE_CONSENT_PURPOSE, LOUNGE_CONSENT_VERSION } from "../loungeConsent";

describe("loungeMessageModel", () => {
  it("defaults to a 180-day TTL", () => {
    const t = new Date("2026-01-01T00:00:00Z");
    expect(computeExpireAt(t).toISOString()).toBe("2026-06-30T00:00:00.000Z");
  });

  it("caps content to the rules limit and normalises role/kind", () => {
    const r = buildMessageRecord({ role: "assistant", content: "x".repeat(LOUNGE_MESSAGE_MAX_CHARS + 50), timestamp: new Date(), kind: "triage" }, 3);
    expect(r.content).toHaveLength(LOUNGE_MESSAGE_MAX_CHARS);
    expect(r).toMatchObject({ role: "assistant", kind: "triage", seq: 3, schemaVersion: 2 });
  });

  it("builds sortable message ids and deterministic legacy ids", () => {
    const a = buildMessageId(new Date(1000), 0, () => "12345678");
    const b = buildMessageId(new Date(2000), 0, () => "12345678");
    expect(a < b).toBe(true);
    expect(buildLegacyMessageId(7)).toBe("legacy-00007");
  });

  it("normalises legacy arrays, skipping junk and preserving order without timestamps", () => {
    const out = normaliseLegacyMessages([{ role: "user", text: "a" }, null, "junk", { role: "model", content: "b", kind: "triage" }, { content: "" }]);
    expect(out.map((m) => [m.role, m.content, m.kind])).toEqual([
      ["user", "a", undefined],
      ["assistant", "b", "triage"],
    ]);
    expect(out[0].timestamp.getTime()).toBeLessThan(out[1].timestamp.getTime());
  });

  it("parses docs chronologically with seq as a tie-breaker", () => {
    const t = new Date("2026-09-27T08:00:00Z");
    const msgs = parseMessageDocs([
      { id: "b", data: { role: "assistant", content: "2", createdAt: t, seq: 1 } },
      { id: "a", data: { role: "user", content: "1", createdAt: t, seq: 0 } },
      { id: "c", data: { role: "user", content: "0", createdAt: { seconds: t.getTime() / 1000 - 10 }, seq: 0 } },
    ]);
    expect(msgs.map((m) => m.content)).toEqual(["0", "1", "2"]);
  });
});

describe("loungeConsent", () => {
  const base = { purpose: LOUNGE_CONSENT_PURPOSE as typeof LOUNGE_CONSENT_PURPOSE, version: LOUNGE_CONSENT_VERSION, accepted: true as const, isMinorProfile: false, guardianConfirmed: false };

  it("is current only for the same purpose + version (and guardian for minors)", () => {
    expect(isLoungeConsentCurrent(base)).toBe(true);
    expect(isLoungeConsentCurrent(null)).toBe(false);
    expect(isLoungeConsentCurrent({ ...base, version: "old" })).toBe(false);
    expect(isLoungeConsentCurrent({ ...base, isMinorProfile: true })).toBe(false);
    expect(isLoungeConsentCurrent({ ...base, isMinorProfile: true, guardianConfirmed: true })).toBe(true);
  });

  it("requires acknowledgement, and guardian confirmation for minors", () => {
    expect(canSubmitLoungeConsent({ acknowledged: false, isMinorProfile: false, guardianConfirmed: false })).toBe(false);
    expect(canSubmitLoungeConsent({ acknowledged: true, isMinorProfile: false, guardianConfirmed: false })).toBe(true);
    expect(canSubmitLoungeConsent({ acknowledged: true, isMinorProfile: true, guardianConfirmed: false })).toBe(false);
    expect(canSubmitLoungeConsent({ acknowledged: true, isMinorProfile: true, guardianConfirmed: true })).toBe(true);
  });

  it("discloses Google/Gemini + Cloudflare, possible processing outside India, educational-only and 112/108", () => {
    const text = LOUNGE_CONSENT_DISCLOSURES.join(" ");
    expect(text).toMatch(/Google \(Gemini/);
    expect(text).toMatch(/Cloudflare/);
    expect(text).toMatch(/outside India/);
    expect(text).toMatch(/educational information only/);
    expect(text).toMatch(/112/);
    expect(text).toMatch(/108/);
  });
});
