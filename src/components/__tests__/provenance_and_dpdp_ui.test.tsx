import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AbdmConnectModal from '../ABDM/AbdmConnectModal';
import ProfileManagement from '../Profile/ProfileManagement';
import * as abdmService from '../../services/abdmService';

// Mock ResizeObserver for AutoSizeTextarea in JSDOM
global.ResizeObserver = class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
} as any;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'ui-test-user-999', email: 'user@aegishealth.ai' },
  }),
}));

const mockUpdateProfile = vi.fn();
const mockCreateProfile = vi.fn();
const mockDeleteProfile = vi.fn();

vi.mock('../../context/ProfileContext', () => ({
  useProfile: () => ({
    profiles: [
      {
        id: 'prof-adult-1',
        name: 'Adult User',
        fullName: 'Adult User',
        dob: '1990-01-01',
        gender: 'male',
        bloodType: 'O+',
        chronicConditions: [],
        allergies: [],
      },
      {
        id: 'prof-child-2',
        name: 'Aarav Sharma',
        fullName: 'Aarav Sharma',
        dob: '2016-05-15',
        gender: 'male',
        bloodType: 'B+',
        chronicConditions: [],
        allergies: [],
        paediatricConsent: {
          isMinor: true,
          guardianName: 'Ramesh Sharma',
          guardianRelationship: 'Parent',
          guardianConsentGiven: true,
          guardianConsentId: 'DPDP-SEC9-MOCK-1234',
          strictNoAiTraining: true,
          noBehavioralTracking: true,
          dataRetentionPolicy: '72h_erasure_on_demand',
        },
      },
    ],
    activeProfile: {
      id: 'prof-adult-1',
      name: 'Adult User',
      fullName: 'Adult User',
      dob: '1990-01-01',
      gender: 'male',
      bloodType: 'O+',
      chronicConditions: [],
      allergies: [],
    },
    setActiveProfile: vi.fn(),
    createProfile: mockCreateProfile,
    updateProfile: mockUpdateProfile,
    deleteProfile: mockDeleteProfile,
    isLoading: false,
  }),
}));

describe('Provenance Receipt & DPDP Paediatric Privacy UI Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('1. ABDM Modal Provenance Receipt Card', () => {
    it('should render Zero Ambient Ingestion banner on M2 Care Contexts tab', async () => {
      abdmService.saveAbdmProfile('ui-test-user-999', {
        abhaNumber: '91-1111-2222-3333',
        abhaAddress: 'test.user@abdm',
        name: 'Test User',
        gender: 'Male',
        dateOfBirth: '1995-01-01',
        mobile: '+919876543210',
        status: 'verified',
        linkedCareContextsCount: 1,
        createdAt: '2026-08-01T10:00:00Z',
      });

      render(<AbdmConnectModal isOpen={true} onClose={vi.fn()} />);

      // Navigate to M2 tab
      const m2Tab = screen.getByRole('button', { name: /M2: Care Contexts/i });
      fireEvent.click(m2Tab);

      // Verify Trust Banner
      expect(
        screen.getByText(/Zero Ambient Ingestion & DPDP Act 2023 Provenance/i)
      ).toBeDefined();
      expect(
        screen.getByText(/Aegis never performs background hospital scraping/i)
      ).toBeDefined();
    });

    it('should open Data Provenance Receipt modal when clicking Provenance Receipt button', async () => {
      abdmService.saveAbdmProfile('ui-test-user-999', {
        abhaNumber: '91-1111-2222-3333',
        abhaAddress: 'test.user@abdm',
        name: 'Test User',
        gender: 'Male',
        dateOfBirth: '1995-01-01',
        mobile: '+919876543210',
        status: 'verified',
        linkedCareContextsCount: 1,
        createdAt: '2026-08-01T10:00:00Z',
      });

      abdmService.saveLinkedCareContexts('ui-test-user-999', [
        {
          referenceNumber: 'HIP-AEGIS-LAB-2026-001',
          display: 'Complete Blood Count (CBC) & Lipid Profile — Suburban Diagnostics',
          type: 'LabReport',
          date: '2026-08-15T09:30:00.000Z',
          hipId: 'IN2710001824',
          hipName: 'Aegis Health Intelligence Clinic (HIP)',
          status: 'linked',
          recordCount: 8,
        },
      ]);

      render(<AbdmConnectModal isOpen={true} onClose={vi.fn()} />);

      const m2Tab = screen.getByRole('button', { name: /M2: Care Contexts/i });
      fireEvent.click(m2Tab);

      // Find Provenance Receipt button and click
      const receiptButtons = screen.getAllByRole('button', { name: /Provenance Receipt/i });
      expect(receiptButtons.length).toBeGreaterThan(0);
      fireEvent.click(receiptButtons[0]);

      // Verify Receipt Modal opens
      await waitFor(() => {
        expect(screen.getByText(/Data Provenance Receipt/i)).toBeDefined();
        expect(screen.getByText(/ABDM Sandbox v3 & DPDP Act 2023 Statutory Audit Trail/i)).toBeDefined();
        expect(screen.getByText(/test.user@abdm/i)).toBeDefined();
        expect(screen.getByText(/Zero AI Retention:/i)).toBeDefined();
        expect(screen.getByText(/Anti-Surveillance Guarantee:/i)).toBeDefined();
      });
    });
  });

  describe('2. Profile Management DPDP Paediatric Privacy Mode', () => {
    it('should display DPDP Paediatric Protected badge for minor profiles in card view', () => {
      render(<ProfileManagement />);

      expect(screen.getByText(/DPDP Paediatric Protected/i)).toBeDefined();
      expect(screen.getByText(/Guardian:/i)).toBeDefined();
      expect(screen.getByText(/Ramesh Sharma/i)).toBeDefined();
    });

    it('should dynamically reveal DPDP Section 9 guardrail when editing DOB to a minor date', async () => {
      render(<ProfileManagement />);

      // Click edit on the first profile
      const editButtons = screen.getAllByLabelText('Edit Profile');
      fireEvent.click(editButtons[0]);

      // Change DOB to a child's birth date (e.g., 2018-05-10)
      const dobInput = screen.getByDisplayValue('1990-01-01');
      fireEvent.change(dobInput, { target: { value: '2018-05-10' } });

      // DPDP guardrail section should appear immediately
      await waitFor(() => {
        expect(
          screen.getByText(/DPDP Act 2023 Section 9 — Paediatric Privacy Guardrail/i)
        ).toBeDefined();
        expect(
          screen.getByText(/Parent \/ Lawful Guardian Full Name \*/i)
        ).toBeDefined();
        expect(
          screen.getByText(/Zero AI Training: Never ingested for machine learning/i)
        ).toBeDefined();
      });
    });
  });
});
