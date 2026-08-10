import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import HealthConnectModal from '../HealthConnectModal';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123', email: 'test@aegishealth.ai' },
  }),
}));

vi.mock('../../../services/healthSyncService', () => ({
  syncAppleHealth: vi.fn().mockResolvedValue({ success: true, recordsSynced: 5 }),
  syncGoogleHealth: vi.fn().mockResolvedValue({ success: true, recordsSynced: 5 }),
  parseAppleHealthExport: vi.fn().mockReturnValue({ heartRate: 72, steps: 8000 }),
  parseGoogleHealthExport: vi.fn().mockReturnValue({ heartRate: 72, steps: 8000 }),
  getHealthSyncState: vi.fn().mockReturnValue({
    appleHealth: { connected: true, recordsCount: 10 },
    googleHealth: { connected: false, recordsCount: 0 },
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

describe('HealthConnectModal Component Test Suite', () => {
  it('1. Does not render when isOpen is false', () => {
    const { container } = render(
      <HealthConnectModal isOpen={false} onClose={vi.fn()} provider="apple" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('2. Renders Apple Health modal correctly when isOpen is true', () => {
    render(<HealthConnectModal isOpen={true} onClose={vi.fn()} provider="apple" />);
    expect(screen.getByText('Apple Health (HealthKit)')).not.toBeNull();
    expect(screen.getByText('Live Sync & Permissions')).not.toBeNull();
  });

  it('3. Switches tabs between Permissions, File Import, and Manual Metrics', () => {
    render(<HealthConnectModal isOpen={true} onClose={vi.fn()} provider="apple" />);

    const manualTab = screen.getByText('Manual Metrics');
    fireEvent.click(manualTab);

    expect(screen.getByText('Heart Rate (BPM)')).not.toBeNull();
    expect(screen.getByText('Daily Steps')).not.toBeNull();
  });

  it('4. Saves custom manual metrics correctly', async () => {
    const onSyncMock = vi.fn();
    render(
      <HealthConnectModal
        isOpen={true}
        onClose={vi.fn()}
        provider="apple"
        onSyncComplete={onSyncMock}
      />
    );

    fireEvent.click(screen.getByText('Manual Metrics'));
    const saveBtn = screen.getByText(/Save Custom/i);
    fireEvent.click(saveBtn);

    const successMsg = await screen.findByText(/Custom biometrics saved to Apple Health/i);
    expect(successMsg).not.toBeNull();
  });
});
