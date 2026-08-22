/**
 * milestone1_2_empirical_stress.spec.tsx — Dedicated Empirical Stress & Adversarial Test Suite
 * Milestone 1: HolographicBodyScanner (3D Anatomical Body & Organ Scanner)
 * Milestone 2: VisualLabReportCard (Visual Biomarker Range Bars & Diagnostic Summary Cards)
 * 
 * Tests extreme clinical boundary conditions, inverted biomarker bounds, telemetry failures,
 * rapid hotspot transitions, zero NaN/undefined layout invariants, FHIR exports, and SBAR modals.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import { HolographicBodyScanner } from '../Dashboard/HolographicBodyScanner';
import {
  VisualLabReportCard,
  FourZoneRangeBar,
  BiomarkerSparkline,
  getPlainEnglishSummary,
  PLAIN_ENGLISH_EXPLANATIONS,
  LabReport,
} from '../LabReports/VisualLabReportCard';
import { calculateOrganSystemScores } from '../../services/organHealthService';
import { exportToFhirBundle, validateFhirBundle, downloadFhirJson } from '../../services/fhirService';

describe('Milestone 1 Empirical Stress: HolographicBodyScanner (3D Anatomical Body & Organ Scanner)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('1.1: Handles empty lab observations and missing telemetry with robust default baseline rendering', () => {
    const { container } = render(<HolographicBodyScanner labObservations={[]} telemetry={undefined} />);

    // Container & Header presence
    expect(screen.getByTestId('holographic-body-scanner')).toBeDefined();
    expect(screen.getByText(/Interactive 3D Holographic Anatomical Body Scanner/i)).toBeDefined();
    expect(screen.getByText(/Live Spatial HUD/i)).toBeDefined();

    // Default Telemetry HUD checks
    expect(screen.getByText('72 bpm')).toBeDefined();
    expect(screen.getByText('98%')).toBeDefined();
    expect(screen.getAllByText(/optimal/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('120/80')).toBeDefined();
    expect(screen.getByText(/MAP.*93/i)).toBeDefined();
    expect(screen.getByText('98.4°F')).toBeDefined();
    expect(screen.getByText('(36.9°C)')).toBeDefined();
    expect(screen.getByText('16')).toBeDefined();

    // Ensure no NaN, undefined, or [object Object] artifacts exist in rendered text
    const textContent = container.textContent || '';
    expect(textContent).not.toContain('NaN');
    expect(textContent).not.toContain('undefined');
    expect(textContent).not.toContain('[object Object]');
  });

  it('1.2: Stress tests extreme telemetry values (severe tachycardia HR: 220, critical hypoxemia SpO2: 70%)', () => {
    const extremeTelemetry = {
      id: 'telemetry-extreme-01',
      userId: 'patient-icu-99',
      timestamp: new Date().toISOString(),
      heartRate: 220,
      rhr: 135,
      hrv: 4,
      spo2: 70,
      steps: 45000,
      sleep: { totalMinutes: 120, deepMinutes: 10, remMinutes: 15, lightMinutes: 95, sleepScore: 32 },
      connectionStatus: 'connected' as const,
    };

    const { container } = render(<HolographicBodyScanner telemetry={extremeTelemetry} />);

    // Verify extreme pulse rate and SpO2 render accurately
    expect(screen.getByText('220 bpm')).toBeDefined();
    expect(screen.getByText('70%')).toBeDefined();
    expect(screen.getAllByText(/warning/i).length).toBeGreaterThanOrEqual(1);

    // Check SpO2 circular gauge renders with correct value
    expect(screen.getByText('70%')).toBeDefined();

    // Confirm no numerical calculation overflow or NaN
    expect(container.textContent).not.toContain('NaN');
  });

  it('1.3: Resilience under null, undefined, or zero telemetry values without runtime crashes', () => {
    const zeroTelemetry = {
      id: 'telemetry-zero',
      userId: 'patient-0',
      timestamp: new Date().toISOString(),
      heartRate: 0,
      rhr: 0,
      hrv: 0,
      spo2: 0,
      steps: 0,
      sleep: { totalMinutes: 0, deepMinutes: 0, remMinutes: 0, lightMinutes: 0, sleepScore: 0 },
      connectionStatus: 'disconnected' as const,
    };

    const { container } = render(<HolographicBodyScanner telemetry={zeroTelemetry} />);
    expect(screen.getByText('0 bpm')).toBeDefined();
    expect(screen.getByText('0%')).toBeDefined();
    expect(container.textContent).not.toContain('NaN');
  });

  it('1.4: Rapid sequential clicking across all 6 organ hotspots without state corruption', () => {
    const { container } = render(
      <HolographicBodyScanner
        labObservations={[
          { name: 'Troponin-I', value: '0.08 ng/mL', status: 'critical', referenceHigh: 0.04 },
          { name: 'SpO2', value: 88, status: 'warning', referenceLow: 95 },
          { name: 'SGPT / ALT', value: 140, status: 'critical', referenceHigh: 45 },
          { name: 'HbA1c', value: 9.8, status: 'critical', referenceHigh: 5.7 },
          { name: 'Serum Creatinine', value: 2.8, status: 'critical', referenceHigh: 1.2 },
          { name: 'Hemoglobin', value: 8.2, status: 'critical', referenceLow: 13.0 },
        ]}
      />
    );

    const organKeys = [
      'Cardiovascular',
      'Pulmonary',
      'Hepatic',
      'Metabolic',
      'Renal',
      'Hematology',
    ];

    const hotspotButtons = Array.from(container.querySelectorAll('[role="button"]')).filter((b) =>
      organKeys.some((k) => b.getAttribute('aria-label')?.includes(k))
    );

    expect(hotspotButtons.length).toBeGreaterThanOrEqual(6);

    // Rapid sequential fireEvent.click across all 6 hotspots
    for (const btn of hotspotButtons) {
      fireEvent.click(btn);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();

      // Close modal before next click
      const closeBtn = screen.getByLabelText(/Close Organ Inspection/i);
      fireEvent.click(closeBtn);
    }
  });

  it('1.5: Keyboard accessibility: triggers organ inspection on Enter and Space keypresses', () => {
    const { container } = render(<HolographicBodyScanner />);
    const renalHotspot = Array.from(container.querySelectorAll('[role="button"]')).find((b) =>
      b.getAttribute('aria-label')?.includes('Renal')
    );

    expect(renalHotspot).toBeDefined();

    // Trigger Enter key
    fireEvent.keyDown(renalHotspot!, { key: 'Enter', code: 'Enter' });
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Renal & Urinary System/i)).toBeDefined();

    // Close
    fireEvent.click(screen.getByLabelText(/Close Organ Inspection/i));

    // Trigger Space key
    fireEvent.keyDown(renalHotspot!, { key: ' ', code: 'Space' });
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Renal & Urinary System/i)).toBeDefined();
  });

  it('1.6: Modal inspection content correctness and specialist navigation callback invocation', () => {
    const onSelectSpecialistMock = vi.fn();
    const { container } = render(
      <HolographicBodyScanner
        labObservations={[
          { name: 'HbA1c', value: '11.2', unit: '%', status: 'critical', referenceHigh: 5.7 },
          { name: 'Fasting Glucose', value: '240', unit: 'mg/dL', status: 'critical', referenceHigh: 100 },
        ]}
        onSelectSpecialist={onSelectSpecialistMock}
      />
    );

    // Click Metabolic hotspot
    const metabolicHotspot = Array.from(container.querySelectorAll('[role="button"]')).find((b) =>
      b.getAttribute('aria-label')?.includes('Metabolic')
    );
    fireEvent.click(metabolicHotspot!);

    // Inspect modal DOM
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Metabolic & Endocrine System/i)).toBeDefined();
    expect(within(dialog).getByText(/critical Status/i)).toBeDefined();
    expect(within(dialog).getByText('HbA1c')).toBeDefined();
    expect(within(dialog).getByText('11.2 %')).toBeDefined();
    expect(within(dialog).getByText('Fasting Glucose')).toBeDefined();
    expect(within(dialog).getByText('240 mg/dL')).toBeDefined();
    expect(within(dialog).getByText(/Clinical Assessment/i)).toBeDefined();
    expect(within(dialog).getByText(/Clinical Specialist Guidance/i)).toBeDefined();

    // Trigger AI Specialist Lounge CTA
    const specialistCta = within(dialog).getByText(/Consult AI Specialist Lounge/i);
    fireEvent.click(specialistCta);

    expect(onSelectSpecialistMock).toHaveBeenCalledTimes(1);
    expect(onSelectSpecialistMock).toHaveBeenCalledWith('metabolic');
  });

  it('1.7: Specialist navigation fallback to window.location.hash when callback is omitted', () => {
    window.location.hash = '';
    const { container } = render(
      <HolographicBodyScanner
        labObservations={[
          { name: 'LDL Cholesterol', value: '210', unit: 'mg/dL', status: 'critical', referenceHigh: 100 },
        ]}
      />
    );

    const cardioHotspot = Array.from(container.querySelectorAll('[role="button"]')).find((b) =>
      b.getAttribute('aria-label')?.includes('Cardiovascular')
    );
    fireEvent.click(cardioHotspot!);

    const dialog = screen.getByRole('dialog');
    const specialistCta = within(dialog).getByText(/Consult AI Specialist Lounge/i);
    fireEvent.click(specialistCta);

    expect(window.location.hash).toBe('#specialists');
  });

  it('1.8: 3D Mouse movement tilt coordinate tracking and laser scan toggle interactions', () => {
    const { container } = render(<HolographicBodyScanner />);
    const scanner = screen.getByTestId('holographic-body-scanner');

    // Simulate mouse moves with bounding rect
    vi.spyOn(scanner, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      width: 800,
      height: 600,
      right: 900,
      bottom: 700,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    fireEvent.mouseMove(scanner, { clientX: 300, clientY: 250 });
    fireEvent.mouseLeave(scanner);

    // Laser scan toggle
    const toggleBtn = screen.getByLabelText(/Pause Laser Scan/i);
    expect(screen.getByText(/Laser Scan ON/i)).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Laser Scan PAUSED/i)).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Laser Scan ON/i)).toBeDefined();
  });

  it('1.9: Adversarial input stress: chaotic and malformed lab observations', () => {
    const chaoticLabs = [
      { name: '', value: 'N/A' },
      { name: 'Unknown Biomarker', value: undefined as any },
      { name: 'Glucose', value: '>> 9999 mg/dL', status: 'critical', referenceHigh: 140 },
      { name: 'Creatinine', value: -5.0, status: 'low', referenceLow: 0.6 },
      { name: 'SpO2', value: 'NaN', status: 'abnormal' },
    ];

    const overview = calculateOrganSystemScores(chaoticLabs);
    expect(overview).toBeDefined();
    expect(overview.overallScore).toBeGreaterThanOrEqual(0);
    expect(overview.overallScore).toBeLessThanOrEqual(100);

    const { container } = render(<HolographicBodyScanner labObservations={chaoticLabs} />);
    expect(container.textContent).not.toContain('NaN');
  });
});

describe('Milestone 2 Empirical Stress: VisualLabReportCard (Biomarker Range Bars & Diagnostic Summary)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const baseReport: LabReport = {
    id: 'report-stress-01',
    fileName: 'metropolis_specialty_pathology.pdf',
    hospitalName: 'Metropolis Healthcare & Clinical Diagnostics',
    doctorName: 'Sunil Nair',
    date: '2026-08-20T08:00:00Z',
    uploadedAt: '2026-08-20T08:00:00Z',
    status: 'complete',
    extractedData: {
      summary: 'Critical metabolic decompensation and severe renal impairment detected.',
      observations: [
        {
          marker: 'HbA1c',
          value: 18.0,
          valueCanonical: 18.0,
          unit: '%',
          unitCanonical: '%',
          referenceLow: 4.0,
          referenceHigh: 5.7,
          flag: 'CRITICAL',
        },
        {
          marker: 'Fasting Plasma Glucose',
          value: 600,
          valueCanonical: 600,
          unit: 'mg/dL',
          unitCanonical: 'mg/dL',
          referenceLow: 70,
          referenceHigh: 100,
          flag: 'PANIC',
        },
        {
          marker: 'eGFR (Kidney Filtering Rate)',
          value: 5,
          valueCanonical: 5,
          unit: 'mL/min/1.73m2',
          unitCanonical: 'mL/min/1.73m2',
          referenceLow: 60,
          referenceHigh: 120,
          flag: 'CRITICAL',
        },
        {
          marker: 'LDL Cholesterol',
          value: 350,
          valueCanonical: 350,
          unit: 'mg/dL',
          unitCanonical: 'mg/dL',
          referenceLow: 0,
          referenceHigh: 100,
          flag: 'CRITICAL',
        },
      ],
    },
  };

  it('2.1: Extreme outlier biomarker values stress test (HbA1c: 18.0%, Glucose: 600 mg/dL, eGFR: 5 mL/min, LDL: 350 mg/dL)', () => {
    const { container } = render(<VisualLabReportCard report={baseReport} />);

    expect(screen.getByTestId('visual-lab-report-card')).toBeDefined();
    expect(screen.getByText('Metropolis Healthcare & Clinical Diagnostics')).toBeDefined();
    expect(screen.getByText(/Dr. Sunil Nair/i)).toBeDefined();

    // Verify all 4 extreme biomarkers rendered
    expect(screen.getByText('HbA1c')).toBeDefined();
    expect(screen.getByText('18')).toBeDefined();
    expect(screen.getByText('Fasting Plasma Glucose')).toBeDefined();
    expect(screen.getByText('600')).toBeDefined();
    expect(screen.getByText('eGFR (Kidney Filtering Rate)')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('LDL Cholesterol')).toBeDefined();
    expect(screen.getByText('350')).toBeDefined();

    // Verify 4-zone range bars render
    const rangeBars = screen.getAllByTestId('four-zone-range-bar');
    expect(rangeBars.length).toBe(4);

    // Verify Critical/Panic zone indicators
    const panicBadges = screen.getAllByText(/Panic \/ Critical Zone|Low Zone/i);
    expect(panicBadges.length).toBeGreaterThanOrEqual(4);

    // Layout validation: Zero NaN or undefined
    expect(container.textContent).not.toContain('NaN');
    expect(container.textContent).not.toContain('undefined');
  });

  it('2.2: Inverted bounds biomarker stress test: eGFR = 5 mL/min (low value = critical failure)', () => {
    render(<VisualLabReportCard report={baseReport} />);

    // Check plain English explanation for eGFR
    expect(
      screen.getByText(/Estimated Glomerular Filtration Rate; shows the percentage of kidney filtering capacity/i)
    ).toBeDefined();

    // Check reference boundaries for eGFR (Low: 60, High: 120)
    expect(screen.getByText(/Low: 60 mL\/min\/1.73m2/i)).toBeDefined();
    expect(screen.getByText(/High: 120 mL\/min\/1.73m2/i)).toBeDefined();
  });

  it('2.3: Graceful fallback when historical reports array is empty', () => {
    render(<VisualLabReportCard report={baseReport} historicalReports={[]} />);

    // When historical reports is empty, each biomarker sparkline should render "Baseline test recorded"
    const baselines = screen.getAllByText(/Baseline test recorded/i);
    expect(baselines.length).toBe(4);
  });

  it('2.4: Multi-date historical sparklines: positive trajectory, negative trajectory, and zero-value delta', () => {
    const historicalReports: LabReport[] = [
      {
        id: 'hist-01',
        fileName: 'report_jan_2026.pdf',
        date: '2026-01-10T10:00:00Z',
        uploadedAt: '2026-01-10T10:00:00Z',
        extractedData: {
          observations: [
            { marker: 'HbA1c', value: 6.5, unit: '%' },
            { marker: 'LDL Cholesterol', value: 400, unit: 'mg/dL' },
          ],
        },
      },
      {
        id: 'hist-02',
        fileName: 'report_may_2026.pdf',
        date: '2026-05-15T10:00:00Z',
        uploadedAt: '2026-05-15T10:00:00Z',
        extractedData: {
          observations: [
            { marker: 'HbA1c', value: 12.0, unit: '%' },
            { marker: 'LDL Cholesterol', value: 380, unit: 'mg/dL' },
          ],
        },
      },
    ];

    const { container } = render(
      <VisualLabReportCard report={baseReport} historicalReports={historicalReports} />
    );

    // Sparklines should be rendered for HbA1c and LDL Cholesterol
    const sparklines = screen.getAllByTestId('biomarker-sparkline');
    expect(sparklines.length).toBe(2);

    // Verify SVG polyline elements exist with valid coordinates
    const polylines = container.querySelectorAll('polyline');
    expect(polylines.length).toBe(2);
    polylines.forEach((poly) => {
      const points = poly.getAttribute('points');
      expect(points).toBeDefined();
      expect(points).not.toContain('NaN');
    });

    // HbA1c jumped from 12.0 to 18.0 (+6.0 (50.0%))
    expect(container.textContent).toContain('+6.0 (50.0%)');

    // LDL Cholesterol dropped from 380 to 350 (-30.0 (-7.9%))
    expect(container.textContent).toContain('-30.0 (-7.9%)');
  });

  it('2.5: BiomarkerSparkline edge case: previous value is 0 (divide-by-zero protection)', () => {
    const { container } = render(
      <BiomarkerSparkline
        currentValue={10}
        historyValues={[{ date: '2026-01-01', value: 0 }]}
        unit="mg/dL"
      />
    );

    expect(screen.getByTestId('biomarker-sparkline')).toBeDefined();
    // Delta from 0 to 10 with safe fallback
    expect(container.textContent).toContain('+10.0 (0%)');
    expect(container.textContent).not.toContain('Infinity');
    expect(container.textContent).not.toContain('NaN');
  });

  it('2.6: SBAR modal trigger lifecycle: callback invocation and internal modal fallback', () => {
    const onViewSbarMock = vi.fn();

    // Test with onViewSbar callback provided
    const { unmount } = render(
      <VisualLabReportCard report={baseReport} onViewSbar={onViewSbarMock} />
    );
    const sbarBtn = screen.getByTitle(/View Structured SBAR Clinical Summary/i);
    fireEvent.click(sbarBtn);
    expect(onViewSbarMock).toHaveBeenCalledTimes(1);
    expect(onViewSbarMock).toHaveBeenCalledWith(baseReport);
    unmount();

    // Test without callback -> triggers internal modal
    render(<VisualLabReportCard report={baseReport} />);
    const sbarInternalBtn = screen.getByTitle(/View Structured SBAR Clinical Summary/i);
    fireEvent.click(sbarInternalBtn);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/SBAR Structured Diagnostic Handover/i)).toBeDefined();
    expect(screen.getByText(/S — Situation:/i)).toBeDefined();
    expect(screen.getByText(/B — Background:/i)).toBeDefined();
    expect(screen.getByText(/A — Assessment:/i)).toBeDefined();
    expect(screen.getByText(/R — Recommendation:/i)).toBeDefined();

    // Close modal
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
  });

  it('2.7: FHIR R4 Bundle Export and JSON Download Invocations', () => {
    // Verify direct exportToFhirBundle and validateFhirBundle conformance
    const patient = { id: baseReport.profileId || 'patient-user', name: 'Patient' };
    const bundle = exportToFhirBundle(patient, [baseReport]);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.total).toBeGreaterThanOrEqual(4);

    const validation = validateFhirBundle(bundle);
    expect(validation.isValid).toBe(true);

    // Test JSON summary download when no fileUrl
    render(<VisualLabReportCard report={baseReport} />);
    const jsonBtn = screen.getByText(/JSON/i);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    fireEvent.click(jsonBtn);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('2.8: FourZoneRangeBar Corner Cases & Anomaly Stress Testing', () => {
    // Case 1: Missing reference ranges with flags
    const { rerender, container } = render(
      <FourZoneRangeBar value={150} refLow={null} refHigh={null} unit="mg/dL" status="CRITICAL" />
    );
    expect(screen.getByText(/Panic \/ Critical Zone/i)).toBeDefined();
    expect(screen.getByText(/< Ref/i)).toBeDefined();
    expect(screen.getByText(/> Ref/i)).toBeDefined();
    expect(container.textContent).not.toContain('NaN');

    // Case 2: Status is LOW with missing ref and negative value
    rerender(<FourZoneRangeBar value={-5} refLow={null} refHigh={null} unit="mg/dL" status="LOW" />);
    expect(screen.getByText(/Low Zone/i)).toBeDefined();

    // Case 3: Status is HIGH with missing ref and value above high (100) but <= panic (130)
    rerender(<FourZoneRangeBar value={115} refLow={null} refHigh={null} unit="mg/dL" status="HIGH" />);
    expect(screen.getByText(/High Zone/i)).toBeDefined();

    // Case 4: Degenerate inverted reference ranges (refHigh <= refLow)
    rerender(<FourZoneRangeBar value={50} refLow={100} refHigh={50} unit="mg/dL" status="NORMAL" />);
    expect(container.textContent).not.toContain('NaN');

    // Case 5: Exact boundary values (value == refLow, value == refHigh)
    rerender(<FourZoneRangeBar value={70} refLow={70} refHigh={110} unit="mg/dL" status="NORMAL" />);
    expect(screen.getByText(/Normal Zone/i)).toBeDefined();

    rerender(<FourZoneRangeBar value={110} refLow={70} refHigh={110} unit="mg/dL" status="NORMAL" />);
    expect(screen.getByText(/Normal Zone/i)).toBeDefined();
  });

  it('2.9: Plain English Summaries lookup exhaustive verification across all 17 clinical biomarkers', () => {
    const keys = Object.keys(PLAIN_ENGLISH_EXPLANATIONS);
    expect(keys.length).toBeGreaterThanOrEqual(17);

    for (const key of keys) {
      const summary = getPlainEnglishSummary(key);
      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(15);
      expect(summary).not.toContain('Standard clinical physiological biomarker');
    }

    // SGPT and SGOT aliases
    expect(getPlainEnglishSummary('SGPT (ALT)')).toContain('Liver enzyme (SGPT)');
    expect(getPlainEnglishSummary('SGOT (AST)')).toContain('Enzyme (SGOT)');

    // Fallback for unmapped biomarker
    const unmappedSummary = getPlainEnglishSummary('Calprotectin');
    expect(unmappedSummary).toContain('Standard clinical physiological biomarker used to assess homeostasis');
  });

  it('2.10: Card Header Edge Cases, Selection Checkbox, and Expand/Collapse transitions', () => {
    const onToggleMock = vi.fn();
    const minimalReport: LabReport = {
      id: 'report-min-01',
      uploadedAt: '2026-08-22T00:00:00Z',
      fileUrl: 'https://example.com/lab_report.pdf',
    };

    const { rerender } = render(
      <VisualLabReportCard
        report={minimalReport}
        showCheckbox={true}
        isSelected={false}
        onToggleSelection={onToggleMock}
      />
    );

    // Header fallbacks
    expect(screen.getByText('Comprehensive Diagnostic Panel')).toBeDefined();
    expect(screen.getByText('Diagnostic Report')).toBeDefined();

    // Selection checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggleMock).toHaveBeenCalledWith('report-min-01');

    // External PDF download link
    const pdfLink = screen.getByText(/PDF/i).closest('a');
    expect(pdfLink).toBeDefined();
    expect(pdfLink?.getAttribute('href')).toBe('https://example.com/lab_report.pdf');
    expect(pdfLink?.getAttribute('target')).toBe('_blank');

    // Expand / Collapse card toggle
    rerender(<VisualLabReportCard report={baseReport} />);
    const collapseBtn = screen.getByRole('button', { name: /Hide Visual Range Cards/i });
    expect(collapseBtn).toBeDefined();

    fireEvent.click(collapseBtn);
    expect(screen.getByRole('button', { name: /View Visual Range Cards/i })).toBeDefined();
    expect(screen.getByText(/View 4 Cards/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /View Visual Range Cards/i }));
    expect(screen.getByRole('button', { name: /Hide Visual Range Cards/i })).toBeDefined();
  });
});
