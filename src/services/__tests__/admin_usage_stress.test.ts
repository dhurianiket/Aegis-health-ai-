import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getEstCost,
  getAllUsersUsage,
  getUserUsageStats,
  markUserActive,
  trackUsage,
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

describe("Admin Usage Dashboard Empirical Stress Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Pricing & Cost Math Boundaries", () => {
    it("should compute exact cost for standard 1M token inputs", () => {
      // 1M prompt ($0.15) + 1M response ($0.60) + 1M thinking ($3.50) = $4.25
      const cost = getEstCost(1_000_000, 1_000_000, 1_000_000);
      expect(cost).toBeCloseTo(4.25, 6);
    });

    it("should verify Gemini pricing rates ($0.15/1M prompt, $0.60/1M response, $3.50/1M thinking)", () => {
      expect(getEstCost(1_000_000, 0, 0)).toBeCloseTo(0.15, 6);
      expect(getEstCost(0, 1_000_000, 0)).toBeCloseTo(0.60, 6);
      expect(getEstCost(0, 0, 1_000_000)).toBeCloseTo(3.50, 6);
    });

    it("should handle extremely large token inputs without precision overflow", () => {
      // 1 Billion of each
      // Prompt: 1,000,000,000 / 1M * 0.15 = 150
      // Resp:   1,000,000,000 / 1M * 0.60 = 600
      // Think:  1,000,000,000 / 1M * 3.50 = 3500
      // Total: 150 + 600 + 3500 = 4250
      const billionCost = getEstCost(1_000_000_000, 1_000_000_000, 1_000_000_000);
      expect(billionCost).toBe(4250);

      // 1 Trillion tokens
      const trillionCost = getEstCost(1_000_000_000_000, 1_000_000_000_000, 1_000_000_000_000);
      expect(trillionCost).toBe(4_250_000);
    });

    it("should handle fractional token inputs accurately", () => {
      // Single token inputs
      const prompt1 = getEstCost(1, 0, 0); // 0.00000015
      const resp1 = getEstCost(0, 1, 0);   // 0.00000060
      const think1 = getEstCost(0, 0, 1);  // 0.00000350

      expect(prompt1).toBeCloseTo(0.00000015, 8);
      expect(resp1).toBeCloseTo(0.00000060, 8);
      expect(think1).toBeCloseTo(0.00000350, 8);
    });

    it("should handle 0 and default parameters", () => {
      expect(getEstCost()).toBe(0);
      expect(getEstCost(0, 0, 0)).toBe(0);
    });
  });

  describe("2. getAllUsersUsage Boundary Behavior", () => {
    it("should correctly handle users with 0 usage stats", async () => {
      const mockUsersDocs = [
        {
          id: "user_zero_usage",
          data: () => ({ email: "zero@example.com", role: "user" }),
        },
      ];
      const mockUsersSnapshot = { docs: mockUsersDocs };
      const mockUsageSnapshot = { docs: [] }; // No usage docs in subcollection

      (firestore.getDocs as any).mockImplementation((queryRef: any) => {
        if (queryRef.type === "collection") return Promise.resolve(mockUsersSnapshot);
        if (queryRef.type === "collectionGroup") return Promise.resolve(mockUsageSnapshot);
        return Promise.resolve({ docs: [] });
      });

      const usersUsage = await getAllUsersUsage();
      expect(usersUsage).toHaveLength(1);
      const user = usersUsage[0];
      expect(user.userId).toBe("user_zero_usage");
      expect(user.email).toBe("zero@example.com");
      expect(user.totalTokensUsed).toBe(0);
      expect(user.promptTokens).toBe(0);
      expect(user.responseTokens).toBe(0);
      expect(user.thinkingTokens).toBe(0);
      expect(user.documentsUploaded).toBe(0);
      expect(user.totalStorageBytes).toBe(0);
      expect(user.lastActive).toBeNull();
      expect(user.isActiveToday).toBe(false);
      expect(user.isActiveThisMonth).toBe(false);
    });

    it("should fallback email resolution when missing in root user doc but present in profile/main", async () => {
      const mockUsersDocs = [
        {
          id: "user_missing_root_email",
          data: () => ({ role: "user" }), // missing email key
        },
      ];
      const mockUsersSnapshot = { docs: mockUsersDocs };
      const mockUsageSnapshot = { docs: [] };

      (firestore.getDocs as any).mockImplementation((queryRef: any) => {
        if (queryRef.type === "collection") return Promise.resolve(mockUsersSnapshot);
        if (queryRef.type === "collectionGroup") return Promise.resolve(mockUsageSnapshot);
        return Promise.resolve({ docs: [] });
      });

      (firestore.getDoc as any).mockImplementation((docRef: any) => {
        if (docRef.path.includes("user_missing_root_email/profile/main")) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ email: "profile_email@example.com" }),
          });
        }
        return Promise.resolve({ exists: () => false, data: () => ({}) });
      });

      const usersUsage = await getAllUsersUsage();
      expect(usersUsage).toHaveLength(1);
      expect(usersUsage[0].email).toBe("profile_email@example.com");
    });

    it("should fallback email resolution to Unknown when missing in both root and profile/main", async () => {
      const mockUsersDocs = [
        {
          id: "user_no_email_anywhere",
          data: () => ({ role: "user" }), // missing email key
        },
      ];
      const mockUsersSnapshot = { docs: mockUsersDocs };
      const mockUsageSnapshot = { docs: [] };

      (firestore.getDocs as any).mockImplementation((queryRef: any) => {
        if (queryRef.type === "collection") return Promise.resolve(mockUsersSnapshot);
        if (queryRef.type === "collectionGroup") return Promise.resolve(mockUsageSnapshot);
        return Promise.resolve({ docs: [] });
      });

      (firestore.getDoc as any).mockImplementation(() => {
        return Promise.resolve({ exists: () => false, data: () => ({}) });
      });

      const usersUsage = await getAllUsersUsage();
      expect(usersUsage).toHaveLength(1);
      expect(usersUsage[0].email).toBe("Unknown");
    });

    it("should calculate active user flags accurately (isActiveToday, isActiveThisMonth)", async () => {
      const now = Date.now();
      const ONE_HOUR = 1 * 60 * 60 * 1000;
      const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;
      const TWENTY_FIVE_HOURS = 25 * 60 * 60 * 1000;
      const TWENTY_NINE_DAYS = 29 * 24 * 60 * 60 * 1000;
      const THIRTY_ONE_DAYS = 31 * 24 * 60 * 60 * 1000;

      const mockUsersDocs = [
        { id: "u_recent", data: () => ({ email: "u1@ex.com" }) },
        { id: "u_23h", data: () => ({ email: "u2@ex.com" }) },
        { id: "u_25h", data: () => ({ email: "u3@ex.com" }) },
        { id: "u_29d", data: () => ({ email: "u4@ex.com" }) },
        { id: "u_31d", data: () => ({ email: "u5@ex.com" }) },
      ];

      const mockUsageDocs = [
        {
          id: "stats",
          ref: { parent: { parent: { id: "u_recent" } } },
          data: () => ({ lastActive: new Date(now - ONE_HOUR).toISOString(), totalTokensUsed: 100 }),
        },
        {
          id: "stats",
          ref: { parent: { parent: { id: "u_23h" } } },
          data: () => ({ lastActive: new Date(now - TWENTY_THREE_HOURS).toISOString(), totalTokensUsed: 100 }),
        },
        {
          id: "stats",
          ref: { parent: { parent: { id: "u_25h" } } },
          data: () => ({ lastActive: new Date(now - TWENTY_FIVE_HOURS).toISOString(), totalTokensUsed: 100 }),
        },
        {
          id: "stats",
          ref: { parent: { parent: { id: "u_29d" } } },
          data: () => ({ lastActive: new Date(now - TWENTY_NINE_DAYS).toISOString(), totalTokensUsed: 100 }),
        },
        {
          id: "stats",
          ref: { parent: { parent: { id: "u_31d" } } },
          data: () => ({ lastActive: new Date(now - THIRTY_ONE_DAYS).toISOString(), totalTokensUsed: 100 }),
        },
      ];

      (firestore.getDocs as any).mockImplementation((queryRef: any) => {
        if (queryRef.type === "collection") return Promise.resolve({ docs: mockUsersDocs });
        if (queryRef.type === "collectionGroup") return Promise.resolve({ docs: mockUsageDocs });
        return Promise.resolve({ docs: [] });
      });

      const results = await getAllUsersUsage();
      const findU = (id: string) => results.find((u) => u.userId === id);

      // u_recent: active today & this month
      expect(findU("u_recent")?.isActiveToday).toBe(true);
      expect(findU("u_recent")?.isActiveThisMonth).toBe(true);

      // u_23h: active today (<24h) & this month
      expect(findU("u_23h")?.isActiveToday).toBe(true);
      expect(findU("u_23h")?.isActiveThisMonth).toBe(true);

      // u_25h: NOT active today (>24h), but active this month (<30d)
      expect(findU("u_25h")?.isActiveToday).toBe(false);
      expect(findU("u_25h")?.isActiveThisMonth).toBe(true);

      // u_29d: NOT active today, but active this month (<30d)
      expect(findU("u_29d")?.isActiveToday).toBe(false);
      expect(findU("u_29d")?.isActiveThisMonth).toBe(true);

      // u_31d: NOT active today, NOT active this month (>30d)
      expect(findU("u_31d")?.isActiveToday).toBe(false);
      expect(findU("u_31d")?.isActiveThisMonth).toBe(false);
    });
  });
});
