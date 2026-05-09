import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from './config';
export { auth, db };
import { MedicalDocument, LabResult, Medication, SpecialistInsight } from '../../types/medical';

// Error handling helper as per Firebase integration instructions
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveDocument(userId: string, docData: Partial<MedicalDocument>) {
  const path = 'documents';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...docData,
      userId,
      createdAt: serverTimestamp(),
      isProcessed: false
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getDocuments(userId: string, profileId?: string) {
  const path = 'documents';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalDocument));
    if (profileId) {
      docs = docs.filter(doc => doc.profileId === profileId || (!doc.profileId && profileId === 'Myself'));
    }
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getLabHistory(userId: string, markerName?: string, profileId?: string) {
  const path = 'labResults';
  try {
    let q = query(collection(db, path), where('userId', '==', userId), orderBy('date', 'desc'));
    if (markerName) {
      q = query(q, where('markerName', '==', markerName));
    }
    const snapshot = await getDocs(q);
    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabResult));
    if (profileId) {
      docs = docs.filter(doc => doc.profileId === profileId || (!doc.profileId && profileId === 'Myself'));
    }
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getMedications(userId: string, profileId?: string) {
  const path = 'medications';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication));
    if (profileId) {
      docs = docs.filter(doc => doc.profileId === profileId || (!doc.profileId && profileId === 'Myself'));
    }
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveLabResult(userId: string, labData: Partial<LabResult>) {
  const path = 'labResults';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...labData,
      userId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMedication(userId: string, medData: Partial<Medication>) {
  const path = 'medications';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...medData,
      userId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getLatestInsights(userId: string, profileId?: string) {
  const path = 'insights';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialistInsight));
    if (profileId) {
      docs = docs.filter(doc => doc.profileId === profileId || (!doc.profileId && profileId === 'Myself'));
    }
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveSpecialistInsight(userId: string, insightData: Partial<SpecialistInsight>) {
  const path = 'insights';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...insightData,
      userId,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getHealthScores(userId: string, profileId?: string) {
  const path = 'scores';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    if (profileId) {
      docs = docs.filter(doc => doc.profileId === profileId || (!doc.profileId && profileId === 'Myself'));
    }
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveHealthScore(userId: string, scoreData: any) {
  const path = 'scores';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...scoreData,
      userId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDocumentRecord(docId: string) {
  const path = `documents/${docId}`;
  try {
    await deleteDoc(doc(db, 'documents', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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
  const path = 'summaries';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClinicalSummaryRecord));
    if (profileId) {
      docs = docs.filter(doc => doc.profileId === profileId || (!doc.profileId && profileId === 'Myself'));
    }
    return docs[0]; // return latest
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveClinicalSummary(userId: string, profileId: string | undefined, markdown: string, dataHash: string) {
  const path = 'summaries';
  try {
    const docRef = await addDoc(collection(db, path), {
      userId,
      profileId: profileId || 'Myself',
      markdown,
      dataHash,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Phase 2: Conversations
export async function getConversations(userId: string, profileId?: string) {
  const path = 'conversations';
  try {
    const q = query(
      collection(db, path), 
      where('userId', '==', userId), 
      where('profileId', '==', profileId || 'Myself'),
      orderBy('lastUpdated', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveConversation(userId: string, profileId: string, messages: any[], title?: string) {
  const path = 'conversations';
  try {
    const docRef = await addDoc(collection(db, path), {
      userId,
      profileId: profileId || 'Myself',
      messages,
      title: title || (messages.length > 0 ? messages[0].content.substring(0, 30) + '...' : 'New Chat'),
      lastUpdated: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Phase 2: Family Relations
export async function getFamilyRelations(userId: string) {
  const path = 'familyRelations';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}


