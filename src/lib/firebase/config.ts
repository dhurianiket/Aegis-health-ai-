import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const sanitizeDomain = (domain?: string) => {
  if (!domain) return domain;
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

const getDynamicAuthDomain = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("aegishealthai.co.in")) {
      return "aegishealthai.co.in";
    }
  }
  return sanitizeDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || "aegis-health-app-90697.firebaseapp.com";
};

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    (import.meta.env.MODE === 'test' || import.meta.env.DEV ? 'mock-test-key' : ''),
  authDomain: getDynamicAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aegis-health-app-90697',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'aegis-health-app-90697.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '276903125313',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:276903125313:web:e414a9d6ca041d642d01c0',
};

const app = initializeApp(firebaseConfig);

export let appCheck: any = null;
const RECAPTCHA_SITE_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_RECAPTCHA_SITE_KEY) ||
  "6Lfln_EsAAAAABlOtBKP5ngFr3f8lXzX59Oujq6A";

if (
  typeof window !== "undefined" &&
  RECAPTCHA_SITE_KEY &&
  import.meta.env.MODE !== "test" &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "mock-test-key"
) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: false,
    });
  } catch (err) {
    console.warn("[AppCheck] Graceful fallback: initialization deferred:", err);
  }
}

import { setAuthTokenProvider } from "../authTokenProvider";

export const auth = getAuth(app);

// Securely register auth token provider without leaking auth instance to window (XSS prevention)
setAuthTokenProvider(async () => {
  try {
    const user = auth?.currentUser;
    return user ? await user.getIdToken() : null;
  } catch {
    return null;
  }
});
export const db = (() => {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
})();
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
