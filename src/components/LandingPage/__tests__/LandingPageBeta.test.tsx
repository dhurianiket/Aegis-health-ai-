import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signIn: vi.fn(),
    logOut: vi.fn(),
    loading: false,
  }),
}));

vi.mock('../../lib/firebase/config', () => ({
  db: {},
  auth: {},
  storage: {},
}));

describe('LandingPage Early Access Beta Showcase', () => {
  const originalIntersectionObserver = global.IntersectionObserver;

  beforeAll(() => {
    global.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  afterAll(() => {
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it('renders the 100% Free Early Access Beta Showcase in #pricing', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const pricingSection = container.querySelector('#pricing');
    expect(pricingSection).not.toBeNull();
    const pricing = within(pricingSection as HTMLElement);

    // Verify Early Access Beta banner & header
    expect(pricing.getByText(/Early Access Beta Program • 100% Free Access/i)).not.toBeNull();
    expect(pricing.getByText(/100% Free in Beta/i)).not.toBeNull();

    // Verify Clinical Intelligence, Multi-Profile Vault, and Specialist Lounge cards
    expect(pricing.getByText(/Multimodal Lab AI/i)).not.toBeNull();
    expect(pricing.getByText(/Multi-Profile Vault/i)).not.toBeNull();
    expect(pricing.getByText(/10\+ AI Specialists/i)).not.toBeNull();

    // Verify communicated free benefits
    expect(pricing.getByText(/Lab Report Vision Scans/i)).not.toBeNull();
    expect(pricing.getByText(/Automated SBAR Doctor Handover Reports/i)).not.toBeNull();
    expect(pricing.getByText(/Apple Health & Google Health Auto-Sync/i)).not.toBeNull();
    expect(pricing.getByText(/Drug-Lab Contraindication Matrix/i)).not.toBeNull();
    expect(pricing.getByText(/Early Access Guarantee:/i)).not.toBeNull();

    // Verify navigation and footer anchor links to #pricing
    const pricingLinks = container.querySelectorAll('a[href="#pricing"]');
    expect(pricingLinks.length).toBeGreaterThanOrEqual(2);
  });
});
