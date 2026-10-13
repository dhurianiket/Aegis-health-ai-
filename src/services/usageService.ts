import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collectionGroup,
  getDocs,
  collection,
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

export type SubscriptionPlanId =
  | 'free'
  | 'b2c_monthly'
  | 'b2c_quarterly'
  | 'b2b_clinic_monthly'
  | 'b2b_clinic_quarterly';

export interface UserSubscription {
  planId: SubscriptionPlanId;
  planName: string;
  status: 'active' | 'expired' | 'canceled';
  scansUsedThisMonth: number;
  monthlyScanLimit: number; // Infinity during Early Access Beta
  expiresAt: string | null;
  paymentId?: string;
  updatedAt: string;
}

const LOCAL_SUB_PREFIX = 'aegis_user_sub';

export const getUserSubscription = async (userId: string, userEmail?: string): Promise<UserSubscription> => {
  const masterAdminSub: UserSubscription = {
    planId: 'b2b_clinic_quarterly',
    planName: 'Master Admin Access',
    status: 'active',
    scansUsedThisMonth: 0,
    monthlyScanLimit: Infinity,
    expiresAt: '2030-12-31T23:59:59Z',
    updatedAt: new Date().toISOString(),
  };

  const defaultFreeSub: UserSubscription = {
    planId: 'free',
    planName: 'Early Access Beta',
    status: 'active',
    scansUsedThisMonth: 0,
    monthlyScanLimit: Infinity,
    expiresAt: null,
    updatedAt: new Date().toISOString(),
  };

  if (userEmail && userEmail.toLowerCase() === 'dhurianiket@gmail.com') {
    return masterAdminSub;
  }

  if (!userId || typeof userId !== 'string' || !userId.trim()) return defaultFreeSub;

  const cleanUserId = userId.trim();

  // 1. Check Local Storage first for fast offline UI state
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = window.localStorage.getItem(`${LOCAL_SUB_PREFIX}_${cleanUserId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          // Early Access Beta: Ensure free/expired/canceled subscriptions receive unlimited beta quota
          const isExpired =
            parsed.status === 'expired' ||
            parsed.status === 'canceled' ||
            Boolean(parsed.expiresAt && !isNaN(new Date(parsed.expiresAt).getTime()) && new Date(parsed.expiresAt).getTime() < Date.now());
          if (isExpired || !parsed.planId || parsed.planId === 'free') {
            parsed.planId = 'free';
            parsed.planName = 'Early Access Beta';
            parsed.status = 'active';
            parsed.monthlyScanLimit = Infinity;
          }
          if (!parsed.monthlyScanLimit || parsed.monthlyScanLimit < 100) {
            parsed.planName = 'Early Access Beta';
            parsed.monthlyScanLimit = Infinity;
          }
          return {
            ...defaultFreeSub,
            ...parsed,
            monthlyScanLimit: Infinity,
            planName: parsed.planId === 'free' ? 'Early Access Beta' : (parsed.planName || 'Early Access Beta'),
          };
        }
      }
    }
  } catch {
    // Ignore
  }

  // 2. Fetch from Firestore doc users/{userId}/subscription/main
  try {
    const docRef = doc(db, `users/${cleanUserId}/subscription/main`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = (docSnap.data() || {}) as Partial<UserSubscription>;
      // Early Access Beta: Ensure expired/canceled subscriptions receive unlimited beta quota
      const isExpired =
        data.status === 'expired' ||
        data.status === 'canceled' ||
        Boolean(data.expiresAt && !isNaN(new Date(data.expiresAt).getTime()) && new Date(data.expiresAt).getTime() < Date.now());
      if (isExpired || !data.planId || data.planId === 'free') {
        data.planId = 'free';
        data.planName = 'Early Access Beta';
        data.status = 'active';
        data.monthlyScanLimit = Infinity;
      }
      // Early Access Beta: Lift report quotas for all registered users on free plan
      if (!data.monthlyScanLimit || data.monthlyScanLimit < 100) {
        data.monthlyScanLimit = Infinity;
        data.planName = 'Early Access Beta';
      }
      const fullSub: UserSubscription = {
        ...defaultFreeSub,
        ...data,
        monthlyScanLimit: Infinity,
        planName: data.planId === 'free' ? 'Early Access Beta' : (data.planName || 'Early Access Beta'),
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`${LOCAL_SUB_PREFIX}_${cleanUserId}`, JSON.stringify(fullSub));
      }
      return fullSub;
    }
  } catch {
    // Return default free plan on network offline
  }

  return defaultFreeSub;
};

export const updateUserSubscription = async (
  userId: string,
  updates: Partial<UserSubscription>
): Promise<UserSubscription> => {
  const current = await getUserSubscription(userId);
  const updated: UserSubscription = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Early Access Beta: Enforce unlimited quota and normalize canceled/expired plans during beta
  if (
    updated.status === 'canceled' ||
    updated.status === 'expired' ||
    updated.planId === 'free' ||
    !updated.monthlyScanLimit ||
    updated.monthlyScanLimit < 100
  ) {
    updated.planId = 'free';
    updated.planName = 'Early Access Beta';
    updated.status = 'active';
    updated.monthlyScanLimit = Infinity;
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : '';

  try {
    if (cleanUserId && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${LOCAL_SUB_PREFIX}_${cleanUserId}`, JSON.stringify(updated));
    }
  } catch {}

  if (cleanUserId) {
    try {
      const docRef = doc(db, `users/${cleanUserId}/subscription/main`);
      await setDoc(docRef, updated, { merge: true });
    } catch {}
  }

  return updated;
};

