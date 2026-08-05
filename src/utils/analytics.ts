/**
 * Google Analytics 4 (GA4) Analytics Utility
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
 * Tracks SPA Page Views across route transitions
 */
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title || document.title,
    });
  }
};

/**
 * Tracks custom events (e.g. document uploads, specialist chat, SBAR exports)
 */
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
