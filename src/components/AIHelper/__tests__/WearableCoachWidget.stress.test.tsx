import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import WearableCoachWidget from "../WearableCoachWidget";
import { WearableBiometrics } from "../../../types/wearables";
import { LabResult } from "../../../types/medical";

// Global window.alert mock for interactive button testing
if (typeof window !== "undefined") {
  window.alert = vi.fn();
}

describe("WearableCoachWidget Empirical Stress & Layout Verification Suite", () => {
  const normalTelemetry: WearableBiometrics = {
    id: "widget-test-1",
    userId: "test-user",
    timestamp: new Date().toISOString(),
    heartRate: 68,
    rhr: 62,
    hrv: 60,
    spo2: 98,
    steps: 9200,
    sleep: {
      totalMinutes: 490,
      deepMinutes: 115,
      remMinutes: 120,
      lightMinutes: 255,
      sleepScore: 88,
    },
    connectionStatus: "connected",
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("1. should render normal telemetry widget without safety alert banners", () => {
    render(<WearableCoachWidget telemetry={normalTelemetry} />);

    expect(screen.getByText(/AI Health Coach Fusion & Biometrics/i)).not.toBeNull();
    expect(screen.getByText(/Resting HR/i)).not.toBeNull();
    expect(screen.getByText(/Blood Oxygen \(SpO2\)/i)).not.toBeNull();

    // No safety alerts should be displayed
    expect(screen.queryByText(/Safety Alert/i)).toBeNull();
  });

  it("2. should render urgent Tachycardia safety alert banner when RHR exceeds 100 bpm", () => {
    const tachycardicTelemetry: WearableBiometrics = {
      ...normalTelemetry,
      rhr: 108,
      heartRate: 115,
    };

    render(<WearableCoachWidget telemetry={tachycardicTelemetry} />);

    expect(screen.getByText(/URGENT Safety Alert/i)).not.toBeNull();
    expect(screen.getByText(/Resting heart rate of 108 bpm exceeds safe physiological threshold/i)).not.toBeNull();
    expect(screen.getByText(/\[Source: Wearable HR\/Steps\]/i)).not.toBeNull();
  });

  it("3. should render urgent Hypoxia safety alert banner when SpO2 drops below 92%", () => {
    const hypoxicTelemetry: WearableBiometrics = {
      ...normalTelemetry,
      spo2: 89,
    };

    render(<WearableCoachWidget telemetry={hypoxicTelemetry} />);

    expect(screen.getByText(/URGENT Safety Alert/i)).not.toBeNull();
    expect(screen.getByText(/Blood oxygenation level of 89% is below sub-normal threshold/i)).not.toBeNull();
  });

  it("4. should dismiss triage alert banner when Dismiss button is clicked", () => {
    const tachycardicTelemetry: WearableBiometrics = {
      ...normalTelemetry,
      rhr: 112,
    };

    render(<WearableCoachWidget telemetry={tachycardicTelemetry} />);

    expect(screen.getByText(/URGENT Safety Alert/i)).not.toBeNull();

    const dismissButton = screen.getByRole("button", { name: /Dismiss/i });
    fireEvent.click(dismissButton);

    // Alert banner should now be dismissed
    expect(screen.queryByText(/URGENT Safety Alert/i)).toBeNull();
  });

  it("5. should support interactive scenario toggle buttons (Tachycardia / Hypoxia / Normal)", () => {
    render(<WearableCoachWidget telemetry={normalTelemetry} />);

    expect(screen.queryByText(/URGENT Safety Alert/i)).toBeNull();

    // Click Tachycardia Demo
    const tachyBtn = screen.getByRole("button", { name: /Tachycardia Demo/i });
    fireEvent.click(tachyBtn);

    expect(screen.getByText(/URGENT Safety Alert/i)).not.toBeNull();
    expect(screen.getAllByText(/108 bpm/i).length).toBeGreaterThan(0);

    // Click Hypoxia Demo
    const hypoxiaBtn = screen.getByRole("button", { name: /Hypoxia Demo/i });
    fireEvent.click(hypoxiaBtn);

    expect(screen.getByText(/URGENT Safety Alert/i)).not.toBeNull();
    expect(screen.getAllByText(/89%/i).length).toBeGreaterThan(0);

    // Click Normal
    const normalBtn = screen.getByRole("button", { name: /^Normal$/i });
    fireEvent.click(normalBtn);

    expect(screen.queryByText(/URGENT Safety Alert/i)).toBeNull();
  });

  it("6. should enforce AGENTS.md Rule 3 strict h-[300px] min-h-[300px] pixel boundary envelope for Recharts container", () => {
    const { container } = render(<WearableCoachWidget telemetry={normalTelemetry} />);

    const rechartsEnvelope = container.querySelector(".h-\\[300px\\]");
    expect(rechartsEnvelope).not.toBeNull();
    expect(rechartsEnvelope?.className).toContain("min-h-[300px]");
    expect(rechartsEnvelope?.className).toContain("w-full");
  });

  it("7. should render lab recovery strain overrides & imaging exercise restrictions when correlated data is present", () => {
    const labResults: LabResult[] = [
      { id: "l1", userId: "test-user-1", docId: "doc-1", markerName: "hs-CRP", value: 4.5, numeric_value: 4.5, unit: "mg/L", date: "2026-08-01", status: "high" },
    ];
    const imagingFindings: string[] = [
      "Lumbar Spine MRI: L4-L5 herniated disc",
    ];

    render(
      <WearableCoachWidget
        telemetry={normalTelemetry}
        labResults={labResults}
        imagingFindings={imagingFindings}
      />
    );

    expect(screen.getByText(/Strain Reduction Overrides/i)).not.toBeNull();
    expect(screen.getByText(/Elevated systemic inflammation detected/i)).not.toBeNull();

    expect(screen.getByText(/Diagnostic Imaging Exercise Restrictions/i)).not.toBeNull();
    expect(screen.getByText(/Lumbar Spine \/ Intervertebral Discs/i)).not.toBeNull();
    expect(screen.getByText(/high-impact plyometrics, running, heavy squatting/i)).not.toBeNull();
  });

  it("8. High-Frequency Prop Update Stress Test: re-render widget with 50 rapid prop updates without DOM thrashing or errors", () => {
    const { rerender } = render(<WearableCoachWidget telemetry={normalTelemetry} />);

    const startTime = performance.now();

    for (let i = 0; i < 50; i++) {
      const updatedTelemetry: WearableBiometrics = {
        ...normalTelemetry,
        rhr: 55 + (i % 60),
        spo2: 90 + (i % 10),
        steps: 1000 + i * 50,
      };

      rerender(<WearableCoachWidget telemetry={updatedTelemetry} />);
    }

    const duration = performance.now() - startTime;
    console.log(`[WIDGET STRESS TEST RESULT] 50 Rapid Re-renders completed in ${duration.toFixed(2)} ms`);
    expect(duration).toBeLessThan(10000);
  });
});
