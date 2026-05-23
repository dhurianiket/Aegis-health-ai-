import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase/config";
import { markUserActive } from "../services/usageService";

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

    // A safely wrapped function for resolving the auth state to prevent early termination
    const resolveAuth = (u: User | null) => {
       if (isMounted) {
         setUser(u);
         setLoading(false);
         setAuthResolved(true);
       }
    };

    const initializeAuth = async () => {
      try {
        // Step 1: Wait for getRedirectResult so we don't render protected pages before the OAuth token is resolved by Firebase internals
        console.log("[Auth] Checking redirect result on load...");
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          console.log("[Auth] Redirect sign-in success for user:", result.user.uid);
          // Wait for custom analytics / active user marking before unlocking UI
          await markUserActive(result.user.uid).catch(err => console.error("[Auth] Error marking active after redirect:", err));
          resolveAuth(result.user);
        }
      } catch (error: any) {
        console.error("[Auth] Redirect sign-in error:", error?.code, error?.message);
        const errorCode = error?.code;
        if (errorCode === "auth/invalid-continue-uri") {
           console.error("Firebase auth/invalid-continue-uri detected.", {
             origin: window.location.origin,
             authDomain: (auth as any).config?.authDomain
           });
        }
      }

      // Step 2: Register onAuthStateChanged as the final source of truth for subsequent sessions
      onAuthStateChanged(
        auth,
        (u) => {
          if (isMounted) {
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
    };

    initializeAuth();

    return () => {
      isMounted = false;
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

      const preferRedirect = (window !== window.parent); // Only prefer redirect if embedded in an iframe

      if (preferRedirect) {
        console.log("[Auth] Embedded detected. Attempting signInWithRedirect...");
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
      
      await Promise.race([popupPromise, timeoutPromise]);
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
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSigningIn, authResolved, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
