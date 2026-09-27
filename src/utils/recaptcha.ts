/**
 * reCAPTCHA v3 token acquisition for client-side action gating.
 *
 * IMPORTANT: Firebase App Check (src/lib/firebase/config.ts) initialises
 * ReCaptchaV3Provider with the same site key at app start. App Check loads
 * `https://www.google.com/recaptcha/api.js` in *explicit* mode (no `?render=`)
 * and renders its own invisible widget. Once that has happened
 * `window.grecaptcha` already exists, so we never load `api.js?render=<key>`,
 * and `grecaptcha.execute(siteKey, …)` throws
 * "Invalid site key or not loaded in api.js". That made every upload fail with
 * "Security verification failed".
 *
 * To work in both modes we try the key-based execute first and, if the key
 * was not loaded via `?render=`, fall back to rendering (once) our own
 * invisible widget for the site key and executing it by widget id — the same
 * mechanism App Check itself uses.
 */

const DEFAULT_SITE_KEY = "6Lfln_EsAAAAABlOtBKP5ngFr3f8lXzX59Oujq6A";
const EXECUTE_TIMEOUT_MS = 15000;

let widgetIdForKey: { siteKey: string; widgetId: number } | null = null;

const getGrecaptcha = (): any => (typeof window !== "undefined" ? (window as any).grecaptcha : undefined);

function loadRecaptchaScript(siteKey: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const id = "recaptcha-lazy-script";
    if (document.getElementById(id)) {
      const started = Date.now();
      const checkExist = setInterval(() => {
        if (getGrecaptcha()) {
          clearInterval(checkExist);
          resolve();
        } else if (Date.now() - started > EXECUTE_TIMEOUT_MS) {
          clearInterval(checkExist);
          reject(new Error("Timed out loading reCAPTCHA"));
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const g = getGrecaptcha();
      if (g) {
        g.ready(() => resolve());
      } else {
        resolve();
      }
    };
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
}

function getOrRenderWidget(grecaptcha: any, siteKey: string): number {
  if (widgetIdForKey && widgetIdForKey.siteKey === siteKey) {
    return widgetIdForKey.widgetId;
  }
  const container = document.createElement("div");
  container.id = "aegis-recaptcha-action-widget";
  container.style.display = "none";
  document.body.appendChild(container);
  const widgetId = grecaptcha.render(container, {
    sitekey: siteKey,
    size: "invisible",
    badge: "inline",
  });
  widgetIdForKey = { siteKey, widgetId };
  return widgetId;
}

async function executeWithFallback(grecaptcha: any, siteKey: string, action: string): Promise<string | null> {
  try {
    const token = await grecaptcha.execute(siteKey, { action });
    if (token) return token;
  } catch (keyExecError) {
    // Expected when api.js was loaded in explicit mode (e.g. by Firebase App Check).
    if (import.meta.env.DEV) {
      console.warn("[RECAPTCHA]: key-based execute unavailable, using widget fallback:", keyExecError);
    }
  }
  const widgetId = getOrRenderWidget(grecaptcha, siteKey);
  const token = await grecaptcha.execute(widgetId, { action });
  return token || null;
}

export const getRecaptchaToken = async (action: string): Promise<string | null> => {
  try {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || DEFAULT_SITE_KEY;
    if (!siteKey) {
      console.error("[RECAPTCHA]: VITE_RECAPTCHA_SITE_KEY is missing.");
      return null;
    }

    if (!getGrecaptcha()) {
      await loadRecaptchaScript(siteKey);
    }

    const grecaptcha = getGrecaptcha();
    if (!grecaptcha) {
      console.error("[RECAPTCHA]: Library not initialized.");
      return null;
    }

    return await new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => {
        console.error("[RECAPTCHA]: execute timed out.");
        resolve(null);
      }, EXECUTE_TIMEOUT_MS);
      grecaptcha.ready(async () => {
        try {
          resolve(await executeWithFallback(grecaptcha, siteKey, action));
        } catch (execError) {
          console.error("[RECAPTCHA EXECUTING ERROR]:", execError);
          resolve(null);
        } finally {
          clearTimeout(timer);
        }
      });
    });
  } catch (err) {
    console.error("[RECAPTCHA ERROR]:", err);
    return null;
  }
};

/** Test-only: reset cached widget state. */
export const __resetRecaptchaStateForTests = (): void => {
  widgetIdForKey = null;
};
