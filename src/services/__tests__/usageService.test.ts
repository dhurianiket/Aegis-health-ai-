import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getEstCost,
  getAllUsersUsage,
  getUserUsageStats,
  markUserActive,
  trackUsage,
  getUserSubscription,
  updateUserSubscription,
  checkCanUploadReport,
} from "../usageService";
import * as firestore from "firebase/firestore";

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<typeof import("firebase/firestore")>("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn((db, path) => ({ db, path })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    getDocs: vi.fn(),
    collection: vi.fn((db, path) => ({ db, path, type: "collection" })),
    collectionGroup: vi.fn((db, path) => ({ db, path, type: "collectionGroup" })),
    increment: vi.fn((val) => ({ _methodName: "increment", operand: val })),
    serverTimestamp: vi.fn(() => "MOCK_TIMESTAMP"),
  };
});

vi.mock("../../lib/firebase/config", () => ({
  db: {},
}));

describe("usageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEstCost pricing math", () => {
    it("should correctly compute Gemini API cost based on exact pricing formula", () => {
      // 1M prompt ($0.15) + 1M response ($0.60) + 1M thinking ($3.50) = $4.25
      const cost = getEstCost(1_000_000, 1_000_000, 1_000_000);
      expect(cost).toBeCloseTo(4.25, 5);
    });

    it("should handle default parameter values", () => {
      expect(getEstCost()).toBe(0);
      expect(getEstCost(0, 0, 0)).toBe(0);
    });

    it("should compute accurate costs for fractional token usage", () => {
      // 500k prompt: 0.5 * $0.15 = $0.075
      // 200k response: 0.2 * $0.60 = $0.12
      // 100k thinking: 0.1 * $3.50 = $0.35
      // Total = 0.075 + 0.12 + 0.35 = 0.545
      const cost = getEstCost(500_000, 200_000, 100_000);
      expect(cost).toBeCloseTo(0.545, 5);
    });
  });

  describe("getAllUsersUsage & Active User Metrics", () => {
    it("should batch index root users and collectionGroup usage (including zero usage users)", async () => {
      const now = Date.now();
      const activeRecent = new Date(now - 1 * 60 * 60 * 1000).toISOString(); // 1 hr ago (active today & month)
      const activeOlder = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago (active month only)

      // Mock users collection snapshot
      const mockUsersDocs = [
        {
          id: "user1",
          data: () => ({ email: "user1@example.com", role: "user" }),
        },
        {
          id: "user2",
          data: () => ({ email: "user2@example.com", role: "user" }),
        },
        {
          id: "user3_no_usage",
          data: () => ({ email: "user3@example.com", role: "user" }),
        },
      ];
      const mockUsersSnapshot = { docs: mockUsersDocs };

      // Mock usage collectionGroup snapshot
      const mockUsageDocs = [
        {
          id: "stats",
          ref: { parent: { parent: { id: "user1" } } },
          data: () => ({
            totalTokensUsed: 50000,
            promptTokens: 30000,
            responseTokens: 10000,
            thinkingTokens: 10000,
            documentsUploaded: 5,
            totalStorageBytes: 2097152,
            lastActive: activeRecent,
            featureUsage: { chat: 30000, pdf_extraction: 20000 },
          }),
        },
        {
          id: "stats",
          ref: { parent: { parent: { id: "user2" } } },
          data: () => ({
            totalTokensUsed: 10000,
            promptTokens: 8000,
            responseTokens: 2000,
            thinkingTokens: 0,
            documentsUploaded: 1,
            totalStorageBytes: 524288,
            lastActive: activeOlder,
            featureUsage: { chat: 10000 },
          }),
        },
      ];
      const mockUsageSnapshot = { docs: mockUsageDocs };

      (firestore.getDocs as any).mockImplementation((queryRef: any) => {
        if (queryRef.type === "collection") {
          return Promise.resolve(mockUsersSnapshot);
        }
        if (queryRef.type === "collectionGroup") {
          return Promise.resolve(mockUsageSnapshot);
        }
        return Promise.resolve({ docs: [] });
      });

      const usersUsage = await getAllUsersUsage();

      // All 3 users must be present
      expect(usersUsage).toHaveLength(3);

      // Order should be sorted by totalTokensUsed descending
      expect(usersUsage[0].userId).toBe("user1");
      expect(usersUsage[0].totalTokensUsed).toBe(50000);
      expect(usersUsage[0].isActiveToday).toBe(true);
      expect(usersUsage[0].isActiveThisMonth).toBe(true);

      expect(usersUsage[1].userId).toBe("user2");
      expect(usersUsage[1].totalTokensUsed).toBe(10000);
      expect(usersUsage[1].isActiveToday).toBe(false);
      expect(usersUsage[1].isActiveThisMonth).toBe(true);

      // User3 with zero token usage must be included
      expect(usersUsage[2].userId).toBe("user3_no_usage");
      expect(usersUsage[2].totalTokensUsed).toBe(0);
      expect(usersUsage[2].email).toBe("user3@example.com");
      expect(usersUsage[2].isActiveToday).toBe(false);
      expect(usersUsage[2].isActiveThisMonth).toBe(false);
    });

    it("should fallback email resolution gracefully when root email is missing", async () => {
      const mockUsersDocs = [
        {
          id: "user_no_root_email",
          data: () => ({ role: "user" }), // missing email at root
        },
        {
          id: "user_unknown",
          data: () => ({}), // completely empty
        },
      ];
      const mockUsersSnapshot = { docs: mockUsersDocs };

      (firestore.getDocs as any).mockImplementation((queryRef: any) => {
        if (queryRef.type === "collection") {
          return Promise.resolve(mockUsersSnapshot);
        }
        return Promise.resolve({ docs: [] });
      });

      (firestore.getDoc as any).mockImplementation((docRef: any) => {
        if (docRef.path.includes("user_no_root_email/profile/main")) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ email: "fallback@example.com" }),
          });
        }
        return Promise.resolve({
          exists: () => false,
          data: () => ({}),
        });
      });

      const usersUsage = await getAllUsersUsage();
      const fallbackUser = usersUsage.find((u) => u.userId === "user_no_root_email");
      const unknownUser = usersUsage.find((u) => u.userId === "user_unknown");

      expect(fallbackUser?.email).toBe("fallback@example.com");
      expect(unknownUser?.email).toBe("Unknown");
    });
  });

  describe("getUserUsageStats", () => {
    it("should return null if userId is empty", async () => {
      const stats = await getUserUsageStats("");
      expect(stats).toBeNull();
    });

    it("should return default stats object if document does not exist", async () => {
      (firestore.getDoc as any).mockResolvedValueOnce({
        exists: () => false,
      });

      const stats = await getUserUsageStats("nonexistent");
      expect(stats).toEqual({
        totalTokensUsed: 0,
        promptTokens: 0,
        responseTokens: 0,
        thinkingTokens: 0,
        documentsUploaded: 0,
        totalStorageBytes: 0,
        lastActive: null,
      });
    });
  });

  describe("Feature Tokens Telemetry & Uninitialized globalStats Stress Test", () => {
    it("should correctly update globalStats with feature token maps for chat, specialist, pdf_extraction, sbar, summary", async () => {
      (firestore.updateDoc as any).mockResolvedValue();

      await trackUsage("user_test", {
        promptTokens: 1000,
        responseTokens: 500,
        thinkingTokens: 200,
        totalTokens: 1700,
        feature: "pdf_extraction",
      });

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          "featureTokens.pdf_extraction": expect.anything(),
        })
      );
    });

    it("should initialize default featureTokens map when globalStats document is missing (not-found)", async () => {
      (firestore.updateDoc as any).mockRejectedValue({ code: "not-found" });
      (firestore.setDoc as any).mockResolvedValue();

      await trackUsage("user_test_new", {
        promptTokens: 500,
        responseTokens: 200,
        thinkingTokens: 100,
        totalTokens: 800,
        feature: "sbar",
      });

      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          featureTokens: {
            pdf_extraction: 0,
            chat: 0,
            sbar: 0,
            summary: 0,
            specialist: 0,
          },
        })
      );
    });
  });

  describe("Early Access Beta Subscription & Report Quota Exemption", () => {
    it("should grant unlimited monthlyScanLimit (Infinity) for default free users during beta", async () => {
      (firestore.getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      const sub = await getUserSubscription("user_beta_default");
      expect(sub.planId).toBe("free");
      expect(sub.planName).toBe("Early Access Beta");
      expect(sub.monthlyScanLimit).toBe(Infinity);
    });

    it("should override legacy cached free subscription limits to Infinity", async () => {
      const mockStorage: Record<string, string> = {
        aegis_user_sub_legacy_user: JSON.stringify({
          planId: "free",
          planName: "Free Basic",
          status: "active",
          scansUsedThisMonth: 12,
          monthlyScanLimit: 3,
          expiresAt: null,
          updatedAt: new Date().toISOString(),
        }),
      };

      vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => mockStorage[key] || null);

      const sub = await getUserSubscription("legacy_user");
      expect(sub.monthlyScanLimit).toBe(Infinity);
      expect(sub.planName).toBe("Early Access Beta");

      vi.restoreAllMocks();
    });

    it("should always allow report uploads and never block via checkCanUploadReport", async () => {
      (firestore.getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      const res = await checkCanUploadReport("user_consecutive_uploads");
      expect(res.allowed).toBe(true);
      expect(res.limit).toBe(Infinity);
    });

    it("should migrate expired Firestore subscription to Early Access Beta with Infinity scan limit", async () => {
      (firestore.getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({
          planId: "b2c_monthly",
          planName: "Aegis Pro Monthly",
          status: "expired",
          scansUsedThisMonth: 18,
          monthlyScanLimit: 3,
          expiresAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
        }),
      });

      const sub = await getUserSubscription("expired_firestore_user");
      expect(sub.planId).toBe("free");
      expect(sub.planName).toBe("Early Access Beta");
      expect(sub.monthlyScanLimit).toBe(Infinity);
    });

    it("should gracefully return allowed: true if getUserSubscription throws or fails in checkCanUploadReport", async () => {
      (firestore.getDoc as any).mockRejectedValue(new Error("Firestore network disconnect"));

      const res = await checkCanUploadReport("network_offline_user");
      expect(res.allowed).toBe(true);
      expect(res.limit).toBe(Infinity);
      expect(res.planId).toBe("free");
    });

    it("should enforce Infinity limit when updateUserSubscription is called during beta", async () => {
      (firestore.getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      const updated = await updateUserSubscription("user_update_test", {
        planId: "free",
        monthlyScanLimit: 3,
      });

      expect(updated.monthlyScanLimit).toBe(Infinity);
      expect(updated.planName).toBe("Early Access Beta");
    });

    it("should allow users with 50+ recorded scans in Firestore to upload without quota blocks", async () => {
      (firestore.getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({
          planId: "free",
          planName: "Early Access Beta",
          status: "active",
          scansUsedThisMonth: 65,
          monthlyScanLimit: 3, // legacy limit
          expiresAt: null,
          updatedAt: new Date().toISOString(),
        }),
      });

      const res = await checkCanUploadReport("heavy_user_with_scans");
      expect(res.allowed).toBe(true);
      expect(res.scansUsed).toBe(65);
      expect(res.limit).toBe(Infinity);
    });

    it("should migrate canceled Firestore subscription to Early Access Beta with Infinity scan limit", async () => {
      (firestore.getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({
          planId: "b2c_monthly",
          planName: "Aegis Pro Monthly",
          status: "canceled",
          scansUsedThisMonth: 5,
          monthlyScanLimit: 3,
          expiresAt: null,
          updatedAt: "2023-01-01T00:00:00Z",
        }),
      });

      const sub = await getUserSubscription("canceled_firestore_user");
      expect(sub.planId).toBe("free");
      expect(sub.planName).toBe("Early Access Beta");
      expect(sub.monthlyScanLimit).toBe(Infinity);
      expect(sub.status).toBe("active");
    });

    it("should handle empty or whitespace user ID safely without erroring", async () => {
      const sub1 = await getUserSubscription("");
      expect(sub1.monthlyScanLimit).toBe(Infinity);
      expect(sub1.planName).toBe("Early Access Beta");

      const sub2 = await getUserSubscription("   ");
      expect(sub2.monthlyScanLimit).toBe(Infinity);
      expect(sub2.planName).toBe("Early Access Beta");

      const res = await checkCanUploadReport("   ");
      expect(res.allowed).toBe(true);
      expect(res.limit).toBe(Infinity);
    });

    it("should normalize arbitrary legacy plan names on free tier to Early Access Beta", async () => {
      (firestore.getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({
          planId: "free",
          planName: "Old Starter Tier",
          status: "active",
          scansUsedThisMonth: 2,
          monthlyScanLimit: 3,
          expiresAt: null,
          updatedAt: new Date().toISOString(),
        }),
      });

      const sub = await getUserSubscription("legacy_named_user");
      expect(sub.planId).toBe("free");
      expect(sub.planName).toBe("Early Access Beta");
      expect(sub.monthlyScanLimit).toBe(Infinity);
    });

    it("should handle non-string or numeric userId safely without TypeError", async () => {
      const sub = await getUserSubscription(12345 as any);
      expect(sub.monthlyScanLimit).toBe(Infinity);
      expect(sub.planName).toBe("Early Access Beta");

      const res = await checkCanUploadReport(12345 as any);
      expect(res.allowed).toBe(true);
      expect(res.limit).toBe(Infinity);
    });

    it("should migrate canceled status in updateUserSubscription to active Early Access Beta", async () => {
      (firestore.getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({
          planId: "b2c_monthly",
          planName: "Aegis Pro",
          status: "active",
          monthlyScanLimit: 100,
        }),
      });

      const updated = await updateUserSubscription("user_canceling_sub", {
        status: "canceled",
      });

      expect(updated.planId).toBe("free");
      expect(updated.planName).toBe("Early Access Beta");
      expect(updated.status).toBe("active");
      expect(updated.monthlyScanLimit).toBe(Infinity);
    });

    it("should populate default fields when localStorage contains partial subscription object", async () => {
      const mockStorage: Record<string, string> = {
        aegis_user_sub_partial_user: JSON.stringify({
          planId: "free",
        }),
      };

      vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => mockStorage[key] || null);

      const sub = await getUserSubscription("partial_user");
      expect(sub.planId).toBe("free");
      expect(sub.planName).toBe("Early Access Beta");
      expect(sub.status).toBe("active");
      expect(sub.scansUsedThisMonth).toBe(0);
      expect(sub.monthlyScanLimit).toBe(Infinity);

      vi.restoreAllMocks();
    });
  });
});


