/**
 * biomarkerTrajectoryService.ts — 30-60-90 Day Predictive Biomarker Risk Trajectory Engine
 * Uses Exponential Moving Averages (EMA) and linear regression slope fitting over historical lab timestamps
 * to forecast future biomarker values, clinical drift risk, and mitigation recommendations.
 */

export interface HistoricalPoint {
  date: string; // ISO 8601 or YYYY-MM-DD
  value: number;
  label?: string;
}

export type TrajectoryDirection =
  | 'improving'
  | 'stable'
  | 'drifting_up'
  | 'drifting_down'
  | 'critical_shift';

export type TrajectoryRiskLevel = 'optimal' | 'borderline' | 'critical';

export interface ForecastWindow {
  days: 30 | 60 | 90;
  projectedValue: number;
  riskLevel: TrajectoryRiskLevel;
  percentChangeFromBaseline: number;
}

export interface BiomarkerTrajectory {
  biomarkerKey: string;
  displayName: string;
  unit: string;
  currentValue: number;
  baselineValue: number;
  referenceLow?: number;
  referenceHigh?: number;
  direction: TrajectoryDirection;
  slopePerDay: number;
  forecasts: {
    d30: ForecastWindow;
    d60: ForecastWindow;
    d90: ForecastWindow;
  };
  overallRisk: TrajectoryRiskLevel;
  summary: string;
  mitigationActions: string[];
  historicalPoints: HistoricalPoint[];
  projectedPoints: HistoricalPoint[];
}

export interface TrajectoryInput {
  testName: string;
  history: HistoricalPoint[];
  referenceLow?: number;
  referenceHigh?: number;
  unit?: string;
}

/**
 * Calculates exponential moving average (EMA) smoothing factor alpha
 */
function calculateEma(values: number[], alpha: number = 0.4): number {
  if (values.length === 0) return 0;
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i] + (1 - alpha) * ema;
  }
  return Number(ema.toFixed(2));
}

/**
 * Fits linear regression line over timestamp offsets (in days) and values
 */
