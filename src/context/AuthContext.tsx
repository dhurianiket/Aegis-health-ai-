import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase/config";
import { markUserActive } from "../services/usageService";

let cachedAccessToken: string | null = null;
try {
  cachedAccessToken = localStorage.getItem("google_access_token");
} catch (e) {
  console.warn("[Auth] Failed to load cachedAccessToken from localStorage:", e);
}
export const getAccessToken = () => cachedAccessToken;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSigningIn: boolean;
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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const signInInProgress = useRef(false);
  
  useEffect(() => {
    let isMounted = true;
    let unsubscribeFn: (() => void) | null = null;

    // A safely wrapped function for resolving the auth state to prevent early termination
    const resolveAuth = (u: User | null) => {
       if (isMounted) {
         console.log("[Auth] resolveAuth called with user:", u ? u.uid : "null", "current state user:", user ? user.uid : "null");
         setUser(u);
         setLoading(false);
         setAuthResolved(true);
       } else {
         console.warn("[Auth] resolveAuth called but component is NOT mounted!");
       }
    };

    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.error("Failed to set persistence:", err);
      }

      // Step 1: Register onAuthStateChanged as the primary source of truth IMMEDIATELY
      unsubscribeFn = onAuthStateChanged(
        auth,
        (u) => {
          if (isMounted) {
            console.log("[Auth] onAuthStateChanged fired with user:", u ? u.uid : "null");
            if (u) {
              markUserActive(u.uid).catch((err) => console.error("Error marking user active:", err));
            }
            resolveAuth(u ?? null);
          }
        },
        (error) => {
          console.error("Auth observer error:", error);
          if (isMounted) {
            resolveAuth(null);
          }
        }
      );

      // Step 2: Extract redirect credential if available, but do not block on it
      try {
        console.log("[Auth] Checking redirect result on load...");
        // Add a timeout race so it doesn't hang indefinitely if AppCheck keeps failing
        const redirectPromise = getRedirectResult(auth);
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error("redirect-timeout")), 5000));
        const result = await Promise.race([redirectPromise, timeoutPromise]);
        
        if (result?.user) {
          console.log("[Auth] Redirect sign-in success for user:", result.user.uid);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            cachedAccessToken = credential.accessToken;
            try {
              localStorage.setItem("google_access_token", credential.accessToken);
            } catch (e) {
              console.warn("[Auth] Failed to persist google_access_token to localStorage:", e);
            }
          }
          if (isMounted) {
             resolveAuth(result.user);
          }
        }
      } catch (error: any) {
        if (error.message !== "redirect-timeout") {
            console.error("[Auth] Redirect sign-in error:", error?.code, error?.message);
        } else {
            console.warn("[Auth] getRedirectResult timed out, continuing with normal auth state.");
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, []);

  const signIn = async () => {
    if (signInInProgress.current) {
      console.log("Sign-in already in progress, ignoring duplicate request.");
      return;
    }
    
    signInInProgress.current = true;
    setIsSigningIn(true);
    
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      console.log("Current Origin:", window.location.origin);

      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768 || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
      const preferRedirect = (window !== window.parent) || isMobileDevice; // Use redirect if in iframe or on mobile

      if (preferRedirect) {
        console.log("[Auth] Embedded/Mobile detected. Attempting signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        console.log("[Auth] signInWithRedirect initiated.");
        // Redirect navigates away from the page, no need to resolve state here
        return;
      }
      
      console.log("[Auth] Attempting signInWithPopup...");
      
      // We implement a custom timeout race specifically for COOP blocked configurations in Safari/Desktop
      const popupPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("auth/popup-timeout")), 20000)
      );
      
      const result: any = await Promise.race([popupPromise, timeoutPromise]);
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          try {
            localStorage.setItem("google_access_token", credential.accessToken);
          } catch (e) {
            console.warn("[Auth] Failed to persist google_access_token to localStorage:", e);
          }
        }
      }
      console.log("[Auth] Sign-in with popup successful.");

    } catch (popupError: any) {
      console.error("[Auth] signInWithPopup failed:", popupError?.code, popupError?.message);
      
      if (
        popupError?.code === "auth/popup-blocked" || 
        popupError?.code === "auth/unsupported-browser" ||
        popupError?.code === "auth/internal-error" ||
        popupError?.message === "auth/popup-timeout"
      ) {
        console.warn("[Auth] Falling back to redirect sign-in due to popup failure...");
        await signInWithRedirect(auth, googleProvider).catch(e => {
            console.error("[Auth] Fatal redirect initiation failure:", e);
            if (e?.code === "auth/network-request-failed") {
                alert("Sign in failed due to a network error during fallback. Please check ad blockers/Brave Shields.");
            } else {
                alert(`Redirect sign-in failed: ${e?.message}`);
            }
        });
      } else if (popupError?.code === "auth/network-request-failed") {
        alert("Sign in failed due to a network error. If you are using an ad blocker (like Brave Shields or uBlock), please disable it for this site and try again. It blocks secure authentication components.");
      } else if (popupError?.code !== "auth/cancelled-popup-request" && popupError?.code !== "auth/popup-closed-by-user") {
        alert(
          `Failed to sign in (${popupError?.code || popupError?.message || "Unknown Error"}). \n\nIf you see this and are using Safari on iPhone or Mac:\n1. Ensure 'aegishealthai.co.in' is added to Authorized Domains in Firebase Console > Authentication > Settings.\n2. In Google Cloud Console, ensure 'https://aegishealthai.co.in/__/auth/handler' is an authorized redirect URI.\n`
        );
      }
    } finally {
      setIsSigningIn(false);
      // Give a brief cooldown before allowing another sign-in attempt
      setTimeout(() => {
        signInInProgress.current = false;
      }, 1000);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      cachedAccessToken = null;
      try {
        localStorage.removeItem("google_access_token");
      } catch (e) {}
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const value = useMemo(
    () => ({ user, loading, isSigningIn, authResolved, signIn, logOut }),
    [user, loading, isSigningIn, authResolved]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
