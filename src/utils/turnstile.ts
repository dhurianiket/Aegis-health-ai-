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

const CONTAINER_ID = 'aegis-turnstile-wrapper';
/** Non-interactive challenges normally resolve in 1-3 s. */
const NON_INTERACTIVE_TIMEOUT_MS = 10000;
/** If Cloudflare asks the user to interact, give them time to do so. */
const INTERACTIVE_TIMEOUT_MS = 120000;

let inFlight: Promise<string | null> | null = null;

/**
 * Creates the (initially hidden) container used for Turnstile challenges.
 *
 * The widget is rendered with `appearance: 'interaction-only'`, so Cloudflare
 * only paints it if the visitor must interact. The container is additionally
 * kept `display:none` until `before-interactive-callback` fires, so an idle or
 * already-passed widget can never sit on top of the UI (e.g. the bottom nav).
 */
function createTurnstileContainer(): HTMLElement {
  document.getElementById(CONTAINER_ID)?.remove();
  const el = document.createElement('div');
  el.id = CONTAINER_ID;
  el.setAttribute('aria-live', 'polite');
  el.style.position = 'fixed';
  el.style.left = '50%';
  el.style.top = '50%';
  el.style.transform = 'translate(-50%, -50%)';
  el.style.zIndex = '99999';
  el.style.display = 'none';
  document.body.appendChild(el);
  return el;
}

function showContainer(): void {
  const el = document.getElementById(CONTAINER_ID);
  if (el) el.style.display = 'block';
}

/**
 * Removes the widget iframe and its container from the DOM.
 * Tokens are single-use, so every acquisition renders a fresh widget.
 */
function teardownWidget(turnstile: any): void {
  if (turnstileWidgetId) {
    try {
      turnstile?.remove(turnstileWidgetId);
    } catch {
      /* widget already gone */
    }
    turnstileWidgetId = null;
  }
  document.getElementById(CONTAINER_ID)?.remove();
}

/**
 * Acquires a fresh single-use Turnstile token for a given action.
 * Concurrent callers share the same in-flight challenge.
 */
export async function getTurnstileToken(action = 'ai_generate'): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (inFlight) return inFlight;

  inFlight = acquireTurnstileToken(action).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function acquireTurnstileToken(action: string): Promise<string | null> {
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

  // Never reuse a previous widget: tokens are single-use.
  teardownWidget(turnstile);

  return new Promise<string | null>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = (token: string | null) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      teardownWidget(turnstile);
      resolve(token);
    };

    const armTimeout = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        let late: string | null = null;
        try {
          late = turnstileWidgetId ? turnstile.getResponse(turnstileWidgetId) || null : null;
        } catch {
          late = null;
        }
        if (late) setCachedTurnstileToken(late);
        finish(late);
      }, ms);
    };

    try {
      const container = createTurnstileContainer();
      turnstileWidgetId = turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        theme: 'dark',
        size: 'flexible',
        appearance: 'interaction-only',
        'refresh-expired': 'manual',
        callback: (token: string) => {
          setCachedTurnstileToken(token);
          finish(token);
        },
        'before-interactive-callback': () => {
          showContainer();
          armTimeout(INTERACTIVE_TIMEOUT_MS);
        },
        'error-callback': (err: any) => {
          console.warn('[Turnstile] Verification error callback:', err);
          setCachedTurnstileToken(null);
          finish(null);
          // Returning true tells Turnstile we handled the error.
          return true;
        },
        'expired-callback': () => {
          setCachedTurnstileToken(null);
          finish(null);
        },
        'timeout-callback': () => {
          setCachedTurnstileToken(null);
          finish(null);
        },
      });
      armTimeout(NON_INTERACTIVE_TIMEOUT_MS);
    } catch (renderError) {
      console.warn('[Turnstile] Execution exception:', renderError);
      finish(null);
    }
  });
}

/** Test-only: reset module state. */
export function __resetTurnstileStateForTests(): void {
  turnstileWidgetId = null;
  inFlight = null;
  document.getElementById(CONTAINER_ID)?.remove();
}
