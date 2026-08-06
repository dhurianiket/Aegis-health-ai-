import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderCitationLink } from "../src/components/Common/CitationBadge";
import WearableCoachWidget from "../src/components/AIHelper/WearableCoachWidget";
import Dashboard from "../src/components/Dashboard/Dashboard";
import { buildCoachPromptAugmentation } from "../src/services/ai/coachService";
import { AuthContext } from "../src/context/AuthContext";
import { ProfileContext } from "../src/context/ProfileContext";
import { WearableBiometrics } from "../src/types/wearables";

// Setup global ResizeObserver for jsdom test environment
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock Firestore queries used by Dashboard
vi.mock("../src/lib/firebase/firestore", () => ({
  getHealthScores: vi.fn().mockResolvedValue([
    {
      overall: 88,
      systems: { metabolic: 85, heart: 75, liver: 90, kidney: 85, blood: 70, inflammation: 80 },
    },
  ]),
  getLatestInsights: vi.fn().mockResolvedValue([
    { id: "1", content: "Metabolic markers are stable. Keep up healthy physical activity.", date: "2026-08-01" },
  ]),
  getDocuments: vi.fn().mockResolvedValue([
    {
      id: "doc1",
      date: "2026-08-01",
      extractedData: {
        lab_values: [
          { marker: "Glucose", value: "95", unit: "mg/dL", status: "normal", reference_range: "70-99" },
          { marker: "HbA1c", value: "5.6", unit: "%", status: "normal", reference_range: "< 5.7" },
        ],
      },
    },
  ]),
  getLabHistory: vi.fn().mockResolvedValue([]),
  // Wearable telemetry helpers — return a no-op unsubscribe so useWearableTelemetry doesn't throw
  subscribeToLatestTelemetry: vi.fn((_userId: string, callback: Function) => {
    callback(null, []);
    return () => {};
  }),
  saveWearableTelemetry: vi.fn().mockResolvedValue('mock-id'),
  getWearableHistory: vi.fn().mockResolvedValue([]),
}));

// Mock AlertsContext
vi.mock("../src/context/AlertsContext", () => ({
  useAlerts: vi.fn().mockReturnValue({
    alerts: [],
    dismissedIds: new Set(),
    dismissAlert: vi.fn(),
    unreadCount: 0,
  }),
  AlertsProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock Recharts to render deterministic wrapper elements for DOM verification
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  CartesianGrid: () => <div />,
  Area: () => <div />,
  Scatter: () => <div />,
  ReferenceLine: () => <div />,
  ReferenceArea: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  Radar: () => <div />,
}));

const mockAuthContextValue = {
  user: { uid: "test-user-123", email: "patient@aegishealth.ai" } as any,
  loading: false,
  isSigningIn: false,
  authResolved: true,
  signIn: vi.fn(),
  logOut: vi.fn(),
};

const mockProfileContextValue = {
  activeProfile: { id: "profile-1", name: "Jane Doe" } as any,
  profiles: [{ id: "profile-1", name: "Jane Doe", userId: "test-user-123", fullName: "Jane Doe", chronicConditions: [], allergies: [], createdAt: "2026-01-01" }] as any[],
  isLoading: false,
  setActiveProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
};

