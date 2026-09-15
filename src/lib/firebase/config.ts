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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForTestingTesting12345678",
  authDomain: getDynamicAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aegis-health-app-90697",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aegis-health-app-90697.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890abcdef",
};

const app = initializeApp(firebaseConfig);

let appCheck = null;
// Temporarily isolated App Check due to throttling and 500 errors breaking auth flow
/*
if (typeof window !== "undefined" && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}
*/

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/forms');
export default app;
