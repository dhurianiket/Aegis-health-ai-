/**
 * Cloudflare Turnstile token acquisition utility.
 * Loads the Turnstile script dynamically, executes the challenge,
 * and caches the token for AI edge proxy verification.
 */

import { setCachedTurnstileToken } from '../lib/turnstileTokenProvider';

export const TURNSTILE_SITE_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY) ||
  '0x4AAAAAAFA-TF6j3OO6uZY0';

let turnstileScriptLoaded = false;
let turnstileWidgetId: string | null = null;

export async function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return;
  if ((window as any).turnstile) {
    turnstileScriptLoaded = true;
    return;
  }

  const existing = document.querySelector('script[src*="turnstile/v0/api.js"]');
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener('load', () => {
        turnstileScriptLoaded = true;
        resolve();
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      turnstileScriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      console.warn('[Turnstile] Failed to load Turnstile script');
      reject(new Error('Turnstile script load error'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Ensures a headless container exists in document body for Turnstile challenges.
 */
function getOrCreateTurnstileContainer(): HTMLElement {
  let el = document.getElementById('aegis-turnstile-wrapper');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aegis-turnstile-wrapper';
    // Position offscreen so interactive challenges can display if needed, but invisible by default
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.right = '12px';
    el.style.zIndex = '99999';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Acquires a fresh single-use Turnstile token for a given action.
 */
export async function getTurnstileToken(action = 'ai_generate'): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    await loadTurnstileScript();
  } catch (err) {
    console.warn('[Turnstile] Script could not be loaded:', err);
    return null;
  }

  const turnstile = (window as any).turnstile;
  if (!turnstile) {
    console.warn('[Turnstile] turnstile global not available on window');
    return null;
  }

  return new Promise<string | null>((resolve) => {
    try {
      const container = getOrCreateTurnstileContainer();

      // If a widget was already rendered, reset it or remove it
      if (turnstileWidgetId) {
        try {
          turnstile.reset(turnstileWidgetId);
        } catch {
          try {
            turnstile.remove(turnstileWidgetId);
          } catch {}
          turnstileWidgetId = null;
        }
      }

      if (!turnstileWidgetId) {
        turnstileWidgetId = turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: 'dark',
          size: 'flexible',
          callback: (token: string) => {
            setCachedTurnstileToken(token);
            resolve(token);
          },
          'error-callback': (err: any) => {
            console.warn('[Turnstile] Verification error callback:', err);
            resolve(null);
          },
          'expired-callback': () => {
            setCachedTurnstileToken(null);
            resolve(null);
          },
        });
      } else {
        // Retrieve existing token if valid
        const currentToken = turnstile.getResponse(turnstileWidgetId);
        if (currentToken) {
          setCachedTurnstileToken(currentToken);
          resolve(currentToken);
        }
      }

      // Safety timeout: don't hang requests indefinitely if user is offline
      setTimeout(() => {
        const timeoutToken = turnstileWidgetId
          ? turnstile.getResponse(turnstileWidgetId)
          : null;
        if (timeoutToken) {
          setCachedTurnstileToken(timeoutToken);
          resolve(timeoutToken);
        } else {
          resolve(null);
        }
      }, 7000);
    } catch (renderError) {
      console.warn('[Turnstile] Execution exception:', renderError);
      resolve(null);
    }
  });
}
