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
    try {
      // Ensure Google provider is clean
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      
      const errorCode = error?.code;
      const errorMessage = error?.message || "";

      if (errorCode === "auth/invalid-continue-uri") {
        alert(
          "Auth Configuration Error: The current domain is not authorized in your Firebase console. \n\n" +
          "1. Go to Firebase Console > Authentication > Settings > Authorized Domains.\n" +
          "2. Add the current domain to the list.\n" +
          "3. Also, try opening the app in a new tab if you're in the AI Studio preview."
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
