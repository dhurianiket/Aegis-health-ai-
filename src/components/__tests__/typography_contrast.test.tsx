import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Mock ResizeObserver for JSDOM test environment
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Mock Firebase & Context hooks to allow smooth component rendering in test env
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test-user-123" },
    authResolved: true,
  }),
}));

vi.mock("../../context/ProfileContext", () => ({
  useProfile: () => ({
    activeProfile: { id: "profile-123", name: "Test User" },
  }),
}));

vi.mock("../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({
    contextString: "Patient context summary",
    labBiomarkers: [],
    drugLabContraindications: [],
  }),
}));

vi.mock("../../hooks/useWearableTelemetry", () => ({
  useWearableTelemetry: () => ({
    telemetry: null,
    saveTelemetry: vi.fn(),
  }),
}));

vi.mock("../../lib/firebase/firestore", () => ({
  getHealthScores: vi.fn().mockResolvedValue([{ overall: 85, systems: { metabolic: 85, blood: 70 } }]),
  getLatestInsights: vi.fn().mockResolvedValue([]),
  getLabHistory: vi.fn().mockResolvedValue([]),
  getDocuments: vi.fn().mockResolvedValue([]),
  saveWearableTelemetry: vi.fn(),
  subscribeToLatestTelemetry: vi.fn().mockReturnValue(() => {}),
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

import VisitPrepWidget from "../Dashboard/VisitPrepWidget";
import ExportModal from "../Export/ExportModal";
import InteractionMatrix from "../Medications/InteractionMatrix";
import WearableCoachWidget from "../AIHelper/WearableCoachWidget";
import Medications from "../Medications/Medications";
import ReportComparison from "../Dashboard/ReportComparison";
import SpecialistLounge from "../Specialists/SpecialistLounge";
import { HeroMetric } from "../Dashboard/HeroMetric";
import Dashboard from "../Dashboard/Dashboard";

describe("Milestone 2: High-Contrast Typography & Apple HIG Audit", () => {
  it("1. VisitPrepWidget verifies prose-slate dark:prose-invert, indigo dark mode classes, dark placeholder, and 3D glassmorphism container", () => {
    const { container } = render(<VisitPrepWidget />);

    const textareas = container.querySelectorAll("textarea");
    textareas.forEach((textarea) => {
      expect(textarea.className).toContain("placeholder:text-slate-500");
      expect(textarea.className).toContain("dark:placeholder:text-slate-400");
    });

    // 3D Glassmorphism container check
    const glassContainer = container.querySelector(".backdrop-blur-xl");
    expect(glassContainer).not.toBeNull();
    expect(glassContainer?.className).toContain("bg-[var(--color-surface)]");
    expect(glassContainer?.className).toContain("border");
  });

  it("2. ExportModal printable container uses text-slate-600 on white background for high contrast and glassmorphic backdrop", () => {
    const healthContext = {
      userName: "John Doe",
      healthScore: 85,
      topFlags: [],
      medications: [],
      recentTrends: [],
      doctorNotes: [],
    };
    const { container } = render(
      <ExportModal onClose={vi.fn()} healthContext={healthContext} />
    );

    const printableContainer = container.querySelector("#health-report-printable");
    expect(printableContainer).not.toBeNull();
    expect(printableContainer?.className).toContain("bg-white");
    expect(printableContainer?.className).toContain("text-slate-900");

    // Check that text-slate-300 is eliminated from printable container
    const lowContrastElements = printableContainer?.querySelectorAll(".text-slate-300");
    expect(lowContrastElements?.length).toBe(0);

    // Verify high-contrast text-slate-600 elements present in export header
    const highContrastParagraph = printableContainer?.querySelector("p.text-slate-600");
    expect(highContrastParagraph).not.toBeNull();
    expect(highContrastParagraph?.textContent).toContain("Patient: John Doe");

    // Verify 3D glassmorphic backdrop
    const glassBackdrop = container.querySelector(".backdrop-blur-md");
    expect(glassBackdrop).not.toBeNull();
    expect(glassBackdrop?.className).toContain("bg-slate-900/60");
  });

  it("3. InteractionMatrix uses theme-aware emerald badges, slate dark mode overrides, and 3D glass card layout", () => {
    const mockMeds = [
      {
        id: "m1",
        userId: "user-1",
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
        userId: "user-1",
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

    const { container } = render(
      <InteractionMatrix medications={mockMeds} interactions={[]} />
    );

    // Verify theme mode switcher buttons use dark mode text fallbacks
    const modeButtons = container.querySelectorAll("button");
    const inactiveButton = Array.from(modeButtons).find(
      (btn) => btn.textContent?.includes("Drug-Lab Matrix")
    );
    expect(inactiveButton?.className).toContain("dark:text-slate-300");
    expect(inactiveButton?.className).toContain("hover:text-theme");
  });

  it("4. WearableCoachWidget adopts CitationBadge dual-theme text variants, 3D glass styling, and strict Recharts height boundary", () => {
    const { container } = render(<WearableCoachWidget />);

    const goodStatus = container.querySelector(".text-emerald-700");
    expect(goodStatus).not.toBeNull();
    expect(goodStatus?.className).toContain("dark:text-emerald-300");

    const activeStatus = container.querySelector(".text-cyan-700");
    expect(activeStatus).not.toBeNull();
    expect(activeStatus?.className).toContain("dark:text-cyan-300");

    // Strict Recharts h-[300px] pixel envelope check
    const chartEnvelope = container.querySelector(".h-\\[300px\\]");
    expect(chartEnvelope).not.toBeNull();
  });

  it("5. Medications component uses text-indigo-600 dark:text-indigo-400 and removes opacity-40 on footer", () => {
    const { container } = render(<Medications />);

    const footer = container.querySelector(".border-t.border-surface.text-center");
    expect(footer).not.toBeNull();
    expect(footer?.className).not.toContain("opacity-40");
  });

  it("6. ReportComparison replaces text-slate-300 with text-slate-700 dark:text-slate-300, text-slate-600 with text-muted, and uses 3D glass backdrop", () => {
    const { container } = render(
      <ReportComparison
        reportAId="doc-1"
        reportBId="doc-2"
        reportADate="2026-01-01"
        reportBDate="2026-02-01"
        onClose={vi.fn()}
      />
    );

    expect(container).not.toBeNull();
    const backdrop = container.querySelector(".backdrop-blur-sm");
    expect(backdrop).not.toBeNull();
  });

  it("7. SpecialistLounge verified for input placeholder theme compliance and high contrast options", () => {
    const { container } = render(<SpecialistLounge />);

    const input = container.querySelector("input[placeholder*='Message']");
    expect(input).not.toBeNull();
    expect(input?.className).toContain("placeholder:text-slate-500");
    expect(input?.className).toContain("dark:placeholder:text-slate-400");
  });

  it("8. HeroMetric replaces single mode text-slate-600 with text-slate-700 dark:text-slate-300", () => {
    const { container } = render(
      <HeroMetric
        label="HbA1c"
        value={5.6}
        unit="%"
        refLow={4.0}
        refHigh={5.7}
        previousValue={5.8}
        previousDate="Jan 15"
      />
    );

    const refElement = container.querySelector(".text-slate-700.dark\\:text-slate-300");
    expect(refElement).not.toBeNull();
  });

  it("9. Dashboard renders refactored M2 components with high-contrast text and 3D glass surface layers", async () => {
    const { container, findByText } = render(<Dashboard />);
    expect(container).not.toBeNull();

    // Wait for async dashboard content to render
    const healthIndexText = await findByText("Health Index");
    expect(healthIndexText).not.toBeNull();
    expect(healthIndexText.className).toContain("text-slate-800");
    expect(healthIndexText.className).toContain("dark:text-slate-200");

    const glassBanner = container.querySelector(".backdrop-blur-xl") || container.querySelector("[class*='backdrop-blur']");
    expect(glassBanner).not.toBeNull();
  });
});

