import {
  collection,
  addDoc,
  setDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc,
  limit,
  startAfter,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "./config";
export { auth, db };
import { parseSafeTimestamp } from "../../utils/dateUtils";
import {
  MedicalDocument,
  LabResult,
  Medication,
  SpecialistInsight,
  ReportHistoryEntry,
} from "../../types/medical";
import { WearableBiometrics } from "../../types/wearables";

// Error handling helper as per Firebase integration instructions
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : 'unknown';
  const errMsg = error instanceof Error ? error.message : String(error);

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (errCode === 'unavailable' || errCode === 'failed-precondition') {
      console.warn(`[Firestore Offline] ${operationType} operation on ${path} failed due to network unavailability. Check connection.`);
      // We don't throw for offline reads if we want components to degrade gracefully, but throwing a custom error lets components handle the offline state explicitly.
      throw new Error(`offline/${errCode}`);
  }
  
  if (errCode === 'permission-denied') {
      console.error(`[Firestore Permission Denied] Insufficient permissions for ${operationType} on ${path}. Check Security Rules or Auth state.`);
  } else {
      console.error("Firestore Error: ", JSON.stringify(errInfo));
  }

  throw new Error(JSON.stringify(errInfo));
}

function sanitizeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, v) => v === undefined ? null : v));
}

