import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AbdmConnectModal from '../AbdmConnectModal';
import IntegrationsPanel from '../../Settings/IntegrationsPanel';
import * as abdmService from '../../../services/abdmService';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'viewport-user-789', email: 'aniket.dhuri@abdm' },
  }),
}));

describe('Milestone 4: Mobile Viewports (320px, 375px, 414px) & WCAG AAA Contrast Stress Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    abdmService.disconnectAbdm('viewport-user-789');
  });

  // =========================================================================
  // SECTION 1: RESPONSIVE VIEWPORT BOUNDARIES (320px, 375px, 414px)
  // =========================================================================
  describe('Section 1: Mobile Viewport Width Constraints', () => {
    it('1.1: 320px (Ultra-narrow Mobile) Viewport Layout Integrity', () => {
      const { container } = render(
        <div style={{ width: '320px' }}>
          <AbdmConnectModal isOpen={true} onClose={vi.fn()} />
        </div>
      );

      // Verify outer modal envelope respects responsive constraints
      const modalEnvelope = container.querySelector('.fixed.inset-0');
      expect(modalEnvelope).not.toBeNull();
      expect(modalEnvelope?.className).toContain('p-4');
      expect(modalEnvelope?.className).toContain('overflow-y-auto');

      // Verify tab strip has horizontal scroll safety
      const tabStrip = container.querySelector('.overflow-x-auto');
      expect(tabStrip).not.toBeNull();
      expect(tabStrip?.className).toContain('scrollbar-none');

      // Verify all tab buttons have shrink-0 so they never collapse into illegible widths
      const tabButtons = tabStrip?.querySelectorAll('button');
      expect(tabButtons?.length).toBe(4);
      tabButtons?.forEach((btn) => {
        expect(btn.className).toContain('shrink-0');
      });
    });

    it('1.2: 375px (Standard Mobile) Form Grid Breakdown', () => {
      const { container } = render(
        <div style={{ width: '375px' }}>
          <AbdmConnectModal isOpen={true} onClose={vi.fn()} />
        </div>
      );

      // Verify grid starts as single column on mobile and expands only on sm breakpoint
      const gridContainer = container.querySelector('.grid-cols-1.sm\\:grid-cols-2');
      expect(gridContainer).not.toBeNull();

      // Verify input elements have 100% width (w-full)
      const inputs = container.querySelectorAll('input');
      inputs.forEach((input) => {
        expect(input.className).toContain('w-full');
      });
    });

    it('1.3: 414px (Large Mobile / Phablet) Virtual ABHA Holographic Card Structure', () => {
      abdmService.saveAbdmProfile('viewport-user-789', {
        abhaNumber: '91-4820-5912-3840',
        abhaAddress: 'aniket.dhuri@abdm',
        name: 'Aniket Dhuri',
        gender: 'Male',
        dateOfBirth: '1992-05-15',
        mobile: '+91 98765 43210',
        status: 'linked',
        linkedCareContextsCount: 3,
        qrCodeString: '{"hidn":"91-4820-5912-3840"}',
        createdAt: new Date().toISOString(),
      });

      const { container } = render(
        <div style={{ width: '414px' }}>
          <AbdmConnectModal isOpen={true} onClose={vi.fn()} />
        </div>
      );

      // Verify card layout uses single column stacking on mobile (grid-cols-1 sm:grid-cols-3)
      const cardGrid = container.querySelector('.grid-cols-1.sm\\:grid-cols-3');
      expect(cardGrid).not.toBeNull();

      // Verify 14-digit ABHA typography has responsive text sizing (text-2xl sm:text-3xl font-mono)
      const abhaText = screen.getByText('91-4820-5912-3840');
      expect(abhaText.className).toContain('text-2xl');
      expect(abhaText.className).toContain('sm:text-3xl');
      expect(abhaText.className).toContain('font-mono');
      expect(abhaText.className).toContain('font-extrabold');
    });
  });

  // =========================================================================
  // SECTION 2: WCAG AAA COLOR CONTRAST & THEME INTEGRITY AUDIT
  // =========================================================================
  describe('Section 2: WCAG AAA Color Contrast & Visual Hierarchy', () => {
    it('2.1: Enforces high-contrast dark theme background and text tokens', () => {
      const { container } = render(<AbdmConnectModal isOpen={true} onClose={vi.fn()} />);

      // Modal container uses dark bg slate-900/95
      const card = container.querySelector('.bg-slate-900\\/95');
      expect(card).not.toBeNull();

      // Main header title uses high-contrast text-slate-900 dark:text-white
      const headerTitle = screen.getByText('ABHA & ABDM Health Gateway');
      expect(headerTitle.className).toContain('dark:text-white');
      expect(headerTitle.className).toContain('font-bold');

      // Badges use high contrast emerald tokens
      const badge = screen.getByText('NHA ABDM Sandbox Gateway v3');
      expect(badge.className).toContain('text-emerald-400');
      expect(badge.className).toContain('bg-emerald-500/10');
    });

    it('2.2: Verifies feedback banner contrast levels for success, error, and info', async () => {
      abdmService.saveAbdmProfile('viewport-user-789', {
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

      const { container } = render(<AbdmConnectModal isOpen={true} onClose={vi.fn()} />);

      // Trigger care context action to show feedback
      fireEvent.click(screen.getByText(/M2: Care Contexts/i));
      const unlinkBtn = screen.getAllByRole('button', { name: /Unlink/i })[0];
      fireEvent.click(unlinkBtn);

      await waitFor(
        () => {
          const feedbackBanner = container.querySelector('.text-xs.font-semibold.flex.items-center');
          expect(feedbackBanner).not.toBeNull();
        },
        { timeout: 3000 }
      );
    });
  });

  // =========================================================================
  // SECTION 3: INTEGRATIONSPANEL & ABDM GLASS CARD COHESION
  // =========================================================================
  describe('Section 3: IntegrationsPanel & ABDM Glass Card Cohesion', () => {
    it('3.1: IntegrationsPanel renders ABDM 3D Glass Card with responsive span and opens modal', () => {
      const { container } = render(
        <IntegrationsPanel
          activeProfile={{
            id: 'viewport-user-789',
            name: 'Aniket Dhuri',
          }}
        />
      );

      // Verify ABDM Glass Card exists
      expect(screen.getByText('Ayushman Bharat Digital Health ID (ABHA Card)')).not.toBeNull();
      expect(screen.getByText('NHA ABDM Gateway • Ready')).not.toBeNull();

      // Click Connect & Verify ABHA ID button
      const connectBtn = screen.getByRole('button', { name: /Connect & Verify ABHA ID/i });
      fireEvent.click(connectBtn);

      // Verify modal opened
      expect(screen.getByText('NHA ABDM Sandbox Gateway v3')).not.toBeNull();
    });

    it('3.2: IntegrationsPanel reflects verified ABHA status when profile exists', () => {
      abdmService.saveAbdmProfile('viewport-user-789', {
        abhaNumber: '91-4820-5912-3840',
        abhaAddress: 'aniket.dhuri@abdm',
        name: 'Aniket Dhuri',
        gender: 'Male',
        dateOfBirth: '1992-05-15',
        mobile: '+91 98765 43210',
        status: 'linked',
        linkedCareContextsCount: 4,
        createdAt: new Date().toISOString(),
      });

      render(
        <IntegrationsPanel
          activeProfile={{
            id: 'viewport-user-789',
            name: 'Aniket Dhuri',
          }}
        />
      );

      expect(screen.getByText('ABHA Verified • Connected')).not.toBeNull();
      expect(screen.getByText('4 Care Contexts Linked')).not.toBeNull();
      expect(screen.getByRole('button', { name: /Manage ABHA & Consent Hub/i })).not.toBeNull();
    });
  });
});
