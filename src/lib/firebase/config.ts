import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
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
export const db = getFirestore(
  app,
  import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-aa8f32c9-5d45-4598-860a-1f69826e6e70"
);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code == "failed-precondition") {
    console.warn(
      "Multiple tabs open, persistence can only be enabled in one tab at a a time.",
    );
  } else if (err.code == "unimplemented") {
    console.warn(
      "The current browser does not support all of the features required to enable persistence",
    );
  }
});
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
