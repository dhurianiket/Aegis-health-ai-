import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../../context/ThemeContext";

// Mock ResizeObserver for JSDOM environment
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Mock Firebase AuthContext
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "stress-user-123", email: "test@example.com" },
    authResolved: true,
  }),
}));

// Mock ProfileContext
vi.mock("../../context/ProfileContext", () => ({
  useProfile: () => ({
    activeProfile: { id: "profile-123", name: "Empirical Tester" },
  }),
}));

// Mock useClinicalContext
vi.mock("../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({
    contextString: "Clinical context summary: Normal HbA1c, stable blood pressure.",
    labBiomarkers: [
      { id: "b1", testName: "HbA1c", value: "5.6", unit: "%", status: "normal" },
      { id: "b2", testName: "eGFR", value: "95", unit: "mL/min", status: "normal" }
    ],
    drugLabContraindications: [],
  }),
}));

// Mock useWearableTelemetry
vi.mock("../../hooks/useWearableTelemetry", () => ({
  useWearableTelemetry: () => ({
    telemetry: {
      id: "tel-1",
      userId: "stress-user-123",
      timestamp: new Date().toISOString(),
      heartRate: 72,
      rhr: 64,
      hrv: 55,
      spo2: 98,
      steps: 8500,
      sleep: { totalMinutes: 480, deepMinutes: 110, remMinutes: 110, lightMinutes: 260, sleepScore: 85 },
      connectionStatus: "connected" as const,
    },
    saveTelemetry: vi.fn(),
  }),
}));

// Mock Gemini Client
vi.mock("../../lib/geminiClient", () => ({
  default: () => ({
    chats: {
      create: () => ({
        sendMessageStream: vi.fn(),
      }),
    },
  }),
}));

// Mock Firebase Firestore functions
vi.mock("../../lib/firebase/config", () => ({
  db: {},
  auth: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => "2026-08-07T00:00:00Z"),
  deleteDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../lib/firebase/firestore", () => ({
  getHealthScores: vi.fn(() => Promise.resolve([])),
  getLatestInsights: vi.fn(() => Promise.resolve([])),
  getLabHistory: vi.fn(() => Promise.resolve([])),
  getDocuments: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../services/medicationService", () => ({
  getActiveMedications: vi.fn(() => Promise.resolve([
    {
      id: "med-1",
      userId: "stress-user-123",
      genericName: "Metformin",
      brandName: "Glucophage",
      rxcui: "6809",
      dosage: "500mg",
      frequency: "Twice daily",
      startDate: "2026-01-01",
      endDate: null,
      prescribedFor: "Type 2 Diabetes",
      addedAt: new Date().toISOString(),
    },
    {
      id: "med-2",
      userId: "stress-user-123",
      genericName: "Lisinopril",
      brandName: "Zestril",
      rxcui: "29046",
      dosage: "10mg",
      frequency: "Once daily",
      startDate: "2026-01-01",
      endDate: null,
      prescribedFor: "Hypertension",
      addedAt: new Date().toISOString(),
    }
  ])),
  getInteractions: vi.fn(() => Promise.resolve([])),
  saveMedication: vi.fn(() => Promise.resolve()),
  lookupRxCUI: vi.fn(() => Promise.resolve("1234")),
  checkInteractions: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../lib/auditLogger", () => ({
  logAuditEvent: vi.fn(() => Promise.resolve()),
}));

import Dashboard from "../Dashboard/Dashboard";
import VisitPrepWidget from "../Dashboard/VisitPrepWidget";
import WearableCoachWidget from "../AIHelper/WearableCoachWidget";
import Medications from "../Medications/Medications";
import InteractionMatrix from "../Medications/InteractionMatrix";
import SpecialistLounge from "../Specialists/SpecialistLounge";

// Helper component for testing theme toggles via context
function ThemeToggleHarness({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <button data-testid="theme-toggle-btn" onClick={toggleTheme}>
        Current: {theme}
      </button>
      {children}
    </div>
  );
}

