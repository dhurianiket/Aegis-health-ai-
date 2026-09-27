import { describe, it, expect } from "vitest";
import { formatIstResetTime, formatLoungeQuotaMessage, isLoungeQuotaError } from "../loungeQuotaMessage";

describe("loungeQuotaMessage", () => {
  const now = new Date("2026-09-27T08:00:00Z"); // 1:30 PM IST
  it("formats the reset time in IST with today/tomorrow", () => {
    expect(formatIstResetTime("2026-09-27T18:30:00.000Z", now)).toMatch(/^12:00\s?am IST tomorrow$/i);
    expect(formatIstResetTime("2026-09-27T12:30:00.000Z", now)).toMatch(/^6:00\s?pm IST today$/i);
    expect(formatIstResetTime("nonsense", now)).toBeNull();
    expect(formatIstResetTime(undefined, now)).toBeNull();
  });
  it("builds a calm, safe message", () => {
    const msg = formatLoungeQuotaMessage({ resetAt: "2026-09-27T18:30:00.000Z" }, now);
    expect(msg).toContain("reached today's Health Guides (AI) limit");
    expect(msg).toMatch(/12:00\s?am IST tomorrow/i);
    expect(msg).toContain("112");
    expect(formatLoungeQuotaMessage({}, now)).toContain("midnight IST");
  });
  it("detects the quota error by code only", () => {
    expect(isLoungeQuotaError({ errorCode: "LOUNGE_QUOTA_EXCEEDED" })).toBe(true);
    expect(isLoungeQuotaError({ status: 429 })).toBe(false);
    expect(isLoungeQuotaError(null)).toBe(false);
  });
});
