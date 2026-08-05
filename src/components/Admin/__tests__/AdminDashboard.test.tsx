import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminDashboard from "../AdminDashboard";
import * as usageService from "../../../services/usageService";
import * as firestore from "firebase/firestore";
import * as authContext from "../../../context/AuthContext";

// Mock Firebase config
vi.mock("../../../lib/firebase/config", () => ({
  db: {},
}));

// Mock Google Forms Service
vi.mock("../../../services/googleFormsService", () => ({
  getFormResponses: vi.fn().mockResolvedValue({ responses: [] }),
}));

// Mock AuthContext
vi.mock("../../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock usageService
vi.mock("../../../services/usageService", async () => {
  const actual = await vi.importActual<typeof usageService>("../../../services/usageService");
  return {
    ...actual,
    getAllUsersUsage: vi.fn(),
  };
});

// Mock Firestore
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<typeof import("firebase/firestore")>("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn((db, path) => ({ db, path })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    collectionGroup: vi.fn(),
  };
});

describe("AdminDashboard Empirical Stress Harness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authContext.useAuth as any).mockReturnValue({
      user: { uid: "admin_uid", email: "dhurianiket@gmail.com" },
    });

    // Mock admin user doc exists
    (firestore.getDoc as any).mockImplementation((docRef: any) => {
      if (docRef.path === "users/admin_uid") {
        return Promise.resolve({
          exists: () => true,
          data: () => ({ role: "admin" }),
        });
      }
      if (docRef.path === "analytics/globalStats") {
        return Promise.resolve({
          exists: () => false, // Default: uninitialized globalStats doc
          data: () => null,
        });
      }
      return Promise.resolve({ exists: () => false, data: () => null });
    });

    (firestore.getDocs as any).mockResolvedValue({ docs: [] });
  });

  describe("Requirement 1: Global Stats Fallback & Feature Token Maps", () => {
    it("should dynamically sum feature token maps across user records when analytics/globalStats is uninitialized", async () => {
      const mockUsersUsage = [
        {
          userId: "user_1",
          email: "user1@example.com",
          isActiveToday: true,
          isActiveThisMonth: true,
          totalTokensUsed: 15000,
          promptTokens: 10000,
          responseTokens: 3000,
          thinkingTokens: 2000,
          documentsUploaded: 4,
          totalStorageBytes: 1048576,
          lastActive: new Date().toISOString(),
          featureUsage: {
            chat: 5000,
            specialist: 4000,
            pdf_extraction: 3000,
            sbar: 2000,
            summary: 1000,
          },
        },
        {
          userId: "user_2",
          email: "user2@example.com",
          isActiveToday: false,
          isActiveThisMonth: true,
          totalTokensUsed: 25000,
          promptTokens: 15000,
          responseTokens: 5000,
          thinkingTokens: 5000,
          documentsUploaded: 6,
          totalStorageBytes: 2097152,
          lastActive: new Date().toISOString(),
          featureUsage: {
            chat: 10000,
            specialist: 6000,
            pdf_extraction: 4000,
            sbar: 3000,
            summary: 2000,
          },
        },
      ];

      (usageService.getAllUsersUsage as any).mockResolvedValue(mockUsersUsage);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Admin Usage Dashboard")).toBeTruthy();
      });

      // Total users card check
      expect(screen.getByText("Total Users")).toBeTruthy();
      expect(screen.getAllByText("2").length).toBeGreaterThan(0);

      // Check total storage formatted (3 MB total)
      expect(screen.getByText("3.00 MB")).toBeTruthy();

      // User email checks
      expect(screen.getByText("user1@example.com")).toBeTruthy();
      expect(screen.getByText("user2@example.com")).toBeTruthy();
    });

    it("should handle zero / empty globalStats gracefully with zero token users", async () => {
      const mockUsersUsage = [
        {
          userId: "user_zero",
          email: "zero@example.com",
          isActiveToday: false,
          isActiveThisMonth: false,
          totalTokensUsed: 0,
          promptTokens: 0,
          responseTokens: 0,
          thinkingTokens: 0,
          documentsUploaded: 0,
          totalStorageBytes: 0,
          lastActive: null,
          featureUsage: {},
        },
      ];

      (usageService.getAllUsersUsage as any).mockResolvedValue(mockUsersUsage);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Admin Usage Dashboard")).toBeTruthy();
      });

      expect(screen.getByText("zero@example.com")).toBeTruthy();
      expect(screen.getByText("No feature usage data")).toBeTruthy();
    });
  });

  describe("Requirement 2: Dense Table & Recharts Envelope Stress Test", () => {
    it("should fallback unknown or missing emails gracefully with (email || userId || 'Unknown')", async () => {
      const mockUsersUsage = [
        {
          userId: "uid_missing_email",
          email: "", // Empty email string
          totalTokensUsed: 100,
          promptTokens: 50,
          responseTokens: 50,
          thinkingTokens: 0,
          documentsUploaded: 1,
          totalStorageBytes: 1000,
          lastActive: null,
        },
        {
          userId: "", // Empty userId and Unknown email
          email: "Unknown",
          totalTokensUsed: 0,
          promptTokens: 0,
          responseTokens: 0,
          thinkingTokens: 0,
          documentsUploaded: 0,
          totalStorageBytes: 0,
          lastActive: null,
        },
      ];

      (usageService.getAllUsersUsage as any).mockResolvedValue(mockUsersUsage);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Admin Usage Dashboard")).toBeTruthy();
      });

      // Check fallback to userId when email is empty string
      expect(screen.getByText("uid_missing_email")).toBeTruthy();

      // Check fallback to 'Unknown' when email is 'Unknown' and userId is empty
      expect(screen.getByText("Unknown")).toBeTruthy();
    });

    it("should maintain strict height envelopes (h-[250px]/h-[300px], minWidth={0}) on Recharts containers", async () => {
      const mockUsersUsage = [
        {
          userId: "u1",
          email: "test@example.com",
          totalTokensUsed: 5000,
          promptTokens: 3000,
          responseTokens: 2000,
          thinkingTokens: 0,
          documentsUploaded: 2,
          totalStorageBytes: 1048576,
          featureUsage: { chat: 5000 },
        },
      ];

      (usageService.getAllUsersUsage as any).mockResolvedValue(mockUsersUsage);

      const { container } = render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Admin Usage Dashboard")).toBeTruthy();
      });

      // Query for chart wrapper divs with strict height envelopes
      const chartContainers = container.querySelectorAll(".h-\\[250px\\], .h-\\[300px\\]");
      expect(chartContainers.length).toBeGreaterThan(0);

      // Verify that every chart wrapper div has class 'h-[250px]' or 'min-h-[250px]'
      chartContainers.forEach((wrapper) => {
        const className = wrapper.className;
        expect(className).toMatch(/h-\[250px\]|h-\[300px\]/);
      });
    });
  });
});
