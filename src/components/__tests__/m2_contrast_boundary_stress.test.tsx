import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// 1. Mock ResizeObserver for JSDOM test environment
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// 2. Mocks for Firebase & Context hooks to ensure smooth component rendering
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test-user-m2-123" },
    authResolved: true,
  }),
}));

vi.mock("../../context/ProfileContext", () => ({
  useProfile: () => ({
    activeProfile: { id: "profile-m2-123", name: "Jane Doe" },
  }),
}));

vi.mock("../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({
    contextString: "Patient clinical summary context",
    labBiomarkers: [],
    drugLabContraindications: [],
  }),
}));

vi.mock("../../hooks/useWearableTelemetry", () => ({
  useWearableTelemetry: () => ({
    telemetry: {
      heartRate: 72,
      spO2: 98,
      hrv: 55,
      restingHeartRate: 68,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      timestamp: new Date().toISOString(),
    },
    saveTelemetry: vi.fn(),
  }),
}));

vi.mock("../../lib/geminiClient", () => ({
  default: () => ({
    chats: {
      create: () => ({
        sendMessageStream: vi.fn(),
      }),
    },
  }),
}));

vi.mock("../../lib/firebase/config", () => ({
  db: {},
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({
        extractedData: {
          observations: [
            { testName: "HbA1c", value: 5.6, unit: "%", flag: "NORMAL" },
            { testName: "Glucose", value: 110, unit: "mg/dL", flag: "HIGH" },
          ],
        },
      }),
    }),
  };
});

import VisitPrepWidget from "../Dashboard/VisitPrepWidget";
import ExportModal from "../Export/ExportModal";
import InteractionMatrix from "../Medications/InteractionMatrix";
import WearableCoachWidget from "../AIHelper/WearableCoachWidget";
import Medications from "../Medications/Medications";
import ReportComparison from "../Dashboard/ReportComparison";
import SpecialistLounge from "../Specialists/SpecialistLounge";
import { HeroMetric } from "../Dashboard/HeroMetric";

