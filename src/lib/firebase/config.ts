import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBix3A6O6tBWzs5OB4s7l8SffltHe-FdaY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aegis-health-app-90697.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aegis-health-app-90697",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aegis-health-app-90697.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "276903125313",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:276903125313:web:e414a9d6ca041d642d01c0",
};

const app = initializeApp(firebaseConfig);

let db: any;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  console.warn("Firestore persistence failed, falling back to basic initialization", e);
  db = getFirestore(app);
}

export { db };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
