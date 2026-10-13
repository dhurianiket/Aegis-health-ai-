import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackWidget from '../FeedbackWidget';
import { Hero3DHealthGauge } from '../Hero3DHealthGauge';
import { HolographicBodyScanner } from '../HolographicBodyScanner';
import WearableCoachWidget from '../../AIHelper/WearableCoachWidget';
import { WearableBiometrics } from '../../../types/wearables';

// Mock Firebase
vi.mock('../../../lib/firebase/config', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: vi.fn().mockResolvedValue({ id: 'feedback-123' }),
  serverTimestamp: vi.fn(() => new Date().toISOString()),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-1', email: 'test@example.com' },
  }),
}));

describe('FeedbackWidget Native Dialog & Wearable Standby Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FeedbackWidget', () => {
    it('renders the floating feedback trigger button', () => {
      render(<FeedbackWidget />);
      const btn = screen.getByLabelText(/Open Feedback Form/i);
      expect(btn).toBeDefined();
    });

    it('opens native feedback dialog and submits successfully without iframe blocking', async () => {
      render(<FeedbackWidget />);
      const btn = screen.getByLabelText(/Open Feedback Form/i);
      fireEvent.click(btn);

      // Verify modal elements
      expect(screen.getByText(/Early Access Feedback/i)).toBeDefined();
      expect(screen.getByText(/Your Rating/i)).toBeDefined();
      expect(screen.getByText(/Feedback Type/i)).toBeDefined();

      const textarea = screen.getByPlaceholderText(/What worked well, or what needs improvement\?/i);
      fireEvent.change(textarea, { target: { value: 'Great experience, but please add Dark Sky weather!' } });

      const submitBtn = screen.getByText(/Submit Feedback/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Thank You!/i)).toBeDefined();
      });
    });
  });

  describe('Hero3DHealthGauge Vitals Disconnected State', () => {
    it('renders -- and Standby when vitals props are missing or null (zero mock vitals)', () => {
      render(
        <Hero3DHealthGauge
          score={85}
          userName="Aniket Dhuri"
          heartRate={undefined}
          hrv={undefined}
          spo2={undefined}
        />
      );

      // Should NOT render fake 68 bpm or 55 ms
      expect(screen.queryByText('68')).toBeNull();
      expect(screen.queryByText('55')).toBeNull();

      // Should render -- for unlinked vitals
      expect(screen.getAllByText(/--/).length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Standby')).toBeDefined();
    });

    it('renders real live telemetry values when smartwatch is connected', () => {
      render(
        <Hero3DHealthGauge
          score={90}
          userName="Aniket Dhuri"
          heartRate={76}
          hrv={64}
          spo2={99}
        />
      );

      expect(screen.getByText(/76/)).toBeDefined();
      expect(screen.getByText(/64/)).toBeDefined();
      expect(screen.getByText('99%')).toBeDefined();
      expect(screen.getByText('Optimal')).toBeDefined();
    });
  });

  describe('HolographicBodyScanner Disconnected vs Connected State', () => {
    it('renders Standby · No Watch Connected and -- bpm when telemetry is null', () => {
      render(
        <HolographicBodyScanner
          labObservations={[]}
          telemetry={null}
        />
      );

      expect(screen.getAllByText(/Standby · No Watch Connected/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('-- bpm')).toBeDefined();
      expect(screen.getByText('--%')).toBeDefined();
      expect(screen.getByText('--/--')).toBeDefined();
      expect(screen.getByText('--°F')).toBeDefined();
      expect(screen.getByText(/Pair smartwatch or Apple\/Google Health for live telemetry/i)).toBeDefined();
    });

    it('renders LIVE badge and real bpm when smartwatch telemetry is active', () => {
      render(
        <HolographicBodyScanner
          labObservations={[]}
          telemetry={{
            id: 'tel-1',
            userId: 'u-1',
            timestamp: new Date().toISOString(),
            heartRate: 75,
            rhr: 63,
            hrv: 59,
            spo2: 99,
            steps: 6200,
            sleep: { totalMinutes: 480, deepMinutes: 100, remMinutes: 110, lightMinutes: 270, sleepScore: 85 },
            connectionStatus: 'connected',
          }}
        />
      );

      expect(screen.getByText('LIVE')).toBeDefined();
      expect(screen.getByText('75 bpm')).toBeDefined();
      expect(screen.getByText('99%')).toBeDefined();
    });
  });

  describe('WearableCoachWidget Disconnected State', () => {
    it('renders empty sleep state and -- metrics when telemetry is null (zero fake sleep data)', () => {
      render(
        <WearableCoachWidget
          telemetry={null}
        />
      );

      // Verify standby badge
      expect(screen.getAllByText(/Standby · No Watch Synced/i).length).toBeGreaterThanOrEqual(1);

      // Verify readiness score displays -- instead of fake 82 or 85
      expect(screen.getAllByText('--').length).toBeGreaterThanOrEqual(1);

      // Verify sleep architecture shows empty prompt instead of fake sleep stages
      expect(screen.getByText(/No Sleep Telemetry Recorded/i)).toBeDefined();
      expect(screen.getByText(/No Sleep Synced/i)).toBeDefined();

      // Verify micro-trends show -- instead of fake metrics
      expect(screen.getByText('--%')).toBeDefined();
    });

    it('renders real sleep architecture and telemetry when watch is connected', () => {
      const realTelemetry: WearableBiometrics = {
        id: 'real-1',
        userId: 'u-1',
        timestamp: new Date().toISOString(),
        heartRate: 72,
        rhr: 64,
        hrv: 56,
        spo2: 98,
        steps: 8500,
        sleep: {
          totalMinutes: 460,
          deepMinutes: 105,
          remMinutes: 115,
          lightMinutes: 240,
          sleepScore: 86,
        },
        connectionStatus: 'connected',
      };

      render(
        <WearableCoachWidget
          telemetry={realTelemetry}
        />
      );

      expect(screen.getByText(/Score: 86\/100/i)).toBeDefined();
      expect(screen.getByText('64')).toBeDefined();
      expect(screen.getByText('98%')).toBeDefined();
    });
  });
});
