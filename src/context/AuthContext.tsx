import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth resolution timeout reached.");
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        clearTimeout(timeout);
        if (isMounted) {
          setUser(u ?? null);
          setLoading(false);
        }
      },
      (error) => {
        clearTimeout(timeout);
        console.error("Auth observer error:", error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
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
    console.log("Initiating Google Sign-In...");
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
          href: window.location.href
        });
        
        alert(
          "Auth Configuration Error (auth/invalid-continue-uri): \n\n" +
          "This usually means the current domain is not authorized in your Firebase console. \n\n" +
          "Current domain: " + window.location.origin + "\n\n" +
          "1. Go to Firebase Console > Authentication > Settings > Authorized Domains.\n" +
          "2. Ensure the above domain is added to the list.\n" +
          "3. If you are in the AI Studio preview, you MUST open the app in a new tab to sign in successfully."
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
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
