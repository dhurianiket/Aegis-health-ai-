import { doc, getDoc, setDoc, updateDoc, increment, collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase/config";

export interface UsageData {
  promptTokens?: number;
  responseTokens?: number;
  totalTokens?: number;
  feature?: 'pdf_extraction' | 'chat' | 'sbar' | 'summary' | 'specialist' | string;
}

export const trackUsage = async (userId: string, data: UsageData) => {
  if (!userId) return;
  const month = new Date().toISOString().substring(0, 7); // YYYY-MM
  const docRef = doc(db, `users/${userId}/usage/stats`);

  const updates: any = {
    totalTokensUsed: increment(data.totalTokens || 0),
    promptTokens: increment(data.promptTokens || 0),
    responseTokens: increment(data.responseTokens || 0),
    lastActive: new Date().toISOString(),
  };

  if (data.feature) {
    updates[`featureUsage.${data.feature}`] = increment(data.totalTokens || 0);
  }
  updates[`monthlyUsage.${month}`] = increment(data.totalTokens || 0);

  try {
    await updateDoc(docRef, updates);
  } catch (error: any) {
    if (error.code === 'not-found') {
      // Create document if it doesn't exist
      await setDoc(docRef, {
        totalTokensUsed: data.totalTokens || 0,
        promptTokens: data.promptTokens || 0,
        responseTokens: data.responseTokens || 0,
        documentsUploaded: 0,
        totalStorageBytes: 0,
        lastActive: new Date().toISOString(),
        featureUsage: data.feature ? { [data.feature]: data.totalTokens || 0 } : {},
        monthlyUsage: { [month]: data.totalTokens || 0 },
      });
    } else {
      console.error("Usage tracking error:", error);
    }
  }
};

export const trackStorageUsage = async (userId: string, fileSizeInBytes: number) => {
  if (!userId) return;
  const docRef = doc(db, `users/${userId}/usage/stats`);

  const updates = {
    documentsUploaded: increment(1),
    totalStorageBytes: increment(fileSizeInBytes),
    lastActive: new Date().toISOString(),
  };

  try {
    await updateDoc(docRef, updates);
  } catch (error: any) {
    if (error.code === 'not-found') {
      await setDoc(docRef, {
        totalTokensUsed: 0,
        promptTokens: 0,
        responseTokens: 0,
        documentsUploaded: 1,
        totalStorageBytes: fileSizeInBytes,
        lastActive: new Date().toISOString(),
        featureUsage: {},
        monthlyUsage: {},
      });
    } else {
      console.error("Storage tracking error:", error);
    }
  }
};

export const getUserUsageStats = async (userId: string) => {
  if (!userId) return null;
  const docRef = doc(db, `users/${userId}/usage/stats`);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error("Error fetching usage stats:", error);
  }
  return {
    totalTokensUsed: 0,
    promptTokens: 0,
    responseTokens: 0,
    documentsUploaded: 0,
    totalStorageBytes: 0,
    lastActive: null,
  };
};

export const getAllUsersUsage = async () => {
  try {
    const querySnapshot = await getDocs(collectionGroup(db, "usage"));
    const usageData: any[] = [];
    
    for (const docSnap of querySnapshot.docs) {
      if (docSnap.id === "stats") {
        const userId = docSnap.ref.parent.parent?.id;
        if (!userId) continue;
        
        let email = "Unknown";
        try {
           const profileSnap = await getDoc(doc(db, `users/${userId}/profile/main`));
           if (profileSnap.exists()) {
             email = profileSnap.data().email || "Unknown";
           } else {
             const rootSnap = await getDoc(doc(db, `users/${userId}`));
             if (rootSnap.exists() && rootSnap.data().email) {
                email = rootSnap.data().email;
             }
           }
        } catch(e) {}
        
        usageData.push({ 
          userId, 
          email,
          ...docSnap.data() 
        });
      }
    }
    
    // Sort by Total Tokens descending
    usageData.sort((a, b) => (b.totalTokensUsed || 0) - (a.totalTokensUsed || 0));
    
    return usageData;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};
