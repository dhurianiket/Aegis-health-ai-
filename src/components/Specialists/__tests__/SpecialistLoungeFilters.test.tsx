import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock ResizeObserver for JSDOM test environment
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

const MOCK_USER = { uid: "test-user-123" };
const MOCK_PROFILE = { id: "profile-123", name: "Test Patient" };

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: MOCK_USER,
    authResolved: true,
  }),
}));

vi.mock("../../../context/ProfileContext", () => ({
  useProfile: () => ({
    activeProfile: MOCK_PROFILE,
  }),
}));

vi.mock("../../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({
    contextString: "Cardiovascular and metabolic context",
    labBiomarkers: [],
    drugLabContraindications: [],
  }),
}));

vi.mock("../../../lib/geminiClient", () => ({
  default: () => ({
    chats: {
      create: () => ({
        sendMessageStream: vi.fn(),
      }),
    },
  }),
}));

vi.mock("../../../lib/firebase/config", () => ({
  db: {},
}));

vi.mock("../../../lib/firebase/firestore", () => ({
  getActiveReferrals: vi.fn().mockResolvedValue([]),
  saveActiveReferral: vi.fn().mockResolvedValue("ref-123"),
  updateReferralStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
    setDoc: vi.fn().mockResolvedValue(undefined),
    serverTimestamp: vi.fn(),
  };
});

import SpecialistLounge, { HighlightMatch } from "../SpecialistLounge";
import { within, act } from "@testing-library/react";

describe("SpecialistLounge Category Filter & Real-Time Highlight Effects", () => {
  it("renders the search input, pill-style category list, and specialist cards", async () => {
    await act(async () => {
      render(<SpecialistLounge />);
    });

    // Search input
    const searchInput = screen.getByPlaceholderText("Search specialists, expertise, symptoms...");
    expect(searchInput).toBeDefined();

    // Category pills container
    const tablist = screen.getByRole("tablist", { name: /Specialist Categories/i });
    expect(tablist).toBeDefined();

    // Verify key category pills exist
    expect(screen.getByRole("tab", { name: "All" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Cardiology" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Endocrinology" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Neurology" })).toBeDefined();

    // Verify specialists initially present in the sidebar list
    const list = screen.getByRole("list");
    expect(within(list).getByText("AI Cardiologist")).toBeDefined();
    expect(within(list).getByText("AI Endocrinologist")).toBeDefined();
  });

  it("filters specialists by category when a category pill is clicked", async () => {
    await act(async () => {
      render(<SpecialistLounge />);
    });
    const list = screen.getByRole("list");

    const cardioPill = screen.getByRole("tab", { name: "Cardiology" });
    await act(async () => {
      fireEvent.click(cardioPill);
    });

    // AI Cardiologist should be visible in the list
    expect(within(list).getByText("AI Cardiologist")).toBeDefined();
    // AI Endocrinologist should be filtered out
    expect(within(list).queryByText("AI Endocrinologist")).toBeNull();

    // Switch to Endocrinology
    const endoPill = screen.getByRole("tab", { name: "Endocrinology" });
    await act(async () => {
      fireEvent.click(endoPill);
    });

    expect(within(list).getByText("AI Endocrinologist")).toBeDefined();
    expect(within(list).queryByText("AI Cardiologist")).toBeNull();

    // Switch back to All
    const allPill = screen.getByRole("tab", { name: "All" });
    await act(async () => {
      fireEvent.click(allPill);
    });

    expect(within(list).getByText("AI Cardiologist")).toBeDefined();
    expect(within(list).getByText("AI Endocrinologist")).toBeDefined();
  });

  it("filters specialists in real-time when typing in search input", async () => {
    await act(async () => {
      render(<SpecialistLounge />);
    });
    const list = screen.getByRole("list");

    const searchInput = screen.getByPlaceholderText("Search specialists, expertise, symptoms...");

    // Search for "Thyroid" which belongs to Endocrinology
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Thyroid" } });
    });

    expect(within(list).getByText("AI Endocrinologist")).toBeDefined();
    expect(within(list).queryByText("AI Cardiologist")).toBeNull();
  });

  it("renders high-contrast real-time text highlight matches using <mark>", async () => {
    await act(async () => {
      render(<SpecialistLounge />);
    });

    const searchInput = screen.getByPlaceholderText("Search specialists, expertise, symptoms...");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Cardio" } });
    });

    // The text 'Cardio' should be wrapped in <mark data-testid="search-highlight">
    const highlights = screen.getAllByTestId("search-highlight");
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0].textContent?.toLowerCase()).toBe("cardio");
  });

  it("clears search query and highlights when clear button is clicked", async () => {
    await act(async () => {
      render(<SpecialistLounge />);
    });
    const list = screen.getByRole("list");

    const searchInput = screen.getByPlaceholderText("Search specialists, expertise, symptoms...");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "Heart" } });
    });

    const clearButton = screen.getByRole("button", { name: /Clear search/i });
    expect(clearButton).toBeDefined();

    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect((searchInput as HTMLInputElement).value).toBe("");
    expect(within(list).getByText("AI Cardiologist")).toBeDefined();
    expect(within(list).getByText("AI Endocrinologist")).toBeDefined();
    expect(screen.queryAllByTestId("search-highlight").length).toBe(0);
  });

  it("shows empty state when no specialists match, and resets via 'Reset filters'", async () => {
    await act(async () => {
      render(<SpecialistLounge />);
    });
    const list = screen.getByRole("list");

    const searchInput = screen.getByPlaceholderText("Search specialists, expertise, symptoms...");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "QuantumSuperPosition123" } });
    });

    expect(screen.getByText("No specialists match your criteria")).toBeDefined();
    expect(screen.getByText(/QuantumSuperPosition123/)).toBeDefined();

    const resetButton = screen.getByRole("button", { name: /Reset filters/i });
    await act(async () => {
      fireEvent.click(resetButton);
    });

    expect((searchInput as HTMLInputElement).value).toBe("");
    expect(within(list).getByText("AI Cardiologist")).toBeDefined();
    expect(within(list).getByText("AI Endocrinologist")).toBeDefined();
  });

  it("HighlightMatch unit behavior: handles case sensitivity, regex characters, and empty query", () => {
    // Empty query returns plain text
    const { container: c1 } = render(<HighlightMatch text="Cardiology Specialist" query="" />);
    expect(c1.querySelector("mark")).toBeNull();
    expect(c1.textContent).toBe("Cardiology Specialist");

    // Exact match case-insensitive
    const { container: c2 } = render(<HighlightMatch text="Heart Failure & Arrhythmias" query="failure" />);
    const mark2 = c2.querySelector("mark");
    expect(mark2).not.toBeNull();
    expect(mark2?.textContent).toBe("Failure");

    // Special regex characters in query do not throw errors
    const { container: c3 } = render(<HighlightMatch text="Blood Sugar (A1c) [v2.0]" query="(A1c)" />);
    const mark3 = c3.querySelector("mark");
    expect(mark3).not.toBeNull();
    expect(mark3?.textContent).toBe("(A1c)");
  });
});
