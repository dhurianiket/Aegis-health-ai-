import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCWRTEehnT8kokTdf_gPPG2aW6vWOy-f7Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0643133134.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0643133134",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0643133134.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "126651185978",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:126651185978:web:0a8c93f5b9bd2b4f16ee03",
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