function fitLinearRegression(points: { dayOffset: number; value: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.value || 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.dayOffset;
    sumY += p.value;
    sumXY += p.dayOffset * p.value;
    sumXX += p.dayOffset * p.dayOffset;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Evaluates risk level based on value relative to reference range
 */
function evaluateRiskLevel(value: number, low?: number, high?: number): TrajectoryRiskLevel {
  if (high !== undefined && value > high * 1.15) return 'critical';
  if (low !== undefined && value < low * 0.85) return 'critical';
  if (high !== undefined && value > high) return 'borderline';
  if (low !== undefined && value < low) return 'borderline';
  return 'optimal';
}

/**
 * Computes 30-60-90 day trajectory forecasting for a single biomarker
 */
export function computeBiomarkerTrajectory(input: TrajectoryInput): BiomarkerTrajectory {
  const { testName, history, referenceLow, referenceHigh, unit = '' } = input;

  if (!history || history.length === 0) {
    const fallbackVal = 0;
    return {
      biomarkerKey: testName.toLowerCase().replace(/\s+/g, '_'),
      displayName: testName,
      unit,
      currentValue: fallbackVal,
      baselineValue: fallbackVal,
      referenceLow,
      referenceHigh,
      direction: 'stable',
      slopePerDay: 0,
      forecasts: {
        d30: { days: 30, projectedValue: fallbackVal, riskLevel: 'optimal', percentChangeFromBaseline: 0 },
        d60: { days: 60, projectedValue: fallbackVal, riskLevel: 'optimal', percentChangeFromBaseline: 0 },
        d90: { days: 90, projectedValue: fallbackVal, riskLevel: 'optimal', percentChangeFromBaseline: 0 },
      },
      overallRisk: 'optimal',
      summary: 'Insufficient historical data points for predictive trajectory.',
      mitigationActions: ['Upload at least 2 historical lab reports to activate AI trend forecasting.'],
      historicalPoints: [],
      projectedPoints: [],
    };
  }

  // Sort history chronologically
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const baselineDate = new Date(sorted[0].date).getTime();

  const pointsWithOffsets = sorted.map((pt) => ({
    dayOffset: Math.max(0, Math.round((new Date(pt.date).getTime() - baselineDate) / (1000 * 60 * 60 * 24))),
    value: pt.value,
    date: pt.date,
  }));

  const lastOffset = pointsWithOffsets[pointsWithOffsets.length - 1].dayOffset;
  const lastVal = sorted[sorted.length - 1].value;
  const baselineVal = sorted[0].value;

  const { slope, intercept } = fitLinearRegression(pointsWithOffsets);

  // Calculate 30d, 60d, 90d projections
  const projectValue = (addDays: number) => {
    const targetDay = lastOffset + addDays;
    const rawProjected = intercept + slope * targetDay;

    // Blend linear slope projection with EMA for trend stability
    const emaVal = calculateEma(sorted.map((s) => s.value));
    const blended = 0.85 * rawProjected + 0.15 * emaVal;
    return Number(Math.max(0, blended).toFixed(2));
  };

  const val30 = projectValue(30);
  const val60 = projectValue(60);
  const val90 = projectValue(90);

  const calcPctChange = (proj: number) => {
    if (lastVal === 0) return 0;
    return Number((((proj - lastVal) / lastVal) * 100).toFixed(1));
  };

  const risk30 = evaluateRiskLevel(val30, referenceLow, referenceHigh);
  const risk60 = evaluateRiskLevel(val60, referenceLow, referenceHigh);
  const risk90 = evaluateRiskLevel(val90, referenceLow, referenceHigh);

  // Direction assessment
  let direction: TrajectoryDirection = 'stable';
  if (Math.abs(slope) < 0.005) {
    direction = 'stable';
  } else if (slope > 0) {
    direction = risk90 === 'critical' ? 'critical_shift' : 'drifting_up';
  } else {
    direction = risk90 === 'critical' ? 'critical_shift' : 'drifting_down';
  }

  // Generate Projected Points for Recharts
  const lastDateObj = new Date(sorted[sorted.length - 1].date);

  const addDaysToDate = (base: Date, days: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const projectedPoints: HistoricalPoint[] = [
    { date: sorted[sorted.length - 1].date, value: lastVal, label: 'Current' },
    { date: addDaysToDate(lastDateObj, 30), value: val30, label: '+30d Forecast' },
    { date: addDaysToDate(lastDateObj, 60), value: val60, label: '+60d Forecast' },
    { date: addDaysToDate(lastDateObj, 90), value: val90, label: '+90d Forecast' },
  ];

  // Mitigations
  const mitigations: string[] = [];
  if (risk90 === 'critical' || risk60 === 'critical') {
    mitigations.push(`Urgent: Projected 90-day trajectory (${val90} ${unit}) exceeds critical threshold. Schedule physician consultation.`);
    mitigations.push(`Review active medications and lifestyle interventions with your primary care provider.`);
  } else if (risk90 === 'borderline' || risk60 === 'borderline') {
    mitigations.push(`Borderline trend detected (${val90} ${unit} projected). Implement dietary modifications and 15-min post-meal activity.`);
    mitigations.push(`Re-check lab panel in 60 days to confirm slope stabilization.`);
  } else {
    mitigations.push(`Biomarker trajectory is stable and within optimal physiological boundaries.`);
    mitigations.push(`Maintain regular physical activity and balanced nutritional regimen.`);
  }

  return {
    biomarkerKey: testName.toLowerCase().replace(/\s+/g, '_'),
    displayName: testName,
    unit,
    currentValue: lastVal,
    baselineValue: baselineVal,
    referenceLow,
    referenceHigh,
    direction,
    slopePerDay: Number(slope.toFixed(4)),
    forecasts: {
      d30: { days: 30, projectedValue: val30, riskLevel: risk30, percentChangeFromBaseline: calcPctChange(val30) },
      d60: { days: 60, projectedValue: val60, riskLevel: risk60, percentChangeFromBaseline: calcPctChange(val60) },
      d90: { days: 90, projectedValue: val90, riskLevel: risk90, percentChangeFromBaseline: calcPctChange(val90) },
    },
    overallRisk: risk90 === 'critical' || risk60 === 'critical' ? 'critical' : risk90 === 'borderline' ? 'borderline' : 'optimal',
    summary: `Projected ${testName} value in 90 days is ${val90} ${unit} (${calcPctChange(val90)}% change from current baseline).`,
    mitigationActions: mitigations,
    historicalPoints: sorted,
    projectedPoints,
  };
}
