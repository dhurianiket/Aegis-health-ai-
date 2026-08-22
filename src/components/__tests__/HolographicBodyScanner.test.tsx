import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HolographicBodyScanner } from '../Dashboard/HolographicBodyScanner';

describe('Milestone 1 (R1): 3D Holographic Anatomical Body & Organ Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the 3D Holographic Body Scanner container and live HUD telemetry', () => {
    render(
      <HolographicBodyScanner
        telemetry={{
          id: 'telemetry-1',
          userId: 'user-1',
          timestamp: new Date().toISOString(),
          heartRate: 74,
          rhr: 62,
          hrv: 58,
          spo2: 99,
          steps: 5000,
          sleep: { totalMinutes: 480, deepMinutes: 110, remMinutes: 100, lightMinutes: 270, sleepScore: 88 },
          connectionStatus: 'connected',
        }}
      />
    );

    expect(screen.getByTestId('holographic-body-scanner')).toBeDefined();
    expect(screen.getByText(/Interactive 3D Holographic Anatomical Body Scanner/i)).toBeDefined();
    expect(screen.getByText('74 bpm')).toBeDefined();
    expect(screen.getByText('99%')).toBeDefined();
    expect(screen.getByText(/Cardio ECG Waveform/i)).toBeDefined();
    expect(screen.getByText(/SpO2 Oxygen/i)).toBeDefined();
    expect(screen.getByText(/MAP.*93/i)).toBeDefined();
    expect(screen.getByText(/Body Temp/i)).toBeDefined();
    expect(screen.getByText(/Breathing Rate/i)).toBeDefined();
  });

  it('renders all 6 clickable organ hotspots (Heart, Lungs, Liver, Pancreas, Kidneys, Blood)', () => {
    const { container } = render(<HolographicBodyScanner />);
    const buttons = container.querySelectorAll('[role="button"]');
    expect(buttons.length).toBeGreaterThanOrEqual(6);

    const labels = Array.from(buttons).map(b => b.getAttribute('aria-label') || '');
    expect(labels.some(l => l.includes('Cardiovascular'))).toBe(true);
    expect(labels.some(l => l.includes('Pulmonary'))).toBe(true);
    expect(labels.some(l => l.includes('Hepatic'))).toBe(true);
    expect(labels.some(l => l.includes('Metabolic'))).toBe(true);
    expect(labels.some(l => l.includes('Renal'))).toBe(true);
    expect(labels.some(l => l.includes('Hematology'))).toBe(true);
  });

  it('allows toggling the laser scanline', () => {
    render(<HolographicBodyScanner />);
    const scanToggle = screen.getByLabelText(/Pause Laser Scan/i);
    expect(scanToggle).toBeDefined();

    fireEvent.click(scanToggle);
    expect(screen.getByText(/Laser Scan PAUSED/i)).toBeDefined();

    fireEvent.click(scanToggle);
    expect(screen.getByText(/Laser Scan ON/i)).toBeDefined();
  });

  it('clicking an organ hotspot opens the detailed inspection modal with biomarkers and specialist CTA', () => {
    const onSelectSpecialistMock = vi.fn();
    const { container } = render(
      <HolographicBodyScanner
        labObservations={[
          { name: 'HbA1c', value: 7.2, unit: '%', status: 'critical', referenceHigh: 5.7 },
        ]}
        onSelectSpecialist={onSelectSpecialistMock}
      />
    );

    const metabolicHotspot = Array.from(container.querySelectorAll('[role="button"]')).find(b =>
      b.getAttribute('aria-label')?.includes('Metabolic')
    );
    expect(metabolicHotspot).toBeDefined();

    fireEvent.click(metabolicHotspot!);

    // Modal should appear
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Metabolic & Endocrine System/i)).toBeDefined();
    expect(screen.getByText('HbA1c')).toBeDefined();
    expect(screen.getByText('7.2 %')).toBeDefined();

    // Click CTA
    const cta = screen.getByText(/Consult AI Specialist Lounge/i);
    fireEvent.click(cta);
    expect(onSelectSpecialistMock).toHaveBeenCalledWith('metabolic');
  });

  it('closes the modal when clicking the close button', async () => {
    const { container } = render(<HolographicBodyScanner />);
    const cardioHotspot = Array.from(container.querySelectorAll('[role="button"]')).find(b =>
      b.getAttribute('aria-label')?.includes('Cardiovascular')
    );
    expect(cardioHotspot).toBeDefined();
    fireEvent.click(cardioHotspot!);

    expect(screen.getByRole('dialog')).toBeDefined();
    const closeBtn = screen.getByLabelText(/Close Organ Inspection/i);
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('clicking an organ card from the 6-organ quick selector deck opens inspection modal', () => {
    render(<HolographicBodyScanner />);
    const kidneysButton = screen.getByText('Kidneys');
    fireEvent.click(kidneysButton);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Renal & Urinary System/i)).toBeDefined();
  });
});
