// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  LOUNGE_QUOTA_LIMITS,
  LoungeQuota,
  evaluateReservation,
  istDayKey,
  nextIstMidnight,
  resolvePlanTier,
} from "../quota";
import { fakeStorage } from "./helpers/edgeFakes";

describe("IST day boundaries", () => {
  it("uses the IST calendar day (UTC+5:30)", () => {
    expect(istDayKey(new Date("2026-09-27T18:29:59Z"))).toBe("2026-09-27");
    expect(istDayKey(new Date("2026-09-27T18:30:00Z"))).toBe("2026-09-28");
  });
  it("resets at the next IST midnight", () => {
    expect(nextIstMidnight(new Date("2026-09-27T08:00:00Z")).toISOString()).toBe("2026-09-27T18:30:00.000Z");
    expect(nextIstMidnight(new Date("2026-09-27T19:00:00Z")).toISOString()).toBe("2026-09-28T18:30:00.000Z");
    expect(nextIstMidnight(new Date("2026-12-31T20:00:00Z")).toISOString()).toBe("2027-01-01T18:30:00.000Z");
  });
});

describe("resolvePlanTier (verified token claims only)", () => {
  it("defaults to free", () => {
    expect(resolvePlanTier(undefined)).toBe("free");
    expect(resolvePlanTier({})).toBe("free");
    expect(resolvePlanTier({ aegis_plan: "something-unknown" })).toBe("free");
    expect(resolvePlanTier({ aegis_plan: 42 })).toBe("free");
  });
  it("maps paid, clinic and admin claims", () => {
    expect(resolvePlanTier({ aegis_plan: "b2c_monthly" })).toBe("paid");
    expect(resolvePlanTier({ plan: "B2B_CLINIC_QUARTERLY" })).toBe("clinic");
    expect(resolvePlanTier({ admin: true })).toBe("admin");
    expect(resolvePlanTier({ admin: "true" })).toBe("free");
  });
});

describe("evaluateReservation", () => {
  const now = new Date("2026-09-27T08:00:00Z");
  const limits = { messagesPerDay: 2, tokensPerDay: 1000 };
  it("starts a fresh day and increments messages", () => {
    const d = evaluateReservation({ day: "2026-09-26", messages: 99, tokens: 99999 }, limits, now);
    expect(d.allowed).toBe(true);
    expect(d.usage).toEqual({ day: "2026-09-27", messages: 1, tokens: 0 });
    expect(d.resetAt).toBe("2026-09-27T18:30:00.000Z");
  });
  it("blocks on message or token limit", () => {
    expect(evaluateReservation({ day: "2026-09-27", messages: 2, tokens: 0 }, limits, now)).toMatchObject({ allowed: false, reason: "messages" });
    expect(evaluateReservation({ day: "2026-09-27", messages: 0, tokens: 1000 }, limits, now)).toMatchObject({ allowed: false, reason: "tokens" });
  });
  it("has sensible tier ordering", () => {
    expect(LOUNGE_QUOTA_LIMITS.free.messagesPerDay).toBeLessThan(LOUNGE_QUOTA_LIMITS.paid.messagesPerDay);
    expect(LOUNGE_QUOTA_LIMITS.paid.messagesPerDay).toBeLessThan(LOUNGE_QUOTA_LIMITS.clinic.messagesPerDay);
  });
});

describe("LoungeQuota Durable Object", () => {
  const post = (dobj: LoungeQuota, path: string, body: unknown) =>
    dobj.fetch(new Request(`https://lounge-quota${path}`, { method: "POST", body: JSON.stringify(body) }));

  it("reserves until the limit, refunds, and commits tokens", async () => {
    const storage = fakeStorage();
    const dobj = new LoungeQuota({ storage });
    const limits = { messagesPerDay: 2, tokensPerDay: 500 };
    expect(((await (await post(dobj, "/reserve", { limits })).json()) as { allowed: boolean }).allowed).toBe(true);
    expect(((await (await post(dobj, "/reserve", { limits })).json()) as { allowed: boolean }).allowed).toBe(true);
    const third = (await (await post(dobj, "/reserve", { limits })).json()) as { allowed: boolean; reason: string };
    expect(third).toMatchObject({ allowed: false, reason: "messages" });

    await post(dobj, "/refund", {});
    expect(((await (await post(dobj, "/reserve", { limits })).json()) as { allowed: boolean }).allowed).toBe(true);

    await post(dobj, "/commit", { tokens: 600 });
    await post(dobj, "/refund", {});
    const byTokens = (await (await post(dobj, "/reserve", { limits })).json()) as { allowed: boolean; reason: string };
    expect(byTokens).toMatchObject({ allowed: false, reason: "tokens" });
  });

  it("rejects malformed reserve bodies and ignores junk token counts", async () => {
    const storage = fakeStorage();
    const dobj = new LoungeQuota({ storage });
    expect((await post(dobj, "/reserve", {})).status).toBe(400);
    await post(dobj, "/commit", { tokens: "lots" });
    await post(dobj, "/commit", { tokens: -50 });
    expect((storage.data.get("usage") as { tokens: number }).tokens).toBe(0);
    expect((await post(dobj, "/nope", {})).status).toBe(404);
  });
});