export const checkCanUploadReport = async (
  userId: string
): Promise<{ allowed: boolean; scansUsed: number; limit: number; planId: string }> => {
  try {
    const sub = await getUserSubscription(userId);
    // Early Access Beta: All registered users receive unlimited monthly report processing quota
    return {
      allowed: true,
      scansUsed: sub?.scansUsedThisMonth || 0,
      limit: Infinity,
      planId: sub?.planId || 'free',
    };
  } catch {
    return {
      allowed: true,
      scansUsed: 0,
      limit: Infinity,
      planId: 'free',
    };
  }
};

export const getEstCost = (prompt: number = 0, resp: number = 0, think: number = 0): number => {
  return (prompt / 1000000) * 0.15 + (resp / 1000000) * 0.6 + (think / 1000000) * 3.5;
};

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
        // Silently swallow missing permissions on set
      }
    } else {
      // Silently swallow global stats errors
    }
  }
};

export const markUserActive = async (
  userId: string,
  email?: string | null,
  displayName?: string | null,
  photoURL?: string | null
) => {
  if (!userId) return;
  const nowIso = new Date().toISOString();

  // 1. Ensure root user document exists and is up-to-date
  try {
    const userDocRef = doc(db, `users/${userId}`);
    const isMasterAdmin = email?.toLowerCase() === "dhurianiket@gmail.com";
    const userProfileUpdates: Record<string, any> = {
      lastActive: nowIso,
    };
    if (email) userProfileUpdates.email = email;
    if (displayName) userProfileUpdates.displayName = displayName;
    if (photoURL) userProfileUpdates.photoURL = photoURL;
    if (isMasterAdmin) {
      userProfileUpdates.role = "admin";
    }

    await setDoc(userDocRef, userProfileUpdates, { merge: true });
  } catch {
    // Non-critical, continue
  }

  // 2. Update usage stats subcollection
  const docRef = doc(db, `users/${userId}/usage/stats`);
  try {
    await updateDoc(docRef, { lastActive: nowIso });
  } catch (error: any) {
    if (error.code === "not-found") {
      await setDoc(docRef, {
        totalTokensUsed: 0,
        promptTokens: 0,
        responseTokens: 0,
        thinkingTokens: 0,
        documentsUploaded: 0,
        totalStorageBytes: 0,
        lastActive: nowIso,
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

  const costIncrement = getEstCost(data.promptTokens, data.responseTokens, data.thinkingTokens);

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
      // Silently swallow
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
      // Silently swallow
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
    // 1. Batch fetch all registered root users
    const usersSnapshot = await getDocs(collection(db, "users"));
    const usersMap = new Map<string, { email: string; displayName?: string; role?: string }>();

    usersSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      usersMap.set(docSnap.id, {
        email: data.email || "",
        displayName: data.displayName || "",
        role: data.role,
      });
    });

    // 2. Fetch usage stats via collectionGroup
    const usageSnapshot = await getDocs(collectionGroup(db, "usage"));
    const usageStatsMap = new Map<string, any>();

    for (const docSnap of usageSnapshot.docs) {
      if (docSnap.id === "stats") {
        const userId = docSnap.ref.parent?.parent?.id;
        if (userId) {
          usageStatsMap.set(userId, docSnap.data());
        }
      }
    }

    // 3. Optional live cross-check with collectionGroup("documents")
    const userDocsCountMap = new Map<string, number>();
    const userStorageMap = new Map<string, number>();
    try {
      const docsSnapshot = await getDocs(collectionGroup(db, "documents"));
      for (const dSnap of docsSnapshot.docs) {
        if (dSnap.id !== "stats") {
          const docData = dSnap.data();
          const uId = dSnap.ref?.parent?.parent?.id || docData.userId || docData.patientId;
          if (uId) {
            userDocsCountMap.set(uId, (userDocsCountMap.get(uId) || 0) + 1);
            if (docData.fileSize && typeof docData.fileSize === "number") {
              userStorageMap.set(uId, (userStorageMap.get(uId) || 0) + docData.fileSize);
            }
          }
        }
      }
    } catch {
      // Swallowed if permission or test mock doesn't handle multiple collectionGroups
    }

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const MONTH = 30 * DAY;
    const usageData: any[] = [];

    // Combine user IDs from all collections
    const allUserIds = new Set([...usersMap.keys(), ...usageStatsMap.keys(), ...userDocsCountMap.keys()]);

    for (const userId of allUserIds) {
      const rootUserInfo = usersMap.get(userId);
      const statsData = usageStatsMap.get(userId) || {};

      let email = rootUserInfo?.email || "";

      // Fallback check profile/main if email is missing from root
      if (!email) {
        try {
          const profileSnap = await getDoc(doc(db, `users/${userId}/profile/main`));
          if (profileSnap.exists()) {
            email = profileSnap.data().email || "";
          }
        } catch (e) {}
      }

      if (!email) {
        email = "Unknown";
      }

      const lastActiveTime = statsData.lastActive ? new Date(statsData.lastActive).getTime() : 0;
      const isActiveToday = lastActiveTime > 0 && now - lastActiveTime < DAY;
      const isActiveThisMonth = lastActiveTime > 0 && now - lastActiveTime < MONTH;

      const docsCount = Math.max(statsData.documentsUploaded || 0, userDocsCountMap.get(userId) || 0);
      const storageBytes = Math.max(statsData.totalStorageBytes || 0, userStorageMap.get(userId) || 0);

      usageData.push({
        userId,
        email,
        displayName: rootUserInfo?.displayName || "",
        role: rootUserInfo?.role || (email.toLowerCase() === "dhurianiket@gmail.com" ? "admin" : "user"),
        isActiveToday,
        isActiveThisMonth,
        totalTokensUsed: statsData.totalTokensUsed || 0,
        promptTokens: statsData.promptTokens || 0,
        responseTokens: statsData.responseTokens || 0,
        thinkingTokens: statsData.thinkingTokens || 0,
        documentsUploaded: docsCount,
        totalStorageBytes: storageBytes,
        lastActive: statsData.lastActive || null,
        featureUsage: statsData.featureUsage || {},
        monthlyUsage: statsData.monthlyUsage || {},
      });
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
  } catch (error: any) {
    if (error.code !== "permission-denied") {
      console.error("Error fetching all users:", error);
    }
    return [];
  }
};

export const syncGlobalStatsLive = async (
  usersData?: any[],
  totalDocumentsCount?: number,
  totalStorageBytesCount?: number
) => {
  try {
    const data = usersData || (await getAllUsersUsage());
    const fallbackFeatureTokens: Record<string, number> = {
      pdf_extraction: 0,
      chat: 0,
      sbar: 0,
      summary: 0,
      specialist: 0,
    };
    const monthlyPlatformUsage: Record<string, number> = {};

    let activeUsersToday = 0;
    let activeUsersThisMonth = 0;
    let totalDocumentsUploaded = totalDocumentsCount ?? 0;
    let totalStorageBytes = totalStorageBytesCount ?? 0;
    let totalTokensUsed = 0;
    let totalPromptTokens = 0;
    let totalResponseTokens = 0;
    let totalThinkingTokens = 0;
    let estimatedCostUSD = 0;

    data.forEach((u: any) => {
      if (u.featureUsage) {
        Object.entries(u.featureUsage).forEach(([feat, tokens]) => {
          fallbackFeatureTokens[feat] = (fallbackFeatureTokens[feat] || 0) + ((tokens as number) || 0);
        });
      }
      if (u.monthlyUsage) {
        Object.entries(u.monthlyUsage).forEach(([month, tokens]) => {
          monthlyPlatformUsage[month] = (monthlyPlatformUsage[month] || 0) + ((tokens as number) || 0);
        });
      }
      if (u.isActiveToday) activeUsersToday++;
      if (u.isActiveThisMonth) activeUsersThisMonth++;
      if (totalDocumentsCount === undefined) {
        totalDocumentsUploaded += u.documentsUploaded || 0;
      }
      if (totalStorageBytesCount === undefined) {
        totalStorageBytes += u.totalStorageBytes || 0;
      }
      totalTokensUsed += u.totalTokensUsed || 0;
      totalPromptTokens += u.promptTokens || 0;
      totalResponseTokens += u.responseTokens || 0;
      totalThinkingTokens += u.thinkingTokens || 0;
      estimatedCostUSD += getEstCost(u.promptTokens, u.responseTokens, u.thinkingTokens);
    });

    const globalStats = {
      totalUsers: data.length,
      activeUsersToday,
      activeUsersThisMonth,
      totalDocumentsUploaded,
      totalStorageBytes,
      totalTokensUsed,
      totalPromptTokens,
      totalResponseTokens,
      totalThinkingTokens,
      estimatedCostUSD: Number(estimatedCostUSD.toFixed(5)),
      featureTokens: fallbackFeatureTokens,
      monthlyPlatformUsage,
      lastUpdated: serverTimestamp(),
    };

    try {
      const globalRef = doc(db, "analytics/globalStats");
      await setDoc(globalRef, globalStats, { merge: true });
    } catch {
      // Swallowed in test environments or offline
    }

    return globalStats;
  } catch {
    return null;
  }
};

