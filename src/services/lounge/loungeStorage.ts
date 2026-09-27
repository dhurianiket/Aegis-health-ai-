/**
 * Firestore persistence for Specialist Lounge chats (schema v2: one doc per
 * message in a `messages` subcollection, each with a TTL `expireAt`).
 *
 * - appendLoungeMessages: writes ONLY the new messages (no read-modify-write of
 *   a growing array) and touches the chat meta doc (no message text in it).
 * - loadLoungeMessages: reads the subcollection; if a legacy v1 `messages`
 *   array is still present on the chat doc it is migrated lazily (deterministic
 *   ids → idempotent), then removed. If migration fails the legacy messages are
 *   still returned (read fallback) and migration is retried next load.
 * - deleteLoungeData: removes every Lounge chat/message, referral and cached
 *   guide summary for ONE profile.
 */
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../../lib/firebase/config";
import { SPECIALISTS } from "../ai/specialists/specialistFactory";
import {
  LOUNGE_MESSAGE_LOAD_LIMIT,
  LOUNGE_SCHEMA_VERSION,
  buildLegacyMessageId,
  buildMessageId,
  buildMessageRecord,
  normaliseLegacyMessages,
  parseMessageDocs,
  type LoungeMessageInput,
  type LoungeMessageRecord,
  type StoredMessageDoc,
} from "./loungeMessageModel";

/** Firestore allows 500 writes per batch; stay well below. */
const BATCH_SIZE = 400;
export const LOUNGE_SUMMARY_CACHE_PREFIX = "SpecialistSummary_";

function chatDocRef(uid: string, profileId: string, chatId: string) {
  return doc(db, "users", uid, "profiles", profileId, "specialistChats", chatId);
}

function messagesCollection(uid: string, profileId: string, chatId: string) {
  return collection(db, "users", uid, "profiles", profileId, "specialistChats", chatId, "messages");
}

function toFirestoreRecord(record: LoungeMessageRecord): DocumentData {
  const data: DocumentData = {
    role: record.role,
    content: record.content,
    createdAt: Timestamp.fromDate(record.createdAt),
    expireAt: Timestamp.fromDate(record.expireAt),
    seq: record.seq,
    schemaVersion: record.schemaVersion,
  };
  if (record.kind) data.kind = record.kind;
  return data;
}

function chatMeta(uid: string, profileId: string, chatId: string): DocumentData {
  return {
    specialistId: chatId,
    profileId,
    userId: uid,
    schemaVersion: LOUNGE_SCHEMA_VERSION,
    updatedAt: serverTimestamp(),
  };
}

/** Appends new messages (one doc each). Returns the new message ids. */
export async function appendLoungeMessages(
  uid: string,
  profileId: string,
  chatId: string,
  messages: readonly LoungeMessageInput[],
): Promise<string[]> {
  if (messages.length === 0) return [];
  const batch = writeBatch(db);
  const col = messagesCollection(uid, profileId, chatId);
  const ids: string[] = [];
  messages.forEach((m, seq) => {
    const record = buildMessageRecord(m, seq);
    const id = buildMessageId(record.createdAt, seq);
    ids.push(id);
    batch.set(doc(col, id), toFirestoreRecord(record));
  });
  batch.set(chatDocRef(uid, profileId, chatId), chatMeta(uid, profileId, chatId), { merge: true });
  await batch.commit();
  return ids;
}

export type LoungeLoadSource = "empty" | "messages" | "migrated" | "legacy-fallback";

export interface LoungeLoadResult {
  messages: LoungeMessageInput[];
  source: LoungeLoadSource;
}

async function migrateLegacy(
  uid: string,
  profileId: string,
  chatId: string,
  legacy: readonly LoungeMessageInput[],
): Promise<void> {
  const col = messagesCollection(uid, profileId, chatId);
  for (let start = 0; start < legacy.length; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    legacy.slice(start, start + BATCH_SIZE).forEach((m, j) => {
      const index = start + j;
      batch.set(doc(col, buildLegacyMessageId(index)), toFirestoreRecord(buildMessageRecord(m, index)));
    });
    await batch.commit();
  }
  // Only after every message is safely written: drop the legacy array.
  const finalBatch = writeBatch(db);
  finalBatch.set(
    chatDocRef(uid, profileId, chatId),
    { ...chatMeta(uid, profileId, chatId), messages: deleteField(), migratedAt: serverTimestamp() },
    { merge: true },
  );
  await finalBatch.commit();
}

