import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IntegrationsPanel from '../IntegrationsPanel';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-integrations-user', email: 'test@aegishealth.ai' },
  }),
}));

vi.mock('../../../services/healthSyncService', () => ({
  syncAppleHealth: vi.fn().mockResolvedValue({ success: true, recordsSynced: 5 }),
  syncGoogleHealth: vi.fn().mockResolvedValue({ success: true, recordsSynced: 5 }),
  parseAppleHealthExport: vi.fn().mockReturnValue({ heartRate: 72, steps: 8000 }),
  parseGoogleHealthExport: vi.fn().mockReturnValue({ heartRate: 75, steps: 8500 }),
  getHealthSyncState: vi.fn().mockReturnValue({
    appleHealth: { connected: true, recordsCount: 10, lastSynced: '2026-08-10T12:00:00Z' },
    googleHealth: { connected: false, recordsCount: 0, lastSynced: null },
  }),
  getHealthPermissions: vi.fn().mockReturnValue({
    heartRate: true,
    hrv: true,
    spo2: true,
    steps: true,
    sleep: true,
  }),
  saveHealthPermissions: vi.fn().mockReturnValue({
    heartRate: true,
    hrv: true,
    spo2: true,
    steps: true,
    sleep: true,
  }),
}));

describe('IntegrationsPanel UI Integration Test Suite', () => {
  const dummyProfile = {
    id: 'test-profile-1',
    name: 'Jane Doe',
    labValues: [
      { markerName: 'Glucose', value: 95, unit: 'mg/dL', status: 'normal' },
    ],
  };

  it('1. Renders Apple Health and Google Health Connect integration cards', () => {
    render(<IntegrationsPanel activeProfile={dummyProfile} />);
    expect(screen.getByText('Apple Health (HealthKit)')).not.toBeNull();
    expect(screen.getByText('Google Health Connect')).not.toBeNull();
    expect(screen.getByText('Data Portability & Export')).not.toBeNull();
  });

  it('2. Opens modal when Connect & Sync button is clicked', () => {
    render(<IntegrationsPanel activeProfile={dummyProfile} />);
    const syncButtons = screen.getAllByRole('button', { name: /Connect & Sync|Sync Now/i });
    expect(syncButtons.length).toBeGreaterThan(0);
    fireEvent.click(syncButtons[0]);

    // Modal should be visible
    expect(screen.getByText('Encrypted Telemetry Bridge')).not.toBeNull();
  });

  it('3. Renders data export options (FHIR JSON & CSV Spreadsheet)', () => {
    render(<IntegrationsPanel activeProfile={dummyProfile} />);
    expect(screen.getByText('FHIR JSON Export')).not.toBeNull();
    expect(screen.getByText('Spreadsheet (CSV)')).not.toBeNull();
  });
});
