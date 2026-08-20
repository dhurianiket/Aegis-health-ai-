import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AbdmConnectModal from '../AbdmConnectModal';
import * as abdmService from '../../../services/abdmService';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-abdm-456', email: 'test@aegishealth.ai' },
  }),
}));

describe('AbdmConnectModal Component Stress & Glassmorphic UI Suite', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    abdmService.disconnectAbdm('test-user-abdm-456');
  });

  // =========================================================================
  // SECTION 1: MODAL LIFECYCLE & 3D GLASSMORPHIC TOKEN AUDIT
  // =========================================================================
  describe('Section 1: Modal Rendering & 3D Glassmorphism Token Audit', () => {
    it('1.1: Does not render DOM nodes when isOpen is false', () => {
      const { container } = render(
        <AbdmConnectModal isOpen={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('1.2: Enforces ultra-premium 3D glassmorphic shell styling on bg backdrop and container', () => {
      const { container } = render(
        <AbdmConnectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Outer Backdrop
      const backdrop = container.querySelector('.fixed.inset-0');
      expect(backdrop).not.toBeNull();
      expect(backdrop?.className).toContain('bg-slate-950/80');
      expect(backdrop?.className).toContain('backdrop-blur-xl');

      // 3D Glass Card Container
      const modalCard = container.querySelector('.bg-slate-900\\/95');
      expect(modalCard).not.toBeNull();
      expect(modalCard?.className).toContain('border-white/10');
      expect(modalCard?.className).toContain('rounded-3xl');
      expect(modalCard?.className).toContain('max-h-[92vh]');
    });

    it('1.3: Verifies NHA ABDM Sandbox Gateway branding header and close action', () => {
      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('NHA ABDM Sandbox Gateway v3')).not.toBeNull();
      expect(screen.getByText('ABHA & ABDM Health Gateway')).not.toBeNull();

      const closeButtons = screen.getAllByRole('button');
      const closeTopBtn = closeButtons.find((b) => b.querySelector('svg.lucide-x'));
      expect(closeTopBtn).toBeDefined();

      fireEvent.click(closeTopBtn!);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // SECTION 2: TAB NAVIGATION & MOBILE VIEWPORT RESILIENCE
  // =========================================================================
  describe('Section 2: Tab Navigation & Mobile Viewport Layout Resilience', () => {
    it('2.1: Renders horizontal scroll-safe tab bar with all 4 milestone tabs', () => {
      const { container } = render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);

      const tabContainer = container.querySelector('.overflow-x-auto');
      expect(tabContainer).not.toBeNull();

      expect(screen.getByText(/M1: ABHA Profile/i)).not.toBeNull();
      expect(screen.getByText(/M2: Care Contexts/i)).not.toBeNull();
      expect(screen.getByText(/M3: Consent Manager/i)).not.toBeNull();
      expect(screen.getByText(/M3: Encrypted Exchange/i)).not.toBeNull();
    });

    it('2.2: Switches across all 4 tabs seamlessly without layout crashes', async () => {
      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);

      // Switch to M2
      fireEvent.click(screen.getByText(/M2: Care Contexts/i));
      expect(screen.getByText('ABDM Care-Context Discovery & Linking')).not.toBeNull();

      // Switch to M3 Consent
      fireEvent.click(screen.getByText(/M3: Consent Manager/i));
      expect(screen.getByText('ABDM Digital Consent Manager')).not.toBeNull();

      // Switch to M3 Transfer
      fireEvent.click(screen.getByText(/M3: Encrypted Exchange/i));
      expect(screen.getByText('ABDM Encrypted FHIR R4 Data Exchange Simulator')).not.toBeNull();

      // Switch back to M1 Profile
      fireEvent.click(screen.getByText(/M1: ABHA Profile/i));
      expect(screen.getByText(/Create or Link Your ABHA Number|AYUSHMAN BHARAT HEALTH ACCOUNT/i)).not.toBeNull();
    });
  });

  // =========================================================================
  // SECTION 3: M1 AUTH FLOW & 3D HOLOGRAPHIC ABHA CARD
  // =========================================================================
  describe('Section 3: M1 Registration Wizard & Virtual ABHA Card Interaction', () => {
    it('3.1: Allows switching auth modes (Mobile OTP vs Aadhaar OTP) and autofilling credentials', () => {
      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);

      const aadhaarBtn = screen.getByText('Aadhaar OTP');
      fireEvent.click(aadhaarBtn);
      expect(screen.getByText('12-Digit Aadhaar Number')).not.toBeNull();

      const mobileBtn = screen.getByText('Mobile OTP');
      fireEvent.click(mobileBtn);
      expect(screen.getByText('10-Digit Mobile Number')).not.toBeNull();

      // Click Fill Demo Credentials
      const fillDemoBtn = screen.getByText(/Fill Demo Credentials/i);
      fireEvent.click(fillDemoBtn);
    });

    it('3.2: Executes full OTP request and verification to render 3D Holographic ABHA Card', async () => {
      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // 1. Submit Request OTP
      const requestOtpBtn = screen.getByText('Request ABDM OTP');
      fireEvent.click(requestOtpBtn);

      await waitFor(
        () => {
          expect(screen.getByText(/Enter 6-Digit ABDM Verification OTP/i)).not.toBeNull();
        },
        { timeout: 3000 }
      );

      // Fill OTP
      const autoFillBtn = screen.getByText(/Auto-Fill Demo OTP/i);
      fireEvent.click(autoFillBtn);

      // 2. Submit Confirm OTP
      const verifyBtn = screen.getByText(/Verify OTP & Link ABHA/i);
      fireEvent.click(verifyBtn);

      await waitFor(
        () => {
          expect(screen.getByText('AYUSHMAN BHARAT HEALTH ACCOUNT (ABHA)')).not.toBeNull();
          expect(screen.getByText('Verified Active')).not.toBeNull();
          expect(screen.getByText('Disconnect ABHA')).not.toBeNull();
        },
        { timeout: 3000 }
      );

      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('3.3: Disconnects ABHA and returns to unlinked registration wizard', async () => {
      abdmService.saveAbdmProfile('test-user-abdm-456', {
        abhaNumber: '91-4820-5912-3840',
        abhaAddress: 'aniket.dhuri@abdm',
        name: 'Aniket Dhuri',
        gender: 'Male',
        dateOfBirth: '1992-05-15',
        mobile: '+91 98765 43210',
        status: 'linked',
        linkedCareContextsCount: 3,
        createdAt: new Date().toISOString(),
      });

      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('AYUSHMAN BHARAT HEALTH ACCOUNT (ABHA)')).not.toBeNull();

      const disconnectBtn = screen.getByText('Disconnect ABHA');
      fireEvent.click(disconnectBtn);

      await waitFor(
        () => {
          expect(screen.getByText('Create or Link Your ABHA Number')).not.toBeNull();
        },
        { timeout: 3000 }
      );
    });
  });

  // =========================================================================
  // SECTION 4: M2 CARE CONTEXTS TOGGLING & BATCH LINKING
  // =========================================================================
  describe('Section 4: M2 Care Contexts Interactive Operations', () => {
    it('4.1: Toggles link / unlink state on individual Care Contexts', async () => {
      abdmService.saveAbdmProfile('test-user-abdm-456', {
        abhaNumber: '91-4820-5912-3840',
        abhaAddress: 'aniket.dhuri@abdm',
        name: 'Aniket Dhuri',
        gender: 'Male',
        dateOfBirth: '1992-05-15',
        mobile: '+91 98765 43210',
        status: 'linked',
        linkedCareContextsCount: 3,
        createdAt: new Date().toISOString(),
      });

      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText(/M2: Care Contexts/i));

      const unlinkButtons = screen.getAllByRole('button', { name: /Unlink/i });
      expect(unlinkButtons.length).toBeGreaterThan(0);

      fireEvent.click(unlinkButtons[0]);

      await waitFor(
        () => {
          expect(screen.getByText(/Unlinked care context/i)).not.toBeNull();
        },
        { timeout: 3000 }
      );
    });

    it('4.2: Triggers Batch Link All Active Records action', async () => {
      abdmService.saveAbdmProfile('test-user-abdm-456', {
        abhaNumber: '91-4820-5912-3840',
        abhaAddress: 'aniket.dhuri@abdm',
        name: 'Aniket Dhuri',
        gender: 'Male',
        dateOfBirth: '1992-05-15',
        mobile: '+91 98765 43210',
        status: 'linked',
        linkedCareContextsCount: 3,
        createdAt: new Date().toISOString(),
      });

      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText(/M2: Care Contexts/i));

      const linkAllBtn = screen.getByRole('button', { name: /Link All Active Records/i });
      fireEvent.click(linkAllBtn);

      await waitFor(
        () => {
          expect(screen.getByText(/Care Contexts successfully linked to ABHA/i)).not.toBeNull();
        },
        { timeout: 3000 }
      );
    });
  });

  // =========================================================================
  // SECTION 5: M3 CONSENT ACTIONS & ENCRYPTED EXCHANGE SIMULATION
  // =========================================================================
  describe('Section 5: M3 Consent Lifecycle & Live Encrypted Exchange Simulation', () => {
    it('5.1: Approves consent request with digital signature and inspects active artifact', async () => {
      abdmService.saveConsentRequests('test-user-abdm-456', [
        {
          id: 'CR-TEST-9481',
          patientAbha: 'aniket.dhuri@abdm',
          purpose: { code: 'CAREMGT', text: 'Care Management Review' },
          hiu: { id: 'HIU-APOLLO-001', name: 'Apollo Telehealth' },
          hip: { id: 'HIP-AEGIS-001', name: 'Aegis Health' },
          hiTypes: ['DiagnosticReport'],
          permission: {
            accessMode: 'VIEW',
            dateRange: { from: '2026-01-01T00:00:00Z', to: '2026-08-20T00:00:00Z' },
            dataEraseAt: '2026-09-20T00:00:00Z',
            frequency: { unit: 'HOUR', value: 1, repeats: 0 },
          },
          requester: { name: 'Dr. Priya Nambiar', designation: 'Cardiologist' },
          status: 'REQUESTED',
          createdAt: '2026-08-19T10:30:00Z',
          lastUpdated: '2026-08-19T10:30:00Z',
        },
      ]);

      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText(/M3: Consent Manager/i));

      const approveBtn = screen.getByRole('button', { name: /Approve with Digital Signature/i });
      fireEvent.click(approveBtn);

      await waitFor(
        () => {
          expect(screen.getByText(/approved with SHA256withECDSA digital signature/i)).not.toBeNull();
          expect(screen.getByText(/Active Consent Artifact/i)).not.toBeNull();
        },
        { timeout: 3000 }
      );
    });

    it('5.2: Denies and Revokes consent requests gracefully', async () => {
      abdmService.saveConsentRequests('test-user-abdm-456', [
        {
          id: 'CR-TEST-DENY-1',
          patientAbha: 'aniket.dhuri@abdm',
          purpose: { code: 'CAREMGT', text: 'Specialist Review' },
          hiu: { id: 'HIU-MAX-002', name: 'Max Hospital' },
          hip: { id: 'HIP-AEGIS-001', name: 'Aegis Health' },
          hiTypes: ['DiagnosticReport'],
          permission: {
            accessMode: 'VIEW',
            dateRange: { from: '2026-01-01T00:00:00Z', to: '2026-08-20T00:00:00Z' },
            dataEraseAt: '2026-09-20T00:00:00Z',
            frequency: { unit: 'HOUR', value: 1, repeats: 0 },
          },
          requester: { name: 'Dr. Rajesh', designation: 'Physician' },
          status: 'REQUESTED',
          createdAt: '2026-08-19T10:30:00Z',
          lastUpdated: '2026-08-19T10:30:00Z',
        },
      ]);

      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText(/M3: Consent Manager/i));

      const denyBtn = screen.getByRole('button', { name: /Deny/i });
      fireEvent.click(denyBtn);

      await waitFor(
        () => {
          expect(screen.getByText(/Consent request CR-TEST-DENY-1 denied/i)).not.toBeNull();
        },
        { timeout: 4000 }
      );
    });

    it('5.3: Executes 4-step Encrypted FHIR Exchange Simulation and displays decrypted envelope', async () => {
      render(<AbdmConnectModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.click(screen.getByText(/M3: Encrypted Exchange/i));

      const executeBtn = screen.getByRole('button', { name: /Execute Encrypted Exchange/i });
      fireEvent.click(executeBtn);

      // Wait for 4-step simulation to complete
      await waitFor(
        () => {
          expect(screen.getByText(/Exchange Envelope: TXN-EHR-TRANSFER-/i)).not.toBeNull();
          expect(screen.getByText(/Live Decrypted FHIR R4 Bundle/i)).not.toBeNull();
        },
        { timeout: 6000 }
      );
    });
  });
});