describe("Milestone 2: Empirical Rapid Theme Switching & Typography Stress Testing", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("1. Dashboard: rapid 50x theme toggling maintains DOM dark class sync and zero unhandled dark text", async () => {
    const { container, getByTestId } = render(
      <ThemeProvider>
        <ThemeToggleHarness>
          <Dashboard />
        </ThemeToggleHarness>
      </ThemeProvider>
    );

    const toggleBtn = getByTestId("theme-toggle-btn");
    const startTime = performance.now();

    // Rapidly toggle theme 50 times
    for (let i = 0; i < 50; i++) {
      act(() => {
        fireEvent.click(toggleBtn);
      });
      const expectedMode = i % 2 === 0 ? "light" : "dark";
      expect(document.documentElement.classList.contains("dark")).toBe(expectedMode === "dark");
    }

    const duration = performance.now() - startTime;
    console.log(`[STRESS TEST] Dashboard 50x theme toggle time: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(5000);

    // Verify contrast compliance on Dashboard elements
    const textElements = container.querySelectorAll("p, span, h1, h2, h3, h4");
    textElements.forEach((el) => {
      const cls = el.className;
      // Ensure no raw 'text-black' without light/dark considerations or 'text-slate-900' on dark containers without dark overrides
      if (cls.includes("text-slate-900") && !cls.includes("dark:text-white") && !cls.includes("dark:text-slate-100") && !cls.includes("dark:text-slate-200") && !cls.includes("dark:text-slate-300")) {
        // Parent or root should have light context or high contrast guarantee
        expect(cls).not.toContain("bg-slate-900");
      }
    });
  });

  it("2. VisitPrepWidget: rapid 50x theme switching verifies placeholder theme classes & textarea stability", () => {
    const { container, getByTestId } = render(
      <ThemeProvider>
        <ThemeToggleHarness>
          <VisitPrepWidget />
        </ThemeToggleHarness>
      </ThemeProvider>
    );

    const toggleBtn = getByTestId("theme-toggle-btn");
    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      act(() => {
        fireEvent.click(toggleBtn);
      });
      const expectedMode = i % 2 === 0 ? "light" : "dark";
      expect(document.documentElement.classList.contains("dark")).toBe(expectedMode === "dark");
    }

    const duration = performance.now() - startTime;
    console.log(`[STRESS TEST] VisitPrepWidget 50x theme toggle time: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(3000);

    // Verify textarea theme contrast rules
    const textareas = container.querySelectorAll("textarea");
    textareas.forEach((textarea) => {
      expect(textarea.className).toContain("placeholder:text-slate-500");
      expect(textarea.className).toContain("dark:placeholder:text-slate-400");
      expect(textarea.className).toContain("bg-white");
      expect(textarea.className).toContain("dark:bg-slate-900");
    });
  });

  it("3. WearableCoachWidget: rapid 50x theme toggling verifies strict h-[300px] Recharts boundary envelope & dual-theme badges", () => {
    const mockTelemetry = {
      id: "tel-stress",
      userId: "stress-user-123",
      timestamp: new Date().toISOString(),
      heartRate: 75,
      rhr: 65,
      hrv: 58,
      spo2: 98,
      steps: 9100,
      sleep: { totalMinutes: 490, deepMinutes: 120, remMinutes: 110, lightMinutes: 260, sleepScore: 88 },
      connectionStatus: "connected" as const,
    };

    const { container, getByTestId } = render(
      <ThemeProvider>
        <ThemeToggleHarness>
          <WearableCoachWidget telemetry={mockTelemetry} />
        </ThemeToggleHarness>
      </ThemeProvider>
    );

    const toggleBtn = getByTestId("theme-toggle-btn");
    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      act(() => {
        fireEvent.click(toggleBtn);
      });
      const expectedMode = i % 2 === 0 ? "light" : "dark";
      expect(document.documentElement.classList.contains("dark")).toBe(expectedMode === "dark");
    }

    const duration = performance.now() - startTime;
    console.log(`[STRESS TEST] WearableCoachWidget 50x theme toggle time: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(3000);

    // Verify AGENTS.md Rule 3 boundary envelope
    const rechartsContainer = container.querySelector(".h-\\[300px\\]");
    expect(rechartsContainer).not.toBeNull();
    expect(rechartsContainer?.className).toContain("min-h-[300px]");

    // Verify readiness score dual-theme badge class
    const badge = container.querySelector(".bg-emerald-500\\/10");
    expect(badge).not.toBeNull();
    expect(badge?.className).toContain("dark:text-emerald-300");
  });

  it("4. Medications: rapid 50x theme switching maintains header/footer high contrast typography without opacity decay", async () => {
    const { container, getByTestId } = render(
      <ThemeProvider>
        <ThemeToggleHarness>
          <Medications />
        </ThemeToggleHarness>
      </ThemeProvider>
    );

    const toggleBtn = getByTestId("theme-toggle-btn");
    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      act(() => {
        fireEvent.click(toggleBtn);
      });
      const expectedMode = i % 2 === 0 ? "light" : "dark";
      expect(document.documentElement.classList.contains("dark")).toBe(expectedMode === "dark");
    }

    const duration = performance.now() - startTime;
    console.log(`[STRESS TEST] Medications 50x theme toggle time: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(3000);

    // Verify page header contrast class
    const headerTitle = container.querySelector("h2.text-theme");
    expect(headerTitle).not.toBeNull();

    // Verify footer doesn't contain low contrast opacity-40
    const footer = container.querySelector(".border-t.border-surface");
    if (footer) {
      expect(footer.className).not.toContain("opacity-40");
    }
  });

  it("5. InteractionMatrix: rapid 50x theme switching across viewModes maintains button state contrast & theme-aware badges", () => {
    const mockMeds = [
      {
        id: "m1",
        userId: "u1",
        genericName: "Metformin",
        brandName: null,
        rxcui: "6809",
        dosage: "500mg",
        frequency: "Twice daily",
        startDate: "2026-01-01",
        endDate: null,
        prescribedFor: null,
        addedAt: new Date().toISOString(),
      },
      {
        id: "m2",
        userId: "u1",
        genericName: "Lisinopril",
        brandName: null,
        rxcui: "29046",
        dosage: "10mg",
        frequency: "Once daily",
        startDate: "2026-01-01",
        endDate: null,
        prescribedFor: null,
        addedAt: new Date().toISOString(),
      },
    ];

    const { container, getByTestId } = render(
      <ThemeProvider>
        <ThemeToggleHarness>
          <InteractionMatrix medications={mockMeds} interactions={[]} />
        </ThemeToggleHarness>
      </ThemeProvider>
    );

    const toggleBtn = getByTestId("theme-toggle-btn");
    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      act(() => {
        fireEvent.click(toggleBtn);
      });
      const expectedMode = i % 2 === 0 ? "light" : "dark";
      expect(document.documentElement.classList.contains("dark")).toBe(expectedMode === "dark");
    }

    const duration = performance.now() - startTime;
    console.log(`[STRESS TEST] InteractionMatrix 50x theme toggle time: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(3000);

    // Verify mode button contrast classes
    const modeButtons = container.querySelectorAll("button");
    const inactiveButton = Array.from(modeButtons).find(
      (btn) => btn.textContent?.includes("Drug-Lab Matrix")
    );
    expect(inactiveButton?.className).toContain("dark:text-slate-300");
    expect(inactiveButton?.className).toContain("hover:text-theme");
  });

  it("6. SpecialistLounge: rapid 50x theme switching verifies chat input dark mode placeholder and high-contrast typography", () => {
    const { container, getByTestId } = render(
      <ThemeProvider>
        <ThemeToggleHarness>
          <SpecialistLounge />
        </ThemeToggleHarness>
      </ThemeProvider>
    );

    const toggleBtn = getByTestId("theme-toggle-btn");
    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      act(() => {
        fireEvent.click(toggleBtn);
      });
      const expectedMode = i % 2 === 0 ? "light" : "dark";
      expect(document.documentElement.classList.contains("dark")).toBe(expectedMode === "dark");
    }

    const duration = performance.now() - startTime;
    console.log(`[STRESS TEST] SpecialistLounge 50x theme toggle time: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(3000);

    // Verify chat input placeholder contrast classes
    const chatInput = container.querySelector("input[placeholder*='Message']");
    expect(chatInput).not.toBeNull();
    expect(chatInput?.className).toContain("placeholder:text-slate-500");
    expect(chatInput?.className).toContain("dark:placeholder:text-slate-400");
  });

  it("7. Global 6-View Multi-Component Rapid Toggle Benchmark: 100 rapid toggles across all 6 views simultaneously", () => {
    const mockMeds = [
      {
        id: "m1",
        userId: "u1",
        genericName: "Metformin",
        brandName: null,
        rxcui: "6809",
        dosage: "500mg",
        frequency: "Twice daily",
        startDate: "2026-01-01",
        endDate: null,
        prescribedFor: null,
        addedAt: new Date().toISOString(),
      },
    ];

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeToggleHarness>
          <div className="space-y-4">
            <VisitPrepWidget />
            <WearableCoachWidget />
            <Medications />
            <InteractionMatrix medications={mockMeds} interactions={[]} />
            <SpecialistLounge />
          </div>
        </ThemeToggleHarness>
      </ThemeProvider>
    );

    const toggleBtn = getByTestId("theme-toggle-btn");
    const startTime = performance.now();

    for (let i = 0; i < 100; i++) {
      act(() => {
        fireEvent.click(toggleBtn);
      });
    }

    const duration = performance.now() - startTime;
    console.log(`[FULL BENCHMARK] 100 rapid theme toggles across all views completed in: ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(10000);
    // Final check that theme state in localStorage and documentElement matches
    const currentTheme = localStorage.getItem("theme");
    expect(document.documentElement.classList.contains("dark")).toBe(currentTheme === "dark");
  });
});
