import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeFirestore } from "./fakeFirestore";

const fake = vi.hoisted(() => ({ current: null as null | ReturnType<typeof import("./fakeFirestore").createFakeFirestore> }));

vi.mock("../../../lib/firebase/config", () => ({ db: {} }));
vi.mock("firebase/firestore", () => {
  const call = (name: string) => (...args: unknown[]) => {
    const api = fake.current!.api as unknown as Record<string, (...a: unknown[]) => unknown>;
    return api[name](...args);
  };
  return {
    collection: call("collection"),
    doc: call("doc"),
    query: call("query"),
    where: call("where"),
    orderBy: call("orderBy"),
    limit: call("limit"),
    getDocs: call("getDocs"),
    getDoc: call("getDoc"),
    setDoc: call("setDoc"),
    deleteDoc: call("deleteDoc"),
    writeBatch: call("writeBatch"),
    deleteField: call("deleteField"),
    serverTimestamp: call("serverTimestamp"),
    Timestamp: { fromDate: (d: Date) => d },
  };
});

import { appendLoungeMessages, deleteLoungeData, loadLoungeMessages } from "../loungeStorage";
import { LOUNGE_MESSAGE_TTL_DAYS } from "../loungeMessageModel";

const UID = "synthetic-uid";
const PID = "synthetic-profile";
const CHAT = `users/${UID}/profiles/${PID}/specialistChats/cardiologist`;

function messagesIn(store: Map<string, Record<string, unknown>>, chatPath: string) {
  return [...store.keys()].filter((k) => k.startsWith(`${chatPath}/messages/`));
}