export async function saveDocument(
  userId: string,
  docData: Partial<MedicalDocument>,
) {
  const docId = docData.id || `doc_${Date.now()}`;
  const pathString = `users/${userId}/documents/${docId}`;
  if (import.meta.env.DEV) console.log('[Firestore] Saving document to:', pathString);
  try {
    await setDoc(doc(db, "users", userId, "documents", docId), sanitizeData({
      ...docData,
      userId,
      createdAt: docData.createdAt || serverTimestamp(), // Avoid overwriting if existing
      isProcessed: docData.isProcessed ?? false,
    }), { merge: true });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

export async function getDocuments(userId: string, profileId?: string) {
  const pathString = `users/${userId}/documents`;
  try {
    let q = query(collection(db, "users", userId, "documents"));
    if (profileId) {
      q = query(q, where("profileId", "==", profileId));
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as MedicalDocument,
    )
    // Performance optimization (Schwartzian transform): Precompute parsed dates in O(N) before sorting
    // to prevent redundant parsing and allocation on every O(N log N) comparator step.
    .map(doc => ({ doc, t: parseSafeTimestamp(doc.date)?.getTime() || 0 }))
    .sort((a, b) => b.t - a.t)
    .map(item => item.doc);
    
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

export async function getLabHistory(
  userId: string,
  markerName?: string,
  profileId?: string,
) {
  const pathString = `users/${userId}/labResults`;
  try {
    let q = query(collection(db, "users", userId, "labResults"));
    if (markerName) {
      q = query(q, where("markerName", "==", markerName));
    }
    if (profileId) {
      q = query(q, where("profileId", "==", profileId));
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as LabResult,
    )
    // Performance optimization (Schwartzian transform): Precompute parsed dates in O(N) before sorting
    // to prevent redundant parsing and allocation on every O(N log N) comparator step.
    .map(doc => ({ doc, t: parseSafeTimestamp(doc.date)?.getTime() || 0 }))
    .sort((a, b) => b.t - a.t)
    .map(item => item.doc);
    
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

export async function getMedications(userId: string, profileId?: string) {
  if (!userId) return [];
  const pathString = `users/${userId}/medications`;
  try {
    let q = query(collection(db, "users", userId, "medications"));
    if (profileId) {
      q = query(q, where("profileId", "==", profileId));
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Medication,
    );
    
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

export async function saveLabResult(
  userId: string,
  labData: Partial<LabResult> & { id?: string },
) {
  const pathString = `users/${userId}/labResults`;
  try {
    let docRef;
    if (labData.id) {
      docRef = doc(db, "users", userId, "labResults", labData.id);
      await setDoc(docRef, sanitizeData({
        ...labData,
        userId,
        createdAt: (labData as any).createdAt || serverTimestamp(),
      }), { merge: true });
      return labData.id;
    } else {
      docRef = await addDoc(collection(db, "users", userId, "labResults"), sanitizeData({
        ...labData,
        userId,
        createdAt: serverTimestamp(),
      }));
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

export async function saveMedication(
  userId: string,
  medData: Partial<Medication> & { id?: string },
) {
  const pathString = `users/${userId}/medications`;
  try {
    let docRef;
    if (medData.id) {
      docRef = doc(db, "users", userId, "medications", medData.id);
      await setDoc(docRef, sanitizeData({
        ...medData,
        userId,
        createdAt: (medData as any).createdAt || serverTimestamp(),
      }), { merge: true });
      return medData.id;
    } else {
      docRef = await addDoc(collection(db, "users", userId, "medications"), sanitizeData({
        ...medData,
        userId,
        createdAt: serverTimestamp(),
      }));
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

export async function getLatestInsights(userId: string, profileId?: string) {
  const pathString = `users/${userId}/insights`;
  try {
    let q = query(collection(db, "users", userId, "insights"));
    if (profileId) {
      q = query(q, where("profileId", "==", profileId));
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as SpecialistInsight,
    )
    // Performance optimization (Schwartzian transform): Precompute parsed dates in O(N) before sorting
    // to prevent redundant parsing and allocation on every O(N log N) comparator step.
    .map((doc: any) => ({ doc, t: doc.timestamp?.toMillis ? doc.timestamp.toMillis() : parseSafeTimestamp(doc.timestamp)?.getTime() || 0 }))
    .sort((a, b) => b.t - a.t)
    .map(item => item.doc);
    
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

export async function saveSpecialistInsight(
  userId: string,
  insightData: Partial<SpecialistInsight>,
) {
  const pathString = `users/${userId}/insights`;
  try {
    const docRef = await addDoc(collection(db, "users", userId, "insights"), sanitizeData({
      ...insightData,
      userId,
      timestamp: serverTimestamp(),
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

export async function getHealthScores(userId: string, profileId?: string) {
  const pathString = `users/${userId}/scores`;
  try {
    let q = query(collection(db, "users", userId, "scores"));
    if (profileId) {
      q = query(q, where("profileId", "==", profileId));
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as any,
    )
    // Performance optimization (Schwartzian transform): Precompute parsed dates in O(N) before sorting
    // to prevent redundant parsing and allocation on every O(N log N) comparator step.
    .map((doc: any) => ({ doc, t: parseSafeTimestamp(doc.date)?.getTime() || 0 }))
    .sort((a, b) => b.t - a.t)
    .map(item => item.doc);
    
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

export async function saveHealthScore(userId: string, scoreData: any) {
  const pathString = `users/${userId}/scores`;
  try {
    const docRef = await addDoc(collection(db, "users", userId, "scores"), sanitizeData({
      ...scoreData,
      userId,
      createdAt: serverTimestamp(),
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

export async function deleteDocumentRecord(userId: string, docId: string) {
  const pathString = `users/${userId}/documents/${docId}`;
  try {
    // 1. Get doc to find storage path
    const docRef = doc(db, "users", userId, "documents", docId);
    // Storage deletion skipped - using local:// URLs

    // 2. Delete Firestore doc
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, pathString);
  }
}

export interface ClinicalSummaryRecord {
  id?: string;
  userId: string;
  profileId?: string;
  markdown: string;
  dataHash: string;
  createdAt: any;
}

export async function getClinicalSummary(userId: string, profileId?: string) {
  const pathString = `users/${userId}/summaries`;
  try {
    let q = query(collection(db, "users", userId, "summaries"));
    if (profileId) {
      q = query(q, where("profileId", "==", profileId));
    }
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as ClinicalSummaryRecord,
    )
    // Performance optimization (Schwartzian transform): Precompute parsed dates in O(N) before sorting
    // to prevent redundant parsing and allocation on every O(N log N) comparator step.
    .map((doc: any) => ({ doc, t: doc.createdAt?.toMillis ? doc.createdAt.toMillis() : parseSafeTimestamp(doc.createdAt)?.getTime() || 0 }))
    .sort((a, b) => b.t - a.t)
    .map(item => item.doc);
    
    return docs[0]; // return latest
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

export async function saveClinicalSummary(
  userId: string,
  profileId: string | undefined,
  markdown: string,
  dataHash: string,
) {
  const pathString = `users/${userId}/summaries`;
  try {
    const docRef = await addDoc(collection(db, "users", userId, "summaries"), sanitizeData({
      userId,
      profileId: profileId || "Myself",
      markdown,
      dataHash,
      createdAt: serverTimestamp(),
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

// Phase 2: Conversations
export async function getConversations(userId: string, profileId?: string) {
  const pathString = `users/${userId}/conversations`;
  try {
    const q = query(
      collection(db, "users", userId, "conversations"),
      where("profileId", "==", profileId || "Myself")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as any)
    // Performance optimization (Schwartzian transform): Precompute parsed dates in O(N) before sorting
    // to prevent redundant parsing and allocation on every O(N log N) comparator step.
    .map((doc: any) => ({ doc, t: doc.lastUpdated?.toMillis ? doc.lastUpdated.toMillis() : parseSafeTimestamp(doc.lastUpdated)?.getTime() || 0 }))
    .sort((a, b) => b.t - a.t)
    .map(item => item.doc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

export async function saveConversation(
  userId: string,
  profileId: string,
  messages: any[],
  title?: string,
) {
  const pathString = `users/${userId}/conversations`;
  try {
    const docRef = await addDoc(collection(db, "users", userId, "conversations"), sanitizeData({
      userId,
      profileId: profileId || "Myself",
      messages,
      title:
        title ||
        (messages.length > 0
          ? messages[0].content.substring(0, 30) + "..."
          : "New Chat"),
      lastUpdated: serverTimestamp(),
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

// Phase 2: Family Relations
export async function getFamilyRelations(userId: string) {
  const pathString = `users/${userId}/familyRelations`;
  try {
    const q = query(collection(db, "users", userId, "familyRelations"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

// Phase 2: Report History & Trend Tracking (Step 2)
export async function saveReportHistory(
  userId: string,
  entry: Partial<ReportHistoryEntry>
) {
  const pathString = `users/${userId}/reportHistory`;
  try {
    const docId = entry.id || `hist_${Date.now()}`;
    const docRef = doc(db, "users", userId, "reportHistory", docId);
    await setDoc(docRef, sanitizeData({
      ...entry,
      id: docId,
      userId,
      createdAt: serverTimestamp(),
    }), { merge: true });
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

export async function getReportHistory(
  userId: string,
  profileId?: string,
  pageSize = 10,
  lastDoc?: any
) {
  const pathString = `users/${userId}/reportHistory`;
  try {
    let q = query(
      collection(db, "users", userId, "reportHistory"),
      orderBy("uploadedAt", "desc")
    );
    if (profileId) {
      q = query(q, where("profileId", "==", profileId));
    }
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as ReportHistoryEntry
    );
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return {
      history,
      lastVisible,
      isFallback: false
    };
  } catch (error: any) {
    // Fall back to safe in-memory sorting/pagination if the composite index is missing or query fails
    console.warn("[Firestore getReportHistory] Paginated query failed, falling back to safe in-memory pagination.", error);
    try {
      let qFallback = query(collection(db, "users", userId, "reportHistory"));
      if (profileId) {
        qFallback = query(qFallback, where("profileId", "==", profileId));
      }
      const snapshot = await getDocs(qFallback);
      const allHistory = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as ReportHistoryEntry
      )
      // Performance optimization (Schwartzian transform): Precompute parsed dates in O(N) before sorting
      // to prevent redundant parsing and allocation on every O(N log N) comparator step.
      .map((doc: any) => ({ doc, t: parseSafeTimestamp(doc.date || doc.uploadedAt)?.getTime() || 0 }))
      .sort((a, b) => b.t - a.t)
      .map(item => item.doc);

      let startIndex = 0;
      if (lastDoc) {
        const lastId = typeof lastDoc === 'string' ? lastDoc : (lastDoc.id || lastDoc);
        const foundIndex = allHistory.findIndex(h => h.id === lastId);
        if (foundIndex !== -1) {
          startIndex = foundIndex + 1;
        }
      }

      const paginatedHistory = allHistory.slice(startIndex, startIndex + pageSize);
      const lastVisibleItem = paginatedHistory[paginatedHistory.length - 1] || null;

      return {
        history: paginatedHistory,
        lastVisible: lastVisibleItem,
        isFallback: true
      };
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.LIST, pathString);
    }
  }
}

// ─── Wearable Telemetry Firestore Helpers ────────────────────────────────────
// Path: users/{uid}/wearableTelemetry/{docId}
// Covered by the existing users/{userId}/{document=**} wildcard security rule.

/**
 * Persists a WearableBiometrics snapshot to Firestore.
 * Uses the biometrics.id as the document ID for idempotent upserts
 * (same reading won't create duplicate docs on re-save).
 */
export async function saveWearableTelemetry(
  userId: string,
  biometrics: WearableBiometrics
): Promise<string> {
  const pathString = `users/${userId}/wearableTelemetry/${biometrics.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'wearableTelemetry', biometrics.id),
      sanitizeData({
        ...biometrics,
        userId,
        savedAt: serverTimestamp(),
      }),
      { merge: true }
    );
    return biometrics.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
    throw error;
  }
}

/**
 * Opens a real-time onSnapshot listener on the user's wearableTelemetry subcollection.
 * Calls callback with the most recent WearableBiometrics reading (or null if none exist).
 * Returns an unsubscribe function — MUST be called on component unmount to prevent leaks.
 */
export function subscribeToLatestTelemetry(
  userId: string,
  callback: (latest: WearableBiometrics | null, history: WearableBiometrics[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, 'users', userId, 'wearableTelemetry'),
    orderBy('timestamp', 'desc'),
    limit(20)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const readings = snapshot.docs.map(
        (d) => ({ ...d.data() as WearableBiometrics, id: d.id })
      );
      callback(readings[0] ?? null, readings);
    },
    (err) => {
      console.warn('[Firestore] wearableTelemetry onSnapshot error:', err.message);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * One-time fetch of wearable telemetry history for the past N days.
 * Useful for charts and trend analysis without a live listener.
 */
export async function getWearableHistory(
  userId: string,
  days = 7
): Promise<WearableBiometrics[]> {
  const pathString = `users/${userId}/wearableTelemetry`;
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    const q = query(
      collection(db, 'users', userId, 'wearableTelemetry'),
      where('timestamp', '>=', sinceISO),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ ...d.data() as WearableBiometrics, id: d.id })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
    return [];
  }
}
