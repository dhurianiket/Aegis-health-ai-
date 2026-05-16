import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase/firestore";

enum OperationType {
  LIST = "list",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error("Firestore Error in CacheService: ", JSON.stringify(errInfo));
  // Not throwing to avoid breaking the UI; fallback to normal API behavior on cache fail.
}

export interface CachedReport {
  patientId: string;
  reportType: string;
  sourceHash: string;
  content: string;
  generatedAt: any;
  modelUsed: string;
  promptVersion: string;
  status: string;
}

export async function generateSourceHash(inputString: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(inputString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getCachedReport(
  userId: string,
  patientId: string,
  reportType: string,
  sourceHash: string,
  promptVersion: string,
  forceRefresh: boolean = false
): Promise<string | null> {
  if (forceRefresh) return null;

  const pathString = `users/${userId}/cachedReports`;
  try {
    const q = query(
      collection(db, "users", userId, "cachedReports"),
      where("patientId", "==", patientId),
      where("reportType", "==", reportType)
    );
    const snapshot = await getDocs(q);

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as CachedReport;
      if (data.sourceHash === sourceHash && data.promptVersion === promptVersion) {
        return data.content;
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathString);
  }

  return null; // Cache miss or error
}

export async function saveCachedReport(
  userId: string,
  reportData: Partial<CachedReport>
) {
  const pathString = `users/${userId}/cachedReports`;
  try {
    const docId = `${reportData.patientId}_${reportData.reportType}`;
    const docRef = doc(db, "users", userId, "cachedReports", docId);
    
    await setDoc(docRef, {
      ...reportData,
      generatedAt: serverTimestamp(),
    }, { merge: false }); // overwrite the previous cache for this patientId + reportType
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathString);
  }
}
