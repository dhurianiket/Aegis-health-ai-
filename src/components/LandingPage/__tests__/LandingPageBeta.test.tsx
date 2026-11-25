import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signIn: vi.fn(),
    logOut: vi.fn(),
    loading: false,
    isSigningIn: false,
  }),
}));

vi.mock('../../../lib/firebase/config', () => ({
  db: {},
  auth: {},
  storage: {},
}));

describe('LandingPage Early Access Beta & 3D Experience', () => {
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

  it('renders the 100% Free Open Platform Showcase in #pricing', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const pricingSection = container.querySelector('#pricing');
    expect(pricingSection).not.toBeNull();
    const pricing = within(pricingSection as HTMLElement);

    expect(pricing.getByText(/Production v2\.0 • 100% Free Open Access/i)).not.toBeNull();
    expect(pricing.getByText(/100% Free Open Access\./i)).not.toBeNull();

    expect(pricing.getByText(/Multimodal Lab AI/i)).not.toBeNull();
    expect(pricing.getByText(/Multi-Profile Vault/i)).not.toBeNull();
    expect(pricing.getByText(/10\+ AI Specialists/i)).not.toBeNull();

    expect(pricing.getByText(/Lab Report Vision Scans/i)).not.toBeNull();
    expect(pricing.getByText(/Automated SBAR Doctor Handover Reports/i)).not.toBeNull();
    expect(pricing.getByText(/Apple Health & Google Health Auto-Sync/i)).not.toBeNull();
    expect(pricing.getByText(/Drug-Lab Contraindication Matrix/i)).not.toBeNull();
    expect(pricing.getByText(/Open Platform Guarantee:/i)).not.toBeNull();

    const dashboardLinks = container.querySelectorAll('a[href="/dashboard"]');
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(4);
  });

  it('switches 3D hero clinical telemetry lenses cleanly without WebGL crashes', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const lensGroup = await screen.findByRole('group', { name: /Inspect 3D clinical telemetry lenses/i });
    expect(screen.getByText(/HbA1c Longitudinal Lens/i)).not.toBeNull();

    const armorBtn = within(lensGroup).getByRole('button', { name: 'Model Armor' });
    fireEvent.click(armorBtn);

    await waitFor(() => {
      expect(screen.getByText(/Model Armor Guard/i)).not.toBeNull();
      expect(screen.getByText(/Prompt Firewall Active/i)).not.toBeNull();
    });

    const fhirBtn = within(lensGroup).getByRole('button', { name: 'FHIR R4' });
    fireEvent.click(fhirBtn);

    await waitFor(() => {
      expect(screen.getByText('Cloud FHIR R4 Vault')).not.toBeNull();
      expect(screen.getByText('ABDM & Mumbai Sync')).not.toBeNull();
    });
  });

  it('renders Google Cloud capability cards and filters Polyclinic specialists cleanly', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const showcaseSection = container.querySelector('#features-showcase');
    expect(showcaseSection).not.toBeNull();
    const showcase = within(showcaseSection as HTMLElement);
    expect(showcase.getByText(/Model Armor & Mumbai FHIR R4/i)).not.toBeNull();
    expect(showcase.getByText(/Cloud HD Voice & Local AQI/i)).not.toBeNull();

    const specialistsSection = container.querySelector('#specialists');
    expect(specialistsSection).not.toBeNull();
    const specialists = within(specialistsSection as HTMLElement);

    fireEvent.click(specialists.getByRole('tab', { name: 'Cardiometabolic' }));
    expect(specialists.getByRole('button', { name: /AI Cardiologist/i })).not.toBeNull();
    expect(specialists.getByRole('button', { name: /AI Endocrinologist/i })).not.toBeNull();
    expect(specialists.queryByRole('button', { name: /AI Dermatologist/i })).toBeNull();
  });
});
