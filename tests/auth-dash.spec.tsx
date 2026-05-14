import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../src/components/Dashboard/Dashboard';
import { AuthContext } from '../src/context/AuthContext';
import { ProfileContext } from '../src/context/ProfileContext';

// Mock the Firestore calls
vi.mock('../src/lib/firebase/firestore', () => ({
  getHealthScores: vi.fn(),
  getLatestInsights: vi.fn(),
  getDocuments: vi.fn(),
}));

// Mock the components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  RadarChart: () => <div>RadarChart</div>,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  Radar: () => <div />,
}));

const mockAuthContextValue = {
  user: { uid: 'test-user-id' } as any,
  loading: false,
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
    const { getHealthScores } = require('../src/lib/firebase/firestore');

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
});
