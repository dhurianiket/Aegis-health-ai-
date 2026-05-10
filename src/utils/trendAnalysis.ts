/**
 * Trend analysis utilities for Aegis Health AI.
 */

import { LabObservation } from '../types/health';

/**
 * CLINICAL_STABILITY_THRESHOLDS - Per-biomarker thresholds for determining stability.
 * v1.5: Using relative change thresholds.
 */
const CLINICAL_STABILITY_THRESHOLDS: Record<string, number> = {
  'hba1c': 0.05,        // 5% relative change
  'egfr': 0.10,         // 10% relative change
  'sodium': 0.02,       // 2% relative change
  'potassium': 0.05,    // 5% relative change
  // default: 0.02 (2%)
};

export interface TrendSummary {
  testName: string;
  firstValue: number;
  lastValue: number;
  firstDate: string;
  lastDate: string;
  delta: number;
  percentChange: number;
  direction: "increasing" | "decreasing" | "stable";
  count: number;
  latestFlag: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | null;
  unit: string;
}

/**
 * Computes trend for a specific biomarker.
 */
export function computeTrend(observations: LabObservation[], testName: string): TrendSummary | null {
  // Guard against missing collection dates (Issue 3)
  const validObs = observations
    .filter(obs => obs.testName === testName && obs.collectedAt != null && obs.valueCanonical != null)
    .sort((a, b) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime());

  if (validObs.length < 2) return null;

  const first = validObs[0];
  const last = validObs[validObs.length - 1];

  const firstValue = first.valueCanonical!;
  const lastValue = last.valueCanonical!;
  const delta = lastValue - firstValue;
  const percentChange = firstValue !== 0 ? (delta / firstValue) * 100 : 0;

  // Use clinical thresholds if available, otherwise default to 2% (Issue 2)
  const normalizedTestName = testName.toLowerCase();
  const threshold = (CLINICAL_STABILITY_THRESHOLDS[normalizedTestName] ?? 0.02) * 100;

  let direction: "increasing" | "decreasing" | "stable" = "stable";
  if (Math.abs(percentChange) >= threshold) {
    direction = delta > 0 ? "increasing" : "decreasing";
  }

  return {
    testName,
    firstValue,
    lastValue,
    firstDate: new Date(first.collectedAt).toISOString().split('T')[0],
    lastDate: new Date(last.collectedAt).toISOString().split('T')[0],
    delta,
    percentChange,
    direction,
    count: validObs.length,
    latestFlag: last.flag,
    unit: last.unitCanonical || ""
  };
}

/**
 * Groups observations by testName and computes trends for each.
 */
export function computeAllTrends(observations: LabObservation[]): Record<string, TrendSummary> {
  const groups: Record<string, LabObservation[]> = {};
  
  observations.forEach(obs => {
    if (!groups[obs.testName]) groups[obs.testName] = [];
    groups[obs.testName].push(obs);
  });

  const trends: Record<string, TrendSummary> = {};
  
  Object.keys(groups).forEach(testName => {
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
export function formatTrendForPrompt(trends: Record<string, TrendSummary>): string {
  const severityMap: Record<string, number> = {
    "CRITICAL": 0,
    "HIGH": 1,
    "LOW": 2,
    "NORMAL": 3
  };

  const sortedTrends = Object.values(trends).sort((a, b) => {
    const severityA = a.latestFlag ? (severityMap[a.latestFlag] ?? 4) : 4;
    const severityB = b.latestFlag ? (severityMap[b.latestFlag] ?? 4) : 4;
    return severityA - severityB;
  });

  return sortedTrends.map(trend => {
    const arrow = trend.direction === "increasing" ? "↑" : trend.direction === "decreasing" ? "↓" : "↔";
    const sign = trend.delta >= 0 ? "+" : "";
    
    // Calculate months between dates
    const d1 = new Date(trend.firstDate);
    const d2 = new Date(trend.lastDate);
    const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    const durationStr = months > 0 ? `${months} month${months === 1 ? '' : 's'}` : "less than a month";

    return `${trend.testName}: ${trend.lastValue} ${trend.unit} (${arrow} from ${trend.firstValue} ${trend.unit}, ${sign}${trend.percentChange.toFixed(1)}% over ${durationStr}, currently ${trend.latestFlag || 'NORMAL'})`;
  }).join('\n');
}
