// @vitest-environment node
/**
 * Firestore security-rules tests (Specialist Lounge storage + consent).
 * Runs only against the Firestore emulator:
 *   npm run test:rules
 * (which wraps `firebase emulators:exec`). Skipped in a plain `vitest run`.
 * Synthetic ids/data only.
 */
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";

const hasEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const DAY = 24 * 60 * 60 * 1000;
const MSG_PATH = "users/alice/profiles/p1/specialistChats/cardiologist/messages/m1";
const CONSENT_PATH = "users/alice/profiles/p1/consents/specialist_lounge_ai";

function validMessage(overrides: Record<string, unknown> = {}) {
  const created = new Date("2026-09-27T08:00:00Z");
  return {
    role: "user",
    content: "Synthetic question about HbA1c 7.9 %",
    createdAt: Timestamp.fromDate(created),
    expireAt: Timestamp.fromDate(new Date(created.getTime() + 180 * DAY)),
    seq: 0,
    schemaVersion: 2,
    ...overrides,
  };
}

function validConsent(overrides: Record<string, unknown> = {}) {
  return {
    purpose: "specialist_lounge_ai",
    version: "2026-09-27.v1",
    accepted: true,
    isMinorProfile: false,
    guardianConfirmed: false,
    acceptedAt: serverTimestamp(),
    ...overrides,
  };
}

describe.skipIf(!hasEmulator)("firestore.rules — Lounge messages & consent", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: "demo-aegis-rules",
      firestore: { rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8") },
    });
  });
  afterAll(async () => {
    await env?.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
  });

  const alice = () => env.authenticatedContext("alice").firestore();
  const bob = () => env.authenticatedContext("bob").firestore();

  it("owner can create a valid message and read it", async () => {
    await assertSucceeds(setDoc(doc(alice(), MSG_PATH), validMessage()));
    await assertSucceeds(getDoc(doc(alice(), MSG_PATH)));
  });

  it("other users and anonymous users cannot read or write messages", async () => {
    await assertSucceeds(setDoc(doc(alice(), MSG_PATH), validMessage()));
    await assertFails(getDoc(doc(bob(), MSG_PATH)));
    await assertFails(setDoc(doc(bob(), "users/alice/profiles/p1/specialistChats/cardiologist/messages/m2"), validMessage()));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), MSG_PATH)));
  });

  it("rejects invalid message shapes", async () => {
    const db = alice();
    await assertFails(setDoc(doc(db, MSG_PATH), validMessage({ role: "system" })));
    await assertFails(setDoc(doc(db, MSG_PATH), validMessage({ content: "x".repeat(20001) })));
    await assertFails(setDoc(doc(db, MSG_PATH), validMessage({ extra: "field" })));
    await assertFails(setDoc(doc(db, MSG_PATH), validMessage({ kind: "other" })));
    await assertFails(setDoc(doc(db, MSG_PATH), validMessage({ schemaVersion: 1 })));
    const { expireAt: _omit, ...noExpire } = validMessage();
    await assertFails(setDoc(doc(db, MSG_PATH), noExpire));
    // expireAt beyond the retention ceiling
    await assertFails(
      setDoc(doc(db, MSG_PATH), validMessage({ expireAt: Timestamp.fromDate(new Date("2028-01-01T00:00:00Z")) })),
    );
    await assertSucceeds(setDoc(doc(db, MSG_PATH), validMessage({ kind: "triage", role: "assistant" })));
  });

  it("messages are immutable (no update) but the owner can delete them", async () => {
    await assertSucceeds(setDoc(doc(alice(), MSG_PATH), validMessage()));
    await assertFails(updateDoc(doc(alice(), MSG_PATH), { content: "edited" }));
    await assertSucceeds(deleteDoc(doc(alice(), MSG_PATH)));
  });

  it("other paths under the user keep the owner wildcard (chat meta, legacy docs, referrals)", async () => {
    const db = alice();
    await assertSucceeds(setDoc(doc(db, "users/alice/profiles/p1/specialistChats/cardiologist"), { messages: [], anything: 1 }));
    await assertSucceeds(setDoc(doc(db, "users/alice/profiles/p1/activeReferrals/r1"), { reason: "synthetic" }));
    await assertSucceeds(setDoc(doc(db, "users/alice/medications/m1"), { genericName: "Syntheticmed" }));
    await assertFails(setDoc(doc(bob(), "users/alice/medications/m2"), { genericName: "Syntheticmed" }));
  });

  it("consent: owner can write a valid adult consent", async () => {
    await assertSucceeds(setDoc(doc(alice(), CONSENT_PATH), validConsent()));
    await assertSucceeds(getDoc(doc(alice(), CONSENT_PATH)));
    await assertFails(getDoc(doc(bob(), CONSENT_PATH)));
  });

  it("consent: minor profile requires guardian confirmation", async () => {
    await assertFails(setDoc(doc(alice(), CONSENT_PATH), validConsent({ isMinorProfile: true, guardianConfirmed: false })));
    await assertSucceeds(setDoc(doc(alice(), CONSENT_PATH), validConsent({ isMinorProfile: true, guardianConfirmed: true })));
  });

  it("consent: rejects wrong purpose, client-chosen timestamps and extra fields", async () => {
    await assertFails(setDoc(doc(alice(), "users/alice/profiles/p1/consents/marketing"), validConsent({ purpose: "marketing" })));
    await assertFails(setDoc(doc(alice(), CONSENT_PATH), validConsent({ acceptedAt: Timestamp.fromDate(new Date("2020-01-01")) })));
    await assertFails(setDoc(doc(alice(), CONSENT_PATH), validConsent({ accepted: false })));
    await assertFails(setDoc(doc(alice(), CONSENT_PATH), validConsent({ note: "x" })));
    await assertFails(setDoc(doc(bob(), CONSENT_PATH), validConsent()));
  });
});
