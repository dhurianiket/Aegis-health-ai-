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
} from "firebase/firestore";
import { auth, db } from "./config";
export { auth, db };
import {
  MedicalDocument,
  LabResult,
  Medication,
  SpecialistInsight,
} from "../../types/medical";

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error("Firestore Error: ", JSON.stringify(errInfo));
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
      createdAt: serverTimestamp(),
      isProcessed: false,
    }));
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
    ).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    
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
    ).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }
}

export async function getMedications(userId: string, profileId?: string) {
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
  labData: Partial<LabResult>,
) {
  const pathString = `users/${userId}/labResults`;
  try {
    const docRef = await addDoc(collection(db, "users", userId, "labResults"), sanitizeData({
      ...labData,
      userId,
      createdAt: serverTimestamp(),
    }));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}

export async function saveMedication(
  userId: string,
  medData: Partial<Medication>,
) {
  const pathString = `users/${userId}/medications`;
  try {
    const docRef = await addDoc(collection(db, "users", userId, "medications"), sanitizeData({
      ...medData,
      userId,
      createdAt: serverTimestamp(),
    }));
    return docRef.id;
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
    ).sort((a: any, b: any) => {
       const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp || 0).getTime();
       const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp || 0).getTime();
       return tB - tA;
    });
    
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
    ).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    
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
    ).sort((a: any, b: any) => {
       const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
       const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
       return tB - tA;
    });
    
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as any).sort((a: any, b: any) => {
       const tA = a.lastUpdated?.toMillis ? a.lastUpdated.toMillis() : new Date(a.lastUpdated || 0).getTime();
       const tB = b.lastUpdated?.toMillis ? b.lastUpdated.toMillis() : new Date(b.lastUpdated || 0).getTime();
       return tB - tA;
    });
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
