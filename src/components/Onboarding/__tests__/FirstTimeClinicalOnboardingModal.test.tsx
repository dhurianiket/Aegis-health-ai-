import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FirstTimeClinicalOnboardingModal } from '../FirstTimeClinicalOnboardingModal';
import { Gender, UserProfile } from '../../../types/medical';

const mockUpdateProfile = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../context/ProfileContext', () => ({
  useProfile: () => ({
    updateProfile: mockUpdateProfile,
  }),
}));

vi.mock('../../../lib/firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      displayName: null,
    },
  },
}));

vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));

describe('FirstTimeClinicalOnboardingModal Test Suite', () => {
  const dummyProfile: UserProfile = {
    id: 'test-profile-1',
    userId: 'test-user-123',
    fullName: 'Myself',
    chronicConditions: [],
    allergies: [],
    createdAt: '2026-10-25T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Returns null and does not render when isOpen is false', () => {
    const { container } = render(
      <FirstTimeClinicalOnboardingModal isOpen={false} profile={dummyProfile} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('2. Renders clinical baseline form when isOpen is true', () => {
    render(
      <FirstTimeClinicalOnboardingModal isOpen={true} profile={dummyProfile} />
    );

    expect(screen.getByText('Complete Your Health Profile')).toBeDefined();
    expect(screen.getByLabelText(/Full Legal Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeDefined();
    expect(screen.getByText(/Biological Gender/i)).toBeDefined();
    expect(screen.getByLabelText(/Height/i)).toBeDefined();
    expect(screen.getByLabelText(/Weight/i)).toBeDefined();
  });

  it('3. Computes dynamic BMI live when height and weight are entered', () => {
    render(
      <FirstTimeClinicalOnboardingModal isOpen={true} profile={dummyProfile} />
    );

    const heightInput = screen.getByLabelText(/Height/i);
    const weightInput = screen.getByLabelText(/Weight/i);

    fireEvent.change(heightInput, { target: { value: '180' } });
    fireEvent.change(weightInput, { target: { value: '75' } });

    // BMI = 75 / (1.8^2) = 23.1
    expect(screen.getByText(/23\.1/)).toBeDefined();
    expect(screen.getByText(/Normal/)).toBeDefined();
  });

  it('4. Triggers DPDP Section 9 Guardian Consent fields when user is under 18', () => {
    render(
      <FirstTimeClinicalOnboardingModal isOpen={true} profile={dummyProfile} />
    );

    const dobInput = screen.getByLabelText(/Date of Birth/i);
    // 10 years old
    fireEvent.change(dobInput, { target: { value: '2016-01-01' } });

    expect(screen.getByText(/Paediatric Minor/i)).toBeDefined();
    expect(screen.getByText(/DPDP Act 2023 Section 9 Paediatric Consent/i)).toBeDefined();
    expect(screen.getByLabelText(/Guardian Name/i)).toBeDefined();
  });

  it('5. Successfully saves adult profile and triggers updateProfile', async () => {
    const onCompletedMock = vi.fn();
    render(
      <FirstTimeClinicalOnboardingModal
        isOpen={true}
        profile={dummyProfile}
        onCompleted={onCompletedMock}
      />
    );

    const nameInput = screen.getByLabelText(/Full Legal Name/i);
    const dobInput = screen.getByLabelText(/Date of Birth/i);
    const maleButton = screen.getByRole('button', { name: /^Male$/i });
    const heightInput = screen.getByLabelText(/Height/i);
    const weightInput = screen.getByLabelText(/Weight/i);
    const saveButton = screen.getByRole('button', { name: /Save Profile & Enter Workspace/i });

    fireEvent.change(nameInput, { target: { value: 'Aniket Dhuri' } });
    fireEvent.change(dobInput, { target: { value: '1998-05-15' } });
    fireEvent.click(maleButton);
    fireEvent.change(heightInput, { target: { value: '175' } });
    fireEvent.change(weightInput, { target: { value: '70' } });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith('test-profile-1', expect.objectContaining({
        fullName: 'Aniket Dhuri',
        dob: '1998-05-15',
        gender: Gender.MALE,
        height: 175,
        weight: 70,
      }));
      expect(onCompletedMock).toHaveBeenCalled();
    });
  });
});
