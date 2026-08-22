import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  VisualLabReportCard,
  FourZoneRangeBar,
  BiomarkerSparkline,
  getPlainEnglishSummary,
  LabReport,
} from '../LabReports/VisualLabReportCard';

describe('Milestone 2 (R2): Intuitive Visual Biomarker Range Bars & Diagnostic Summary Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockReport: LabReport = {
    id: 'report-101',
    fileName: 'apollo_diagnostics_comprehensive.pdf',
    hospitalName: 'Apollo Diagnostics Laboratory',
    doctorName: 'Dr. Rajesh Sharma',
    date: '2026-08-15T10:30:00Z',
    uploadedAt: '2026-08-15T10:30:00Z',
    status: 'complete',
    extractedData: {
      summary: 'Patient exhibits elevated HbA1c and borderline LDL cholesterol.',
      observations: [
        {
          marker: 'HbA1c',
          value: 7.4,
          valueCanonical: 7.4,
          unit: '%',
          unitCanonical: '%',
          referenceLow: 4.0,
          referenceHigh: 5.7,
          flag: 'HIGH',
        },
        {
          marker: 'LDL Cholesterol',
          value: 145,
          valueCanonical: 145,
          unit: 'mg/dL',
          unitCanonical: 'mg/dL',
          referenceLow: 0,
          referenceHigh: 100,
          flag: 'HIGH',
        },
        {
          marker: 'Serum Creatinine',
          value: 0.9,
          valueCanonical: 0.9,
          unit: 'mg/dL',
          unitCanonical: 'mg/dL',
          referenceLow: 0.6,
          referenceHigh: 1.2,
          flag: 'NORMAL',
        },
      ],
    },
  };

  const mockHistoricalReports: LabReport[] = [
    {
      id: 'report-100',
      fileName: 'apollo_diagnostics_previous.pdf',
      date: '2026-05-10T10:30:00Z',
      uploadedAt: '2026-05-10T10:30:00Z',
      extractedData: {
        observations: [
          { marker: 'HbA1c', value: 6.8, unit: '%' },
          { marker: 'LDL Cholesterol', value: 160, unit: 'mg/dL' },
        ],
      },
    },
  ];

  it('renders the VisualLabReportCard with header info and extracted biomarkers', () => {
    render(<VisualLabReportCard report={mockReport} historicalReports={mockHistoricalReports} />);

    expect(screen.getByTestId('visual-lab-report-card')).toBeDefined();
    expect(screen.getByText('Apollo Diagnostics Laboratory')).toBeDefined();
    expect(screen.getByText(/Dr. Rajesh Sharma/i)).toBeDefined();
    expect(screen.getByText('HbA1c')).toBeDefined();
    expect(screen.getByText('LDL Cholesterol')).toBeDefined();
    expect(screen.getByText('Serum Creatinine')).toBeDefined();
  });

  it('renders 4-zone continuous range bar visualizer with reference boundaries', () => {
    render(<VisualLabReportCard report={mockReport} historicalReports={mockHistoricalReports} />);

    const rangeBars = screen.getAllByTestId('four-zone-range-bar');
    expect(rangeBars.length).toBe(3);

    // Verify presence of zone indicator labels and limits
    expect(screen.getByText(/Low: 4 %/i)).toBeDefined();
    expect(screen.getByText(/High: 5.7 %/i)).toBeDefined();
  });

  it('displays plain-English non-jargon clinical explanations for biomarkers', () => {
    render(<VisualLabReportCard report={mockReport} historicalReports={mockHistoricalReports} />);

    expect(screen.getByText(/Measures your average 3-month blood sugar control/i)).toBeDefined();
    expect(screen.getByText(/Known as 'bad' cholesterol; tracks the risk of vascular plaque/i)).toBeDefined();
    expect(screen.getByText(/Natural muscle waste product filtered by kidneys/i)).toBeDefined();
  });

  it('renders historical comparison sparklines calculating deltas across tests', () => {
    render(<VisualLabReportCard report={mockReport} historicalReports={mockHistoricalReports} />);

    const sparklines = screen.getAllByTestId('biomarker-sparkline');
    expect(sparklines.length).toBeGreaterThanOrEqual(1);

    // Delta for HbA1c from 6.8 to 7.4 is +0.6
    expect(screen.getByText(/\+0.6/i)).toBeDefined();
  });

  it('renders FourZoneRangeBar standalone correctly with zone calculations', () => {
    const { container } = render(
      <FourZoneRangeBar
        value={150}
        refLow={50}
        refHigh={100}
        unit="mg/dL"
        status="HIGH"
      />
    );

    expect(screen.getByTestId('four-zone-range-bar')).toBeDefined();
    expect(screen.getByText(/Low: 50 mg\/dL/i)).toBeDefined();
    expect(screen.getByText(/High: 100 mg\/dL/i)).toBeDefined();
    expect(screen.getByText(/Panic \/ Critical Zone|High Zone/i)).toBeDefined();
  });

  it('renders BiomarkerSparkline standalone with multiple historical points', () => {
    render(
      <BiomarkerSparkline
        currentValue={120}
        historyValues={[
          { date: '2026-01-01', value: 140 },
          { date: '2026-04-01', value: 130 },
        ]}
        unit="mg/dL"
      />
    );

    expect(screen.getByTestId('biomarker-sparkline')).toBeDefined();
    expect(screen.getByText(/-10.0/i)).toBeDefined();
  });

  it('getPlainEnglishSummary returns appropriate text for unknown and known biomarkers', () => {
    expect(getPlainEnglishSummary('hba1c')).toContain('blood sugar control');
    expect(getPlainEnglishSummary('egfr')).toContain('kidney filtering capacity');
    expect(getPlainEnglishSummary('random_unknown_marker')).toContain('Standard clinical physiological biomarker');
  });

  it('opens and closes the SBAR summary modal', async () => {
    render(<VisualLabReportCard report={mockReport} />);

    const sbarBtn = screen.getByTitle(/View Structured SBAR Clinical Summary/i);
    fireEvent.click(sbarBtn);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/SBAR Structured Diagnostic Handover/i)).toBeDefined();
    expect(screen.getByText(/S — Situation:/i)).toBeDefined();

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('toggles expand and collapse of biomarker cards', () => {
    render(<VisualLabReportCard report={mockReport} />);

    const toggleBtn = screen.getByLabelText(/Hide Visual Range Cards/i);
    fireEvent.click(toggleBtn);

    // Button should now offer to view cards
    expect(screen.getByText(/View 3 Cards/i)).toBeDefined();
  });
});
