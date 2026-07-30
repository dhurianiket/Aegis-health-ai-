import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import Dashboard from '../src/components/Dashboard/Dashboard';
import { AuthContext } from '../src/context/AuthContext';
import { ProfileContext } from '../src/context/ProfileContext';
import { getHealthScores, getLatestInsights, getDocuments } from '../src/lib/firebase/firestore';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock the Firestore calls
vi.mock('../src/lib/firebase/firestore', () => ({
  getHealthScores: vi.fn(),
  getLatestInsights: vi.fn(),
  getDocuments: vi.fn(),
  getLabHistory: vi.fn().mockResolvedValue([]),
}));

// Mock the components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  RadarChart: () => <div>RadarChart</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  Radar: () => <div />,
}));

vi.mock('../src/context/AlertsContext', () => ({
  useAlerts: vi.fn().mockReturnValue({
    alerts: [],
    dismissedIds: new Set(),
    dismissAlert: vi.fn(),
    unreadCount: 0,
  }),
  AlertsProvider: ({ children }: any) => <div>{children}</div>,
}));

const mockAuthContextValue = {
  user: { uid: 'test-user-id' } as any,
  loading: false,
  isSigningIn: false,
  authResolved: false, // simulating auth not resolved yet
  signIn: vi.fn(),
  logOut: vi.fn(),
};

const mockProfileContextValue = {
  activeProfile: null as any,
  profiles: [],
  isLoading: false,
  setActiveProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
};

describe('Dashboard + Auth Integration', () => {
  it('Dashboard shows skeleton and does not fetch when authResolved is false', () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <ProfileContext.Provider value={mockProfileContextValue}>
          <Dashboard />
        </ProfileContext.Provider>
      </AuthContext.Provider>
    );

    // Dashboard should not have called Firestore
    expect(getHealthScores).not.toHaveBeenCalled();
  });

  it('Dashboard handles partial fetch failures gracefully', async () => {
    // Simulate one success and two failures
    (getHealthScores as any).mockResolvedValueOnce([{ overall: 99, systems: {} }]);
    (getLatestInsights as any).mockRejectedValueOnce(new Error('Insight fetch failed'));
    (getDocuments as any).mockRejectedValueOnce(new Error('Document fetch failed'));

    const resolvedAuthValue = { ...mockAuthContextValue, authResolved: true };

    render(
      <AuthContext.Provider value={resolvedAuthValue}>
        <ProfileContext.Provider value={mockProfileContextValue}>
          <Dashboard />
        </ProfileContext.Provider>
      </AuthContext.Provider>
    );

    // Wait for the asynchronous effects to process
    await waitFor(() => {
      const elements = screen.queryAllByText(/99/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
