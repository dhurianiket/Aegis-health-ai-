/**
 * Trend analysis utilities for Aegis Health AI.
 */

import { LabObservation } from "../types/health";

/**
 * CLINICAL_STABILITY_THRESHOLDS - Per-biomarker thresholds for determining stability.
 * v1.5: Using relative change thresholds.
 */
export const CLINICAL_STABILITY_THRESHOLDS: Record<string, number> = {
  hba1c: 5,
  glucose: 8,
  "serum creatinine": 10,
  egfr: 10,
  bun: 12,
  alt: 15,
  ast: 15,
  "alkaline phosphatase": 15,
  "total bilirubin": 15,
  albumin: 8,
  "total cholesterol": 8,
  ldl: 10,
  hdl: 8,
  triglycerides: 12,
  haemoglobin: 8,
  "platelet count": 15,
  wbc: 15,
  tsh: 20,
  t3: 12,
  t4: 12,
  "free t4": 12,
  sodium: 3,
  potassium: 5,
  calcium: 5,
  __default: 10,
};

export interface TrendSummary {
  testName: string;
  unit: string | null;
  firstValue: number;
  lastValue: number;
  firstDate: string;
  lastDate: string;
  delta: number;
  percentChange: number;
  direction: "increasing" | "decreasing" | "stable";
  currentFlag: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | null;
  durationMonths: number;
  dataPointCount: number;
}

/**
 * Computes trend for a specific biomarker.
 */
export function computeTrend(
  observations: LabObservation[],
  testName: string,
): TrendSummary | null {
  // Guard against missing collection dates (Issue 3)
  const validObs = observations
    .filter(
      (obs) =>
        obs.testName === testName &&
        obs.collectedAt != null &&
        obs.valueCanonical != null,
    )
    // ⚡ Bolt: Performance optimization
    // Applied Schwartzian transform to prevent O(N log N) redundant date parsing allocations.
    .map((obs) => ({
      obs,
      time: new Date(obs.collectedAt).getTime(),
    }))
    .sort((a, b) => a.time - b.time)
    .map(({ obs }) => obs);

  if (validObs.length < 2) return null;

  const first = validObs[0];
  const last = validObs[validObs.length - 1];

  const firstValue = first.valueCanonical!;
  const lastValue = last.valueCanonical!;
  const delta = lastValue - firstValue;
  const percentChange = firstValue !== 0 ? (delta / firstValue) * 100 : 0;

  // Use clinical thresholds if available, otherwise default
  const normalizedTestName = testName.toLowerCase();
  const threshold = CLINICAL_STABILITY_THRESHOLDS[normalizedTestName] ?? CLINICAL_STABILITY_THRESHOLDS.__default;

  let direction: "increasing" | "decreasing" | "stable" = "stable";
  if (Math.abs(percentChange) >= threshold) {
    direction = delta > 0 ? "increasing" : "decreasing";
  }

  const firstDateStr = new Date(first.collectedAt).toISOString().split("T")[0];
  const lastDateStr = new Date(last.collectedAt).toISOString().split("T")[0];
  
  const d1 = new Date(first.collectedAt);
  const d2 = new Date(last.collectedAt);
  const durationMonths = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());

  return {
    testName,
    firstValue,
    lastValue,
    firstDate: firstDateStr,
    lastDate: lastDateStr,
    delta,
    percentChange,
    direction,
    dataPointCount: validObs.length,
    currentFlag: last.flag,
    unit: last.unitCanonical || null,
    durationMonths,
  };
}

/**
 * Groups observations by testName and computes trends for each.
 */
export function computeAllTrends(
  observations: LabObservation[],
): Record<string, TrendSummary> {
  const groups: Record<string, LabObservation[]> = {};

  observations.forEach((obs) => {
    if (!groups[obs.testName]) groups[obs.testName] = [];
    groups[obs.testName].push(obs);
  });

  const trends: Record<string, TrendSummary> = {};

  Object.keys(groups).forEach((testName) => {
    const trend = computeTrend(groups[testName], testName);
    if (trend) {
      trends[testName] = trend;
    }
  });

  return trends;
}

/**
 * Formats trends for inclusion in AI prompts.
 */
export function formatTrendForPrompt(
  trends: Record<string, TrendSummary>,
): string {
  const severityMap: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    LOW: 2,
    NORMAL: 3,
  };

  const sortedTrends = Object.values(trends).sort((a, b) => {
    const severityA = a.currentFlag ? (severityMap[a.currentFlag] ?? 4) : 4;
    const severityB = b.currentFlag ? (severityMap[b.currentFlag] ?? 4) : 4;
    return severityA - severityB;
  });

  return sortedTrends
    .map((trend) => {
      const arrow =
        trend.direction === "increasing"
          ? "↑"
          : trend.direction === "decreasing"
            ? "↓"
            : "↔";
      const sign = trend.delta >= 0 ? "+" : "";

      const durationStr =
        trend.durationMonths > 0
          ? `${trend.durationMonths} month${trend.durationMonths === 1 ? "" : "s"}`
          : "less than a month";

      return `${trend.testName}: ${trend.lastValue} ${trend.unit} (${arrow} from ${trend.firstValue} ${trend.unit}, ${sign}${trend.percentChange.toFixed(1)}% over ${durationStr}, currently ${trend.currentFlag || "NORMAL"})`;
    })
    .join("\n");
}
