import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  initializeAuth, 
  browserLocalPersistence, 
  browserPopupRedirectResolver,
  indexedDBLocalPersistence
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug log for configuration (without exposing full API key)
if (import.meta.env.DEV) {
  console.log("Firebase Config Initialization:", {
    hasApiKey: !!firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
}

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  console.error("CRITICAL: Firebase configuration is incomplete. Authentication will fail.");
  console.warn("Check your .env file for VITE_FIREBASE_API_KEY and VITE_FIREBASE_AUTH_DOMAIN.");
}

const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistent cache and long-polling for broad compatibility
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  experimentalForceLongPolling: true, // Critical for environments with proxy/iframe issues
});

// Validate connection to Firestore with a slight delay to allow network to settle
async function testConnection() {
  try {
    // Wait 2 seconds before checking to avoid false positives during initial load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // We use a path that might fail permissions but will still trigger a network request
    // to verify the client can reach the Firebase servers.
    await getDocFromServer(doc(db, "_health_check", "ping"));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    // If it's a permission error, it means we ARE online and connected!
    if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
      console.log("Firestore connectivity confirmed (reachable).");
      return;
    }
    
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.toLowerCase().includes("offline") || msg.toLowerCase().includes("network")) {
      console.warn("Firebase appears to be offline. This is common in the AI Studio preview if not opened in a new tab.");
    } else {
      console.error("Firestore connection status uncertain:", msg);
    }
  }
}

// Run connection test but catch potential top-level crashes
testConnection().catch(err => {
  console.error("Critical error during Firestore connection test:", err);
});

export { db };

// Robust Auth initialization for cross-domain/iframe environments
export const auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, indexedDBLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
