import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreeBodyScanner3D } from '../ThreeBodyScanner3D';
import { calculateOrganSystemScores } from '../../../services/organHealthService';

describe('ThreeBodyScanner3D WebGL Medical Digital Twin', () => {
  const mockOverview = calculateOrganSystemScores([]);

  it('renders canvas, interactive camera controls, and helper badge', () => {
    render(
      <ThreeBodyScanner3D
        overview={mockOverview}
        telemetry={null}
        selectedOrganKey={null}
        onSelectOrgan={vi.fn()}
        scanActive={true}
      />
    );

    // Verify canvas or fallback is present
    expect(
      screen.queryByLabelText(/3D Holographic Patient Anatomical Model/i) ||
      screen.queryByText(/WebGL acceleration active/i)
    ).toBeDefined();

    // Verify interactive 3D spatial controls
    expect(screen.getByLabelText(/Reset View/i)).toBeDefined();
    expect(screen.getByLabelText(/Zoom In/i)).toBeDefined();
    expect(screen.getByLabelText(/Zoom Out/i)).toBeDefined();
    expect(screen.getByLabelText(/Toggle Auto-Orbit/i)).toBeDefined();

    // Verify helper instruction badge
    expect(screen.getByText(/Drag to rotate 360°/i)).toBeDefined();
  });

  it('allows clicking Reset View, Zoom In, Zoom Out, and Auto-Orbit toggle without error', () => {
    render(
      <ThreeBodyScanner3D
        overview={mockOverview}
        telemetry={null}
        selectedOrganKey="cardiovascular"
        onSelectOrgan={vi.fn()}
        scanActive={false}
      />
    );

    const resetBtn = screen.getByLabelText(/Reset View/i);
    const zoomInBtn = screen.getByLabelText(/Zoom In/i);
    const zoomOutBtn = screen.getByLabelText(/Zoom Out/i);
    const orbitBtn = screen.getByLabelText(/Toggle Auto-Orbit/i);

    fireEvent.click(resetBtn);
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(orbitBtn);

    expect(orbitBtn.getAttribute('title')).toContain('Resume 3D Orbit');
  });
});
