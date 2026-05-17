import { CLINICAL_STABILITY_THRESHOLDS } from './trendAnalysis';

export interface ComparisonRow {
  testName: string;
  panel: string | null;
  valueA: number | string | null;
  unitA: string | null;
  valueB: number | string | null;
  unitB: string | null;
  delta: number | null;
  deltaPercent: number | null;
  direction: 'improved' | 'worsened' | 'stable' | 'unchanged' | null;
  flagA: string | null;
  flagB: string | null;
  isNewInB: boolean;
  isMissingInB: boolean;
}

export function compareReports(
  observationsA: any[],
  observationsB: any[],
  dateA: string,
  dateB: string
): {
  rows: ComparisonRow[];
  summary: {
    improved: number;
    worsened: number;
    stable: number;
    newTests: number;
    missingTests: number;
    dateA: string;
    dateB: string;
  };
} {
  const mapA = new Map<string, any>();
  const mapB = new Map<string, any>();

  // Ensure observations are array to prevent crashes
  const obsA = Array.isArray(observationsA) ? observationsA : [];
  const obsB = Array.isArray(observationsB) ? observationsB : [];

  obsA.forEach(obs => {
    if (obs && obs.testName) {
      mapA.set(obs.testName.toLowerCase().trim(), obs);
    }
  });

  obsB.forEach(obs => {
    if (obs && obs.testName) {
      mapB.set(obs.testName.toLowerCase().trim(), obs);
    }
  });

  const allTestNames = new Set<string>([...mapA.keys(), ...mapB.keys()]);
  const rows: ComparisonRow[] = [];

  let improved = 0;
  let worsened = 0;
  let stable = 0;
  let newTests = 0;
  let missingTests = 0;

  allTestNames.forEach(testNameKey => {
    const obsAData = mapA.get(testNameKey);
    const obsBData = mapB.get(testNameKey);

    const testName = obsBData?.testName || obsAData?.testName || 'Unknown';
    const panel = obsBData?.panel || obsAData?.panel || null;

    const valueA = obsAData?.valueCanonical ?? obsAData?.value ?? null;
    const valueB = obsBData?.valueCanonical ?? obsBData?.value ?? null;

    const unitA = obsAData?.unitCanonical ?? obsAData?.unit ?? null;
    const unitB = obsBData?.unitCanonical ?? obsBData?.unit ?? null;

    const flagA = obsAData?.flag || null;
    const flagB = obsBData?.flag || null;

    const isMissingInB = !!obsAData && !obsBData;
    const isNewInB = !obsAData && !!obsBData;

    let delta: number | null = null;
    let deltaPercent: number | null = null;
    let direction: 'improved' | 'worsened' | 'stable' | 'unchanged' | null = null;

    if (isNewInB) {
      newTests++;
    } else if (isMissingInB) {
      missingTests++;
    }

    if (!isNewInB && !isMissingInB) {
      let numA = NaN;
      let numB = NaN;
      
      if (typeof valueA === 'number') numA = valueA;
      else if (typeof valueA === 'string' && valueA.trim() !== '') numA = parseFloat(valueA);
      
      if (typeof valueB === 'number') numB = valueB;
      else if (typeof valueB === 'string' && valueB.trim() !== '') numB = parseFloat(valueB);

      if (!isNaN(numA) && !isNaN(numB)) {
        delta = numB - numA;
        if (numA !== 0) {
          deltaPercent = (delta / Math.abs(numA)) * 100;
        } else {
          deltaPercent = delta > 0 ? 100 : (delta < 0 ? -100 : 0);
        }
      }

      // Determine 'direction' safely
      const alertFlags = ['HIGH', 'LOW', 'CRITICAL', 'ABNORMAL'];
      const isFlagANormal = !flagA || flagA === 'NORMAL';
      const isFlagBNormal = !flagB || flagB === 'NORMAL';

      const flagWorsened = isFlagANormal && !isFlagBNormal && alertFlags.includes(flagB?.toUpperCase() || '');
      const flagImproved = !isFlagANormal && isFlagBNormal && alertFlags.includes(flagA?.toUpperCase() || '');

      if (flagWorsened) {
        direction = 'worsened';
      } else if (flagImproved) {
        direction = 'improved';
      } else if (deltaPercent !== null) {
        const threshold = CLINICAL_STABILITY_THRESHOLDS[testNameKey] ?? CLINICAL_STABILITY_THRESHOLDS.__default;
        if (Math.abs(deltaPercent) < threshold) {
          direction = 'stable';
        } else {
          // Additional logic for numeric values if no clear flag crossover
          if (flagB === 'HIGH' || flagB === 'CRITICAL') {
            direction = delta! > 0 ? 'worsened' : 'improved';
          } else if (flagB === 'LOW') {
            direction = delta! < 0 ? 'worsened' : 'improved';
          } else {
            direction = 'unchanged'; 
          }
        }
      } else {
        direction = valueA === valueB ? 'unchanged' : null;
      }

      if (direction === 'improved') improved++;
      if (direction === 'worsened') worsened++;
      if (direction === 'stable') stable++;
    }

    rows.push({
      testName,
      panel,
      valueA,
      unitA,
      valueB,
      unitB,
      delta,
      deltaPercent,
      direction,
      flagA,
      flagB,
      isNewInB,
      isMissingInB
    });
  });

  return {
    rows,
    summary: {
      improved,
      worsened,
      stable,
      newTests,
      missingTests,
      dateA,
      dateB
    }
  };
}
