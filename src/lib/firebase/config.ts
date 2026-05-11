import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBix3A6O6tBWzs5OB4s7l8SffltHe-FdaY",
  authDomain: "aegis-health-app-90697.firebaseapp.com",
  projectId: "aegis-health-app-90697",
  storageBucket: "aegis-health-app-90697.firebasestorage.app",
  messagingSenderId: "276903125313",
  appId: "1:276903125313:web:e414a9d6ca041d642d01c0",
};

const app = initializeApp(firebaseConfig);

let db: any = getFirestore(app);

export { db };
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