describe("loungeStorage — one doc per message with TTL", () => {
  beforeEach(() => {
    fake.current = createFakeFirestore();
  });

  it("appends only the new messages, each with expireAt = createdAt + 180d, and no text on the chat doc", async () => {
    const t = new Date("2026-09-27T08:00:00Z");
    await appendLoungeMessages(UID, PID, "cardiologist", [
      { role: "user", content: "Synthetic question", timestamp: t },
      { role: "assistant", content: "Synthetic answer", timestamp: new Date(t.getTime() + 1000) },
    ]);
    const store = fake.current!.store;
    const ids = messagesIn(store, CHAT);
    expect(ids).toHaveLength(2);
    const first = store.get(ids.sort()[0])!;
    expect(first).toMatchObject({ role: "user", content: "Synthetic question", seq: 0, schemaVersion: 2 });
    expect((first.expireAt as Date).getTime() - (first.createdAt as Date).getTime()).toBe(LOUNGE_MESSAGE_TTL_DAYS * 86400000);
    const meta = store.get(CHAT)!;
    expect(meta).toMatchObject({ specialistId: "cardiologist", profileId: PID, userId: UID, schemaVersion: 2 });
    expect(meta.messages).toBeUndefined();
    expect(JSON.stringify(meta)).not.toContain("Synthetic");
  });

  it("loads v2 messages in chronological order and keeps the triage flag", async () => {
    const t = new Date("2026-09-27T08:00:00Z");
    await appendLoungeMessages(UID, PID, "cardiologist", [{ role: "user", content: "first", timestamp: t }]);
    await appendLoungeMessages(UID, PID, "cardiologist", [
      { role: "user", content: "crisis", timestamp: new Date(t.getTime() + 5000), kind: "triage" },
      { role: "assistant", content: "card", timestamp: new Date(t.getTime() + 5000), kind: "triage" },
    ]);
    const res = await loadLoungeMessages(UID, PID, "cardiologist");
    expect(res.source).toBe("messages");
    expect(res.messages.map((m) => m.content)).toEqual(["first", "crisis", "card"]);
    expect(res.messages.map((m) => m.kind)).toEqual([undefined, "triage", "triage"]);
  });

  it("lazily migrates a legacy array chat once, idempotently, then removes the array", async () => {
    const store = fake.current!.store;
    store.set(CHAT, {
      specialistId: "cardiologist",
      messages: [
        { role: "user", content: "legacy q", createdAt: "2026-09-01T10:00:00.000Z" },
        { role: "assistant", content: "legacy a [REFERRAL: nephrologist | synthetic]", createdAt: "2026-09-01T10:00:05.000Z" },
      ],
    });
    const first = await loadLoungeMessages(UID, PID, "cardiologist");
    expect(first.source).toBe("migrated");
    expect(first.messages.map((m) => m.content)).toEqual(["legacy q", "legacy a [REFERRAL: nephrologist | synthetic]"]);
    expect(messagesIn(store, CHAT).sort()).toEqual([`${CHAT}/messages/legacy-00000`, `${CHAT}/messages/legacy-00001`]);
    expect(store.get(CHAT)!.messages).toBeUndefined();

    const again = await loadLoungeMessages(UID, PID, "cardiologist");
    expect(again.source).toBe("messages");
    expect(again.messages).toHaveLength(2);
  });

  it("falls back to reading the legacy array when migration fails (and retries later)", async () => {
    const store = fake.current!.store;
    store.set(CHAT, { messages: [{ role: "user", content: "legacy only", createdAt: "2026-09-01T10:00:00.000Z" }] });
    fake.current!.state.failCommitAfter = 0;
    const res = await loadLoungeMessages(UID, PID, "cardiologist");
    expect(res.source).toBe("legacy-fallback");
    expect(res.messages.map((m) => m.content)).toEqual(["legacy only"]);
    expect(Array.isArray(store.get(CHAT)!.messages)).toBe(true);

    fake.current!.state.failCommitAfter = Infinity;
    const retry = await loadLoungeMessages(UID, PID, "cardiologist");
    expect(retry.source).toBe("migrated");
    expect(store.get(CHAT)!.messages).toBeUndefined();
  });

  it("deleteLoungeData removes chats, messages, referrals and cached guide summaries for ONE profile only", async () => {
    const store = fake.current!.store;
    const t = new Date("2026-09-27T08:00:00Z");
    await appendLoungeMessages(UID, PID, "cardiologist", [{ role: "user", content: "q", timestamp: t }]);
    await appendLoungeMessages(UID, PID, "nephrologist", [{ role: "user", content: "q", timestamp: t }]);
    // Orphan messages without a parent chat doc are swept too.
    store.set(`users/${UID}/profiles/${PID}/specialistChats/oncologist/messages/x`, { role: "user", content: "orphan" });
    await appendLoungeMessages(UID, "other-profile", "cardiologist", [{ role: "user", content: "keep", timestamp: t }]);
    store.set(`users/${UID}/profiles/${PID}/activeReferrals/r1`, { reason: "synthetic" });
    store.set(`users/${UID}/profiles/other-profile/activeReferrals/r2`, { reason: "keep" });
    store.set(`users/${UID}/cachedReports/${PID}_SpecialistSummary_cardiologist`, { patientId: PID, reportType: "SpecialistSummary_cardiologist" });
    store.set(`users/${UID}/cachedReports/${PID}_LabSummary`, { patientId: PID, reportType: "LabSummary" });
    store.set(`users/${UID}/cachedReports/other-profile_SpecialistSummary_cardiologist`, { patientId: "other-profile", reportType: "SpecialistSummary_cardiologist" });
    store.set(`users/${UID}/profiles/${PID}/consents/specialist_lounge_ai`, { accepted: true });

    const res = await deleteLoungeData(UID, PID);
    expect(res).toEqual({ chats: 2, messages: 3, referrals: 1, cachedSummaries: 1 });

    const remaining = [...store.keys()].sort();
    expect(remaining.filter((k) => k.includes(`/profiles/${PID}/specialistChats`))).toEqual([]);
    expect(remaining).toContain(`users/${UID}/profiles/other-profile/specialistChats/cardiologist`);
    expect(remaining).toContain(`users/${UID}/profiles/other-profile/activeReferrals/r2`);
    expect(remaining).toContain(`users/${UID}/cachedReports/${PID}_LabSummary`);
    expect(remaining).toContain(`users/${UID}/cachedReports/other-profile_SpecialistSummary_cardiologist`);
    expect(remaining).toContain(`users/${UID}/profiles/${PID}/consents/specialist_lounge_ai`);
  });
});
