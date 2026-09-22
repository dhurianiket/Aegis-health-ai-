import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (import.meta.env.MODE === 'test' ? 'mock-test-key' : ''),
  authDomain: getDynamicAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aegis-health-app-90697',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'aegis-health-app-90697.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:1234567890abcdef',
};

const app = initializeApp(firebaseConfig);

export let appCheck: any = null;
if (typeof window !== "undefined" && import.meta.env.VITE_RECAPTCHA_SITE_KEY && import.meta.env.MODE !== 'test') {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
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
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch {
    return getFirestore(app);
  }
})();
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
