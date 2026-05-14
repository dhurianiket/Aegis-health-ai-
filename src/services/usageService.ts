import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collectionGroup,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase/config";

export interface UsageData {
  promptTokens?: number;
  responseTokens?: number;
  thinkingTokens?: number;
  totalTokens?: number;
  feature?: "pdf_extraction" | "chat" | "sbar" | "summary" | "specialist" | string;
}

const updateGlobalStats = async (updates: any) => {
  const globalRef = doc(db, "analytics/globalStats");
  try {
    await updateDoc(globalRef, { ...updates, lastUpdated: serverTimestamp() });
  } catch (error: any) {
    if (error.code === "not-found") {
      const initialStats = {
        totalUsers: 0,
        activeUsersToday: 0,
        activeUsersThisMonth: 0,
        totalDocumentsUploaded: 0,
        totalStorageBytes: 0,
        totalTokensUsed: 0,
        totalPromptTokens: 0,
        totalResponseTokens: 0,
        totalThinkingTokens: 0,
        estimatedCostUSD: 0,
        featureTokens: { pdf_extraction: 0, chat: 0, sbar: 0, summary: 0, specialist: 0 },
        lastUpdated: serverTimestamp(),
      };
      // Merge updates
      const dataToSet: any = { ...initialStats, ...updates, lastUpdated: serverTimestamp() };
      // Transform increments for initial set
      for (const [key, val] of Object.entries(updates)) {
        if (typeof val === "object" && (val as any)._methodName === "increment") {
          dataToSet[key] = (val as any).operand;
        } else if (key.includes(".")) {
          const [parent, child] = key.split(".");
          dataToSet[parent] = dataToSet[parent] || {};
          dataToSet[parent][child] = typeof val === "object" && (val as any)._methodName === "increment" ? (val as any).operand : val;
        }
      }
      Object.keys(dataToSet).forEach(k => k.includes(".") && delete dataToSet[k]);
      try {
        await setDoc(globalRef, dataToSet);
      } catch (e) {
        console.error("Failed to create global stats", e);
      }
    } else {
      console.error("Global stats tracking error:", error);
    }
  }
};

export const markUserActive = async (userId: string) => {
  if (!userId) return;
  const docRef = doc(db, `users/${userId}/usage/stats`);
  try {
    await updateDoc(docRef, { lastActive: new Date().toISOString() });
  } catch (error: any) {
    if (error.code === "not-found") {
      await setDoc(docRef, {
        totalTokensUsed: 0,
        promptTokens: 0,
        responseTokens: 0,
        thinkingTokens: 0,
        documentsUploaded: 0,
        totalStorageBytes: 0,
        lastActive: new Date().toISOString(),
        featureUsage: {},
        monthlyUsage: {},
      });
      await updateGlobalStats({ totalUsers: increment(1) });
    }
  }
};

export const trackUsage = async (userId: string, data: UsageData) => {
  if (!userId) return;
  const month = new Date().toISOString().substring(0, 7); // YYYY-MM
  const docRef = doc(db, `users/${userId}/usage/stats`);

  const updates: any = {
    totalTokensUsed: increment(data.totalTokens || 0),
    promptTokens: increment(data.promptTokens || 0),
    responseTokens: increment(data.responseTokens || 0),
    thinkingTokens: increment(data.thinkingTokens || 0),
    lastActive: new Date().toISOString(),
  };

  if (data.feature) {
    updates[`featureUsage.${data.feature}`] = increment(data.totalTokens || 0);
  }
  updates[`monthlyUsage.${month}`] = increment(data.totalTokens || 0);

  const costIncrement =
    ((data.promptTokens || 0) / 1000000) * 0.15 +
    ((data.responseTokens || 0) / 1000000) * 0.6 +
    ((data.thinkingTokens || 0) / 1000000) * 3.5;

  const globalUpdates: any = {
    totalTokensUsed: increment(data.totalTokens || 0),
    totalPromptTokens: increment(data.promptTokens || 0),
    totalResponseTokens: increment(data.responseTokens || 0),
    totalThinkingTokens: increment(data.thinkingTokens || 0),
    estimatedCostUSD: increment(costIncrement),
  };
  if (data.feature) {
    globalUpdates[`featureTokens.${data.feature}`] = increment(data.totalTokens || 0);
  }

  try {
    await updateDoc(docRef, updates);
  } catch (error: any) {
    if (error.code === "not-found") {
      await setDoc(docRef, {
        totalTokensUsed: data.totalTokens || 0,
        promptTokens: data.promptTokens || 0,
        responseTokens: data.responseTokens || 0,
        thinkingTokens: data.thinkingTokens || 0,
        documentsUploaded: 0,
        totalStorageBytes: 0,
        lastActive: new Date().toISOString(),
        featureUsage: data.feature ? { [data.feature]: data.totalTokens || 0 } : {},
        monthlyUsage: { [month]: data.totalTokens || 0 },
      });
      globalUpdates.totalUsers = increment(1);
    } else {
      console.error("Usage tracking error:", error);
    }
  }

  await updateGlobalStats(globalUpdates);
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
    if (error.code === "not-found") {
      await setDoc(docRef, {
        totalTokensUsed: 0,
        promptTokens: 0,
        responseTokens: 0,
        thinkingTokens: 0,
        documentsUploaded: 1,
        totalStorageBytes: fileSizeInBytes,
        lastActive: new Date().toISOString(),
        featureUsage: {},
        monthlyUsage: {},
      });
      await updateGlobalStats({ totalUsers: increment(1) });
    } else {
      console.error("Storage tracking error:", error);
    }
  }

  await updateGlobalStats({
    totalDocumentsUploaded: increment(1),
    totalStorageBytes: increment(fileSizeInBytes),
  });
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
    thinkingTokens: 0,
    documentsUploaded: 0,
    totalStorageBytes: 0,
    lastActive: null,
  };
};

export const getAllUsersUsage = async () => {
  try {
    const querySnapshot = await getDocs(collectionGroup(db, "usage"));
    const usageData: any[] = [];
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const MONTH = 30 * DAY;

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
        } catch (e) {}

        const data = docSnap.data();
        const lastActiveTime = data.lastActive ? new Date(data.lastActive).getTime() : 0;
        const isActiveToday = now - lastActiveTime < DAY;
        const isActiveThisMonth = now - lastActiveTime < MONTH;

        usageData.push({
          userId,
          email,
          isActiveToday,
          isActiveThisMonth,
          ...data,
        });
      }
    }

    // Sort by Total Tokens descending
    usageData.sort((a, b) => (b.totalTokensUsed || 0) - (a.totalTokensUsed || 0));

    // Update global active users stats
    const activeToday = usageData.filter((u) => u.isActiveToday).length;
    const activeThisMonth = usageData.filter((u) => u.isActiveThisMonth).length;
    await updateGlobalStats({
      activeUsersToday: activeToday,
      activeUsersThisMonth: activeThisMonth,
      totalUsers: usageData.length,
    });

    return usageData;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

