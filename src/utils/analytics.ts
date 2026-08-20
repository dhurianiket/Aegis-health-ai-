/**
 * Google Analytics 4 (GA4) & Google Tag Manager (GTM) Analytics Utility
 * Stream Name: aegis-web
 * Measurement ID: G-KKGF16H7CY
 */

export const GA_MEASUREMENT_ID = 'G-KKGF16H7CY';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Safely resolves or initializes the global gtag & dataLayer functions
 */
export function getGtag(): (...args: any[]) => void {
  if (typeof window === 'undefined') return () => {};
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

/**
 * Tracks Single Page Application (SPA) Page Views across route transitions
 */
export const trackPageView = (url: string, title?: string) => {
  try {
    const gtag = getGtag();
    const pageTitle = title || (typeof document !== 'undefined' ? document.title : 'Aegis Health AI');
    const fullLocation = typeof window !== 'undefined' ? window.location.href : url;

    // 1. GA4 Config Update
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_location: fullLocation,
      page_title: pageTitle,
    });

    // 2. GA4 Explicit page_view event
    gtag('event', 'page_view', {
      page_path: url,
      page_location: fullLocation,
      page_title: pageTitle,
    });

    // 3. GTM dataLayer Virtual Pageview Event
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'virtual_page_view',
        page_path: url,
        page_location: fullLocation,
        page_title: pageTitle,
      });
    }
  } catch (err) {
    console.warn('[Analytics] Page view tracking error:', err);
  }
};

/**
 * Tracks custom user engagement events (e.g. document uploads, specialist chat, ABDM link, FHIR export)
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number,
  customParams?: Record<string, any>
) => {
  try {
    const gtag = getGtag();
    const payload = {
      event_category: category,
      event_label: label,
      value: value,
      ...customParams,
    };

    gtag('event', action, payload);

    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: action,
        event_category: category,
        event_label: label,
        value: value,
        ...customParams,
      });
    }
  } catch (err) {
    console.warn('[Analytics] Event tracking error:', err);
  }
};