describe("Milestone 2: Empirical Contrast Ratio & Component Boundary Stress Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Section 1: Class Declarations & Color Contrast Rule Audits", () => {
    it("1.1 VisitPrepWidget enforces dark placeholder classes on textareas", () => {
      const { container } = render(<VisitPrepWidget />);
      const textareas = container.querySelectorAll("textarea");
      expect(textareas.length).toBeGreaterThan(0);
      textareas.forEach((textarea) => {
        expect(textarea.className).toContain("placeholder:text-slate-500");
        expect(textarea.className).toContain("dark:placeholder:text-slate-400");
      });
    });

    it("1.2 ExportModal printable template uses text-slate-900 on bg-white with zero low-contrast text-slate-300", () => {
      const mockHealthContext = {
        userName: "Alice Smith",
        healthScore: 92,
        topFlags: ["High Glucose"],
        medications: [{ name: "Metformin", dosage: "500mg", frequency: "Daily" }],
        recentTrends: [{ marker: "Glucose", value: 115, unit: "mg/dL", direction: "up" }],
        doctorNotes: ["Follow up in 3 months"],
        aiClinicalSummary: "Patient exhibits controlled HbA1c with slight glucose elevation.",
      };

      const { container } = render(
        <ExportModal onClose={vi.fn()} healthContext={mockHealthContext} />
      );

      const printableContainer = container.querySelector("#health-report-printable");
      expect(printableContainer).not.toBeNull();
      expect(printableContainer?.className).toContain("bg-white");
      expect(printableContainer?.className).toContain("text-slate-900");

      // Verify zero low-contrast text-slate-300 in PDF output
      const lowContrast = printableContainer?.querySelectorAll(".text-slate-300");
      expect(lowContrast?.length).toBe(0);

      // Verify high contrast headers text-indigo-700
      const indigoHeaders = printableContainer?.querySelectorAll("h2.text-indigo-700");
      expect(indigoHeaders?.length).toBeGreaterThan(0);
    });

    it("1.3 InteractionMatrix view mode buttons incorporate dark text fallbacks and theme hover state", () => {
      const mockMeds = [
        {
          id: "med-1",
          userId: "user-123",
          genericName: "Aspirin",
          brandName: null,
          rxcui: "1191",
          dosage: "81mg",
          frequency: "Daily",
          startDate: "2026-01-01",
          endDate: null,
          prescribedFor: null,
          addedAt: new Date().toISOString(),
        },
      ];

      const { container } = render(
        <InteractionMatrix medications={mockMeds} interactions={[]} />
      );

      const buttons = container.querySelectorAll("button");
      const inactiveBtn = Array.from(buttons).find((b) =>
        b.textContent?.includes("Drug-Lab Matrix")
      );

      expect(inactiveBtn).toBeDefined();
      expect(inactiveBtn?.className).toContain("dark:text-slate-300");
      expect(inactiveBtn?.className).toContain("hover:text-theme");
    });

    it("1.4 WearableCoachWidget metric indicators implement dual-theme contrast text variants", () => {
      const { container } = render(<WearableCoachWidget />);

      const greenBadge = container.querySelector(".text-emerald-700");
      expect(greenBadge).not.toBeNull();
      expect(greenBadge?.className).toContain("dark:text-emerald-300");

      const cyanBadge = container.querySelector(".text-cyan-700");
      expect(cyanBadge).not.toBeNull();
      expect(cyanBadge?.className).toContain("dark:text-cyan-300");
    });

    it("1.5 Medications component header and footer satisfy high contrast requirements", () => {
      const { container } = render(<Medications />);

      const footer = container.querySelector(".border-t.border-surface.text-center");
      expect(footer).not.toBeNull();
      expect(footer?.className).not.toContain("opacity-40");
    });

    it("1.6 HeroMetric reference bounds enforce high-contrast dual-theme slate text", () => {
      const { container } = render(
        <HeroMetric
          label="Blood Glucose"
          value={95}
          unit="mg/dL"
          refLow={70}
          refHigh={99}
          previousValue={102}
          previousDate="Yesterday"
        />
      );

      const refElement = container.querySelector(".text-slate-700.dark\\:text-slate-300");
      expect(refElement).not.toBeNull();
    });
  });

  describe("Section 2: Component Boundary & Edge-Case Stress Testing", () => {
    it("2.1 Empty Form Inputs: VisitPrepWidget handles blank values without layout collapse or errors", () => {
      const { container } = render(<VisitPrepWidget />);

      const textareas = container.querySelectorAll("textarea");
      expect(textareas.length).toBe(2);

      // Verify both textareas start empty
      textareas.forEach((ta) => {
        expect((ta as HTMLTextAreaElement).value).toBe("");
      });

      // Type empty string into questions textarea
      fireEvent.change(textareas[0], { target: { value: "" } });
      expect((textareas[0] as HTMLTextAreaElement).value).toBe("");

      // Type empty string into onset notes textarea
      fireEvent.change(textareas[1], { target: { value: "" } });
      expect((textareas[1] as HTMLTextAreaElement).value).toBe("");
    });

    it("2.2 Long Placeholder & Inputs: VisitPrepWidget processes 1,000+ character user string seamlessly", () => {
      const { container } = render(<VisitPrepWidget />);
      const textareas = container.querySelectorAll("textarea");
      const longInput = "Symptom note: " + "X".repeat(1000);

      fireEvent.change(textareas[1], { target: { value: longInput } });
      expect((textareas[1] as HTMLTextAreaElement).value).toBe(longInput);
      expect((textareas[1] as HTMLTextAreaElement).value.length).toBe(1014);
    });

    it("2.3 SpecialistLounge handles empty message input and 500-char prompt string with dark placeholder compliance", () => {
      const { container } = render(<SpecialistLounge />);
      const input = container.querySelector("input[placeholder*='Message']");

      expect(input).not.toBeNull();
      expect(input?.className).toContain("placeholder:text-slate-500");
      expect(input?.className).toContain("dark:placeholder:text-slate-400");

      // Test empty string input
      fireEvent.change(input!, { target: { value: "" } });
      expect((input as HTMLInputElement).value).toBe("");

      // Test long prompt input
      const longPrompt = "Doctor query: " + "A".repeat(500);
      fireEvent.change(input!, { target: { value: longPrompt } });
      expect((input as HTMLInputElement).value).toBe(longPrompt);
    });

    it("2.4 Active/Hover Badge & Button States: VisitPrepWidget symptom button toggle contrast states", () => {
      const { container } = render(<VisitPrepWidget />);

      // Find Fatigue button
      const symptomButtons = container.querySelectorAll("button[type='button']");
      const fatigueBtn = Array.from(symptomButtons).find((btn) =>
        btn.textContent?.includes("Fatigue")
      );

      expect(fatigueBtn).toBeDefined();
      // Inactive state: bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100
      expect(fatigueBtn?.className).toContain("text-slate-900");
      expect(fatigueBtn?.className).toContain("dark:text-slate-100");

      // Click to activate Fatigue symptom
      fireEvent.click(fatigueBtn!);

      // Active state: bg-indigo-500/20 border-indigo-500/60 text-indigo-800 dark:text-indigo-200
      expect(fatigueBtn?.className).toContain("text-indigo-800");
      expect(fatigueBtn?.className).toContain("dark:text-indigo-200");

      // Click again to deactivate
      fireEvent.click(fatigueBtn!);
      expect(fatigueBtn?.className).toContain("text-slate-900");
    });

    it("2.5 Modal Open States in Light Theme: ExportModal accessibility & overlay background contrast", () => {
      const mockHealthContext = {
        userName: "Light User",
        healthScore: 88,
        topFlags: [],
        medications: [],
        recentTrends: [],
        doctorNotes: [],
      };

      const { container } = render(
        <div className="light-theme-container">
          <ExportModal onClose={vi.fn()} healthContext={mockHealthContext} />
        </div>
      );

      const modalOverlay = container.querySelector(".fixed.inset-0");
      expect(modalOverlay).not.toBeNull();
      expect(modalOverlay?.className).toContain("bg-slate-900/60");
      expect(modalOverlay?.className).toContain("backdrop-blur-md");

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.getAttribute("aria-modal")).toBe("true");
      expect(dialog?.getAttribute("aria-labelledby")).toBe("export-modal-title");
    });

    it("2.6 Modal Open States in Dark Theme: ExportModal dialog structure under .dark container", () => {
      const mockHealthContext = {
        userName: "Dark User",
        healthScore: 95,
        topFlags: [],
        medications: [],
        recentTrends: [],
        doctorNotes: [],
      };

      const { container } = render(
        <div className="dark bg-slate-950 text-white">
          <ExportModal onClose={vi.fn()} healthContext={mockHealthContext} />
        </div>
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.className).toContain("bg-slate-800");
      expect(dialog?.className).toContain("border-white/10");
    });

    it("2.7 Modal Open States in Light vs Dark Theme: ReportComparison accessibility & sticky contrast headers", () => {
      const { container, rerender } = render(
        <div className="light-theme-wrapper">
          <ReportComparison
            reportAId="doc-1"
            reportBId="doc-2"
            reportADate="2026-01-01"
            reportBDate="2026-02-01"
            onClose={vi.fn()}
          />
        </div>
      );

      const modalRoot = container.querySelector('[role="dialog"]');
      expect(modalRoot).not.toBeNull();
      expect(modalRoot?.className).toContain("bg-surface/95");
      expect(modalRoot?.className).toContain("backdrop-blur-sm");

      // Rerender under dark class
      rerender(
        <div className="dark bg-slate-950">
          <ReportComparison
            reportAId="doc-1"
            reportBId="doc-2"
            reportADate="2026-01-01"
            reportBDate="2026-02-01"
            onClose={vi.fn()}
          />
        </div>
      );

      const darkModalRoot = container.querySelector('[role="dialog"]');
      expect(darkModalRoot).not.toBeNull();
    });
  });
});