describe("Milestone 3 Empirical Stress Test Suite", () => {

  // =========================================================================
  // TASK 1.1: Citation Badge Parsing Robustness
  // =========================================================================
  describe("Task 1.1: Citation Badge Parsing & Attribution Robustness", () => {
    
    it("renders valid Wearable telemetry citations with Cyan theme and Activity icon", () => {
      const element = renderCitationLink({ href: "cite:wearable_hr_steps", children: "Wearable HR/Steps" });
      const { container } = render(element as React.ReactElement);
      const link = container.querySelector("a");
      expect(link).not.toBeNull();
      expect(link?.className).toContain("bg-cyan-50");
      expect(link?.textContent).toContain("Wearable HR/Steps");
    });

    it("renders valid Lab & Diagnostic Imaging citations with Purple theme and FileText icon", () => {
      const labEl = renderCitationLink({ href: "cite:lab_report", children: "Lab Report" });
      const { container: labContainer } = render(labEl as React.ReactElement);
      expect(labContainer.querySelector("a")?.className).toContain("bg-purple-50");

      const imgEl = renderCitationLink({ href: "cite:imaging_finding", children: "Imaging MRI" });
      const { container: imgContainer } = render(imgEl as React.ReactElement);
      expect(imgContainer.querySelector("a")?.className).toContain("bg-purple-50");
    });

    it("renders valid Biometric-Diagnostic Correlation citations with Amber theme and Sparkles icon", () => {
      const el = renderCitationLink({ href: "cite:correlation_matrix", children: "Correlation Matrix" });
      const { container } = render(el as React.ReactElement);
      expect(container.querySelector("a")?.className).toContain("bg-amber-50");
    });

    it("renders verified Clinical Guidelines with organization specific theme colors", () => {
      // ACC/AHA guideline (Rose)
      const accEl = renderCitationLink({ href: "cite:acc_aha_2024", children: "ACC/AHA 2024" });
      const { container: accContainer } = render(accEl as React.ReactElement);
      expect(accContainer.querySelector("a")?.className).toContain("bg-rose-50");

      // ADA guideline (Sky)
      const adaEl = renderCitationLink({ href: "cite:ada_2025", children: "ADA 2025" });
      const { container: adaContainer } = render(adaEl as React.ReactElement);
      expect(adaContainer.querySelector("a")?.className).toContain("bg-sky-50");

      // KDIGO guideline (Emerald)
      const kdigoEl = renderCitationLink({ href: "cite:kdigo_2024", children: "KDIGO 2024" });
      const { container: kdigoContainer } = render(kdigoEl as React.ReactElement);
      expect(kdigoContainer.querySelector("a")?.className).toContain("bg-emerald-50");
    });

    it("handles edge case, corrupt, missing, or malformed citation href strings without throwing", () => {
      const corruptInputs = [
        { href: "cite:", children: "Empty Key" },
        { href: "cite:   ", children: "Whitespace Key" },
        { href: "cite:null", children: null },
        { href: "cite:undefined", children: undefined },
        { href: "cite:[object Object]", children: "Object Key" },
        { href: "cite:<script>alert(1)</script>", children: "XSS Tag Key" },
        { href: "cite:wearable_<script>alert(1)</script>", children: "XSS Wearable" },
        { href: "cite:" + "a".repeat(50000), children: "Ultra Long Key" },
        { href: undefined, children: "No href" },
        { href: "", children: "Blank href" },
        { href: "https://medlineplus.gov/lab-tests", children: "External URL" },
        { href: "javascript:alert(1)", children: "JavaScript Scheme" },
      ];

      corruptInputs.forEach((input) => {
        expect(() => {
          const el = renderCitationLink(input);
          render(el as React.ReactElement);
        }).not.toThrow();
      });
    });

    it("verifies coachService buildCoachPromptAugmentation dual-source attribution & triage rules injection", () => {
      const normalAug = buildCoachPromptAugmentation();
      expect(normalAug).toContain("[Source: Wearable HR/Steps](cite:wearable_hr_steps)");
      expect(normalAug).toContain("[Source: Lab Report](cite:lab_report)");
      expect(normalAug).toContain("[Source: Imaging Finding](cite:imaging_finding)");
      expect(normalAug).toContain("[Source: Wearable + Lab Correlation](cite:correlation_matrix)");

      const tachyBiometrics: WearableBiometrics = {
        id: "w1",
        userId: "test-user-123",
        timestamp: "2026-08-01",
        rhr: 108,
        heartRate: 110,
        spo2: 98,
        steps: 5000,
        hrv: 45,
        connectionStatus: "connected",
        sleep: { totalMinutes: 480, deepMinutes: 100, remMinutes: 100, lightMinutes: 280, sleepScore: 80 }
      };

      // Tachycardia triage rule injection (RHR > 100)
      const tachyAug = buildCoachPromptAugmentation(tachyBiometrics);
      expect(tachyAug).toContain("🚨 URGENT CLINICAL ALERT: Tachycardia detected");

      const hypoBiometrics: WearableBiometrics = {
        id: "w2",
        userId: "test-user-123",
        timestamp: "2026-08-01",
        rhr: 70,
        heartRate: 72,
        spo2: 88,
        steps: 3000,
        hrv: 55,
        connectionStatus: "connected",
        sleep: { totalMinutes: 480, deepMinutes: 100, remMinutes: 100, lightMinutes: 280, sleepScore: 80 }
      };

      // Hypoxia triage rule injection (SpO2 < 92)
      const hypoAug = buildCoachPromptAugmentation(hypoBiometrics);
      expect(hypoAug).toContain("🚨 URGENT CLINICAL ALERT: Hypoxia detected");
    });
  });

  // =========================================================================
  // TASK 1.2: Recharts Boundary Envelopes & Biometric Stress
  // =========================================================================
  describe("Task 1.2: Recharts h-[300px] Boundary Envelope & Resizing / Biometric Stress", () => {

    it("verifies strict h-[300px] min-h-[300px] pixel boundary envelope on WearableCoachWidget Recharts container", () => {
      const { container } = render(<WearableCoachWidget />);
      const sleepChartParent = container.querySelector(".h-\\[300px\\].min-h-\\[300px\\]");
      expect(sleepChartParent).not.toBeNull();
      expect(sleepChartParent?.classList.contains("w-full")).toBe(true);
      expect(sleepChartParent?.classList.contains("relative")).toBe(true);
    });

    it("verifies strict h-[300px] / h-[350px] boundary envelopes on Dashboard chart containers", async () => {
      let container: HTMLElement | null = null;
      await act(async () => {
        const res = render(
          <AuthContext.Provider value={mockAuthContextValue}>
            <ProfileContext.Provider value={mockProfileContextValue}>
              <Dashboard />
            </ProfileContext.Provider>
          </AuthContext.Provider>
        );
        container = res.container as HTMLElement;
      });

      await waitFor(() => {
        expect(document.querySelector("h2")).not.toBeNull();
      });

      const radarContainer = document.querySelector(".h-\\[300px\\].w-full");
      expect(radarContainer).not.toBeNull();

      const trendContainer = document.querySelector(".h-\\[350px\\].min-h-\\[300px\\]");
      expect(trendContainer).not.toBeNull();
    });

    it("survives 100 rapid window resize events without throwing exceptions or visual crashes", () => {
      render(<WearableCoachWidget />);

      expect(() => {
        act(() => {
          for (let i = 0; i < 100; i++) {
            window.dispatchEvent(new Event("resize"));
          }
        });
      }).not.toThrow();
    });

    it("evaluates behavior with zero, negative, and NaN biometric telemetry values", () => {
      const corruptTelemetry: any = {
        heartRate: 0,
        rhr: -50,
        hrv: NaN,
        spo2: -10,
        steps: 1000,
        sleep: {
          totalMinutes: 400,
          deepMinutes: 100,
          remMinutes: 100,
          lightMinutes: 200,
          sleepScore: 70,
        },
      };

      const corruptCorrelation: any = {
        readinessScore: 50,
        metabolicAdaptations: [],
        recoveryOverrides: [],
        activityFilters: [],
        safetyAlerts: [],
      };

      const { container } = render(
        <WearableCoachWidget telemetry={corruptTelemetry} correlation={corruptCorrelation} />
      );
      
      const progressBar = container.querySelector("div[style*='width']");
      expect(progressBar).not.toBeNull();
      expect(progressBar?.getAttribute("style")).not.toContain("NaN");
    });

    it("verifies WearableCoachWidget handles undefined telemetry.steps safely without crashing", () => {
      const corruptTelemetryWithoutSteps: any = {
        heartRate: 70,
        rhr: 65,
        hrv: 50,
        spo2: 98,
        steps: undefined, // Missing steps!
        sleep: { totalMinutes: 480, deepMinutes: 100, remMinutes: 100, lightMinutes: 280, sleepScore: 80 },
      };

      // Safely renders 0 steps fallback without throwing TypeError
      expect(() => {
        render(<WearableCoachWidget telemetry={corruptTelemetryWithoutSteps} />);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // TASK 1.3: UI Component Stability (Dense or Missing Telemetry Data)
  // =========================================================================
  describe("Task 1.3: UI Component Stability under Dense or Missing Telemetry", () => {

    it("handles missing initial telemetry prop with automatic fallback to generateMockTelemetry", () => {
      const { container } = render(<WearableCoachWidget telemetry={undefined} correlation={undefined} />);
      expect(container.textContent).toContain("AI Health Coach Fusion & Biometrics");
    });

    it("renders high-density telemetry payloads (100+ safety alerts, 100+ filters, 100+ overrides) efficiently", () => {
      const denseCorrelation: any = {
        readinessScore: 45,
        safetyAlerts: Array.from({ length: 100 }, (_, i) => ({
          severity: i % 2 === 0 ? "critical" : "warning",
          metric: `Metric_${i}`,
          message: `Dense safety alert message number ${i} for empirical stress testing`,
          source: `Source_${i}`,
        })),
        recoveryOverrides: Array.from({ length: 100 }, (_, i) => ({
          reason: `Recovery override reason ${i}`,
          strainReductionPercent: 15,
          recommendedRhrCeiling: 70,
          evidence: `Evidence statement ${i}`,
        })),
        activityFilters: Array.from({ length: 100 }, (_, i) => ({
          anatomicalTarget: `Anatomical target ${i}`,
          restrictedActivities: ["Squats", "Heavy Lifting"],
          recommendedActivities: ["Swimming", "Walking"],
          evidence: `Filter evidence ${i}`,
        })),
      };

      expect(() => {
        const { container } = render(<WearableCoachWidget correlation={denseCorrelation} />);
        expect(container.textContent).toContain("Dense safety alert message number 0");
        expect(container.textContent).toContain("Dense safety alert message number 99");
      }).not.toThrow();
    });

    it("renders Dashboard with 500+ dense lab items, malformed values, and missing dates without crashing", async () => {
      const denseLabs = Array.from({ length: 500 }, (_, i) => ({
        id: `lab_${i}`,
        date: i % 3 === 0 ? "invalid-date" : "2026-08-01",
        extractedData: {
          lab_values: [
            {
              marker: i % 2 === 0 ? "HbA1c" : `CustomMarker_${i}`,
              value: i % 2 === 0 ? "< 0.1" : `${(i * 1.5).toFixed(1)}`,
              unit: "mg/dL",
              status: i % 5 === 0 ? "critical" : "normal",
              reference_range: i % 4 === 0 ? "< 5.7" : "70 - 100",
            },
          ],
        },
      }));

      const { getDocuments } = await import("../src/lib/firebase/firestore");
      (getDocuments as any).mockResolvedValueOnce(denseLabs);

      await act(async () => {
        render(
          <AuthContext.Provider value={mockAuthContextValue}>
            <ProfileContext.Provider value={mockProfileContextValue}>
              <Dashboard />
            </ProfileContext.Provider>
          </AuthContext.Provider>
        );
      });
    });

    it("verifies interactive scenario buttons and safety triage alert interactions in WearableCoachWidget", () => {
      const onActionClick = vi.fn();
      render(<WearableCoachWidget onActionClick={onActionClick} />);

      // Click Tachycardia demo toggle button
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Tachycardia Demo" }));
      });
      expect(screen.getByText(/exceeds safe physiological threshold/i)).not.toBeNull();

      // Click Hypoxia demo toggle button
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Hypoxia Demo" }));
      });
      expect(screen.getByText(/below sub-normal threshold/i)).not.toBeNull();

      // Return to Normal
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Normal" }));
      });

      // Trigger Tachycardia demo to test safety alert action & dismiss
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Tachycardia Demo" }));
      });
      const actionButton = screen.getByText("Rest Immediately & Contact Care Team");
      
      // Mock window.alert
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      act(() => {
        fireEvent.click(actionButton);
      });
      expect(onActionClick).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();

      // Dismiss alert
      const dismissButton = screen.getByText("Dismiss");
      act(() => {
        fireEvent.click(dismissButton);
      });
      expect(screen.queryByText(/Rest Immediately & Contact Care Team/i)).toBeNull();
      alertSpy.mockRestore();
    });
  });
});