export async function loadLoungeMessages(uid: string, profileId: string, chatId: string): Promise<LoungeLoadResult> {
  const [chatSnap, msgSnap] = await Promise.all([
    getDoc(chatDocRef(uid, profileId, chatId)),
    getDocs(query(messagesCollection(uid, profileId, chatId), orderBy("createdAt", "desc"), limit(LOUNGE_MESSAGE_LOAD_LIMIT))),
  ]);
  const v2Docs: StoredMessageDoc[] = msgSnap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
  const legacyRaw: unknown = chatSnap.exists() ? (chatSnap.data() as Record<string, unknown>).messages : undefined;
  const legacy = normaliseLegacyMessages(legacyRaw);

  if (legacy.length === 0) {
    return { messages: parseMessageDocs(v2Docs), source: v2Docs.length ? "messages" : "empty" };
  }

  // Merge by id so a previously half-finished migration never duplicates.
  const merged = new Map<string, StoredMessageDoc>();
  legacy.forEach((m, i) => {
    const record = buildMessageRecord(m, i);
    const data: Record<string, unknown> = { ...record };
    merged.set(buildLegacyMessageId(i), { id: buildLegacyMessageId(i), data });
  });
  v2Docs.forEach((d) => merged.set(d.id, d));
  const combined = parseMessageDocs([...merged.values()]).slice(-LOUNGE_MESSAGE_LOAD_LIMIT);

  try {
    await migrateLegacy(uid, profileId, chatId, legacy);
    return { messages: combined, source: "migrated" };
  } catch (err) {
    console.warn("[Lounge] legacy chat migration failed; using legacy read fallback", err);
    return { messages: combined, source: "legacy-fallback" };
  }
}

/** Recent messages of every guide chat for a profile (for cross-guide context). */
export async function loadRecentMessagesForAllChats(
  uid: string,
  profileId: string,
  perChat: number = 20,
): Promise<Array<{ specialistId: string; messages: Array<{ role: string; content: string; kind?: string }> }>> {
  const chatsSnap = await getDocs(collection(db, "users", uid, "profiles", profileId, "specialistChats"));
  const results = await Promise.all(
    chatsSnap.docs.map(async (chat) => {
      const data = chat.data() as Record<string, unknown>;
      const legacy = normaliseLegacyMessages(data.messages);
      let msgs: LoungeMessageInput[] = legacy;
      if (legacy.length === 0) {
        const snap = await getDocs(query(messagesCollection(uid, profileId, chat.id), orderBy("createdAt", "desc"), limit(perChat)));
        msgs = parseMessageDocs(snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> })));
      }
      return {
        specialistId: chat.id,
        messages: msgs.slice(-perChat).map((m) => ({ role: m.role, content: m.content, ...(m.kind ? { kind: m.kind } : {}) })),
      };
    }),
  );
  return results;
}

export interface LoungeDeleteResult {
  chats: number;
  messages: number;
  referrals: number;
  cachedSummaries: number;
}

async function deleteAllInQuery(q: ReturnType<typeof query>): Promise<number> {
  let total = 0;
  for (;;) {
    const snap = await getDocs(query(q, limit(BATCH_SIZE)));
    if (snap.empty) return total;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.docs.length;
    if (snap.docs.length < BATCH_SIZE) return total;
  }
}

/**
 * Deletes ALL Specialist Lounge data for one profile: every guide chat + its
 * messages, all referrals, and cached guide summaries. Consent records are
 * kept (they document the user's choice, not health data).
 */
export async function deleteLoungeData(uid: string, profileId: string): Promise<LoungeDeleteResult> {
  const result: LoungeDeleteResult = { chats: 0, messages: 0, referrals: 0, cachedSummaries: 0 };

  const chatsSnap = await getDocs(collection(db, "users", uid, "profiles", profileId, "specialistChats"));
  // Also sweep known guide ids: a messages subcollection can exist without its parent doc.
  const chatIds = new Set<string>([...chatsSnap.docs.map((d) => d.id), ...Object.keys(SPECIALISTS)]);
  const existing = new Set(chatsSnap.docs.map((d) => d.id));
  for (const chatId of chatIds) {
    result.messages += await deleteAllInQuery(query(messagesCollection(uid, profileId, chatId)));
    if (existing.has(chatId)) {
      await deleteDoc(chatDocRef(uid, profileId, chatId));
      result.chats += 1;
    }
  }

  result.referrals = await deleteAllInQuery(
    query(collection(db, "users", uid, "profiles", profileId, "activeReferrals")),
  );

  const cacheSnap = await getDocs(
    query(collection(db, "users", uid, "cachedReports"), where("patientId", "==", profileId)),
  );
  const summaries = cacheSnap.docs.filter((d) => {
    const type = (d.data() as Record<string, unknown>).reportType;
    return typeof type === "string" && type.startsWith(LOUNGE_SUMMARY_CACHE_PREFIX);
  });
  for (let i = 0; i < summaries.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    summaries.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  result.cachedSummaries = summaries.length;
  return result;
}
