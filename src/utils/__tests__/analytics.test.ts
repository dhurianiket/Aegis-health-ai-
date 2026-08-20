import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackPageView, trackEvent, getGtag, GA_MEASUREMENT_ID } from '../analytics';

describe('Google Analytics 4 & GTM SPA Tracker', () => {
  beforeEach(() => {
    delete (window as any).gtag;
    delete (window as any).dataLayer;
  });

  it('1. Initializes dataLayer and window.gtag safely', () => {
    const gtag = getGtag();
    expect(gtag).toBeDefined();
    expect(window.dataLayer).toBeDefined();
    expect(window.gtag).toBeDefined();
  });

  it('2. Tracks virtual SPA page views across route transitions', () => {
    trackPageView('/dashboard#reports', 'Aegis Health - Lab Reports');

    expect(window.dataLayer).toBeDefined();
    expect(window.dataLayer!.length).toBeGreaterThanOrEqual(3);

    // Verify GA4 config push
    const configCall = window.dataLayer!.find((item: any) => item[0] === 'config');
    expect(configCall).toBeDefined();
    expect(configCall[1]).toBe(GA_MEASUREMENT_ID);
    expect(configCall[2].page_path).toBe('/dashboard#reports');

    // Verify GA4 page_view event push
    const eventCall = window.dataLayer!.find((item: any) => item[0] === 'event' && item[1] === 'page_view');
    expect(eventCall).toBeDefined();
    expect(eventCall[2].page_path).toBe('/dashboard#reports');

    // Verify GTM dataLayer virtual pageview push
    const gtmCall = window.dataLayer!.find((item: any) => item.event === 'virtual_page_view');
    expect(gtmCall).toBeDefined();
    expect(gtmCall.page_path).toBe('/dashboard#reports');
  });

  it('3. Dispatches custom engagement events to GA4 and GTM', () => {
    trackEvent('upload_lab_report', 'Clinical', 'CBC_Panel.pdf', 1, { provider: 'Suburban' });

    const ga4Event = window.dataLayer!.find((item: any) => item[0] === 'event' && item[1] === 'upload_lab_report');
    expect(ga4Event).toBeDefined();
    expect(ga4Event[2].event_category).toBe('Clinical');

    const gtmEvent = window.dataLayer!.find((item: any) => item.event === 'upload_lab_report');
    expect(gtmEvent).toBeDefined();
    expect(gtmEvent.event_category).toBe('Clinical');
    expect(gtmEvent.provider).toBe('Suburban');
  });
});
