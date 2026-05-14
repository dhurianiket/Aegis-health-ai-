import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase/config";
import { markUserActive } from "../services/usageService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authResolved: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth resolution timeout reached.");
        setLoading(false);
        setAuthResolved(true);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        clearTimeout(timeout);
        if (isMounted) {
          setUser(u ?? null);
          setLoading(false);
          setAuthResolved(true);
          if (u) {
            markUserActive(u.uid).catch((err) => console.error("Error marking user active:", err));
          }
        }
      },
      (error) => {
        clearTimeout(timeout);
        console.error("Auth observer error:", error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
          setAuthResolved(true);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async () => {
    if (import.meta.env.DEV) console.log("Initiating Google Sign-In...");
    try {
      // Ensure Google provider is clean
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      // Clear any existing callback URLs that might be stuck in state/storage
      // and ensure we are starting fresh.
      
      console.log("Current Origin:", window.location.origin);
      
      await signInWithPopup(auth, googleProvider);
      console.log("Sign-in successful.");
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      
      const errorCode = error?.code;
      const errorMessage = error?.message || "";

      if (errorCode === "auth/invalid-continue-uri") {
        console.error("Firebase auth/invalid-continue-uri detected.", {
          origin: window.location.origin,
          href: window.location.href,
          authDomain: (auth as any).config?.authDomain
        });
        
        alert(
          "Auth Configuration Error (auth/invalid-continue-uri): \n\n" +
          "This error typically occurs when the 'authDomain' is incorrect or the current domain is not authorized. \n\n" +
          "Current domain: " + window.location.origin + "\n" +
          "Configured Auth Domain: " + (auth as any).config?.authDomain + "\n\n" +
          "1. In Firebase Console, go to Authentication > Settings > Authorized Domains.\n" +
          "2. Add '" + window.location.hostname + "' to the list.\n" +
          "3. Ensure VITE_FIREBASE_AUTH_DOMAIN in your .env matches your project ID (usually project-id.firebaseapp.com)."
        );
      } else if (errorMessage.includes("api-key-not-valid") || errorCode === "auth/invalid-api-key") {
        alert(
          "Firebase API key is missing or invalid. Please check your .env.local file or Secrets panel.",
        );
      } else if (errorCode === "auth/popup-blocked") {
        alert("The sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (errorCode === "auth/cancelled-popup-request") {
        // User closed the popup, no need for major alert
        console.log("Sign-in popup closed by user.");
      } else {
        alert(
          `Failed to sign in (${errorCode || "Unknown Error"}). \n\nIf you are in the AI Studio preview, please open the app in a new tab to sign in with Google.`,
        );
      }
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authResolved, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
