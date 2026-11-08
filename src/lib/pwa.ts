/**
 * PWA Service Worker Registration & Installation Utilities
 */

export function registerServiceWorker(): void {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Listen for updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.dispatchEvent(new CustomEvent('aegis:pwa-update-available'));
                }
              };
            }
          };
        })
        .catch((error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[PWA] Service Worker registration failed:', error);
          }
        });
    });
  }
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hasMatchMedia = typeof window.matchMedia === 'function';
  const matchesStandalone = hasMatchMedia
    ? Boolean(window.matchMedia('(display-mode: standalone)')?.matches)
    : false;

  const navigatorStandalone = Boolean(
    (window.navigator as unknown as { standalone?: boolean })?.standalone
  );

  const androidReferrer = Boolean(
    typeof document !== 'undefined' &&
    document.referrer &&
    document.referrer.includes('android-app://')
  );

  return matchesStandalone || navigatorStandalone || androidReferrer;
}

export function isIOS(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent?.toLowerCase() || '';
  return /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown })?.MSStream;
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || '';
  return /android/i.test(ua);
}
