import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
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
  cachedAccessToken = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("google_access_token") : null;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("google_access_token");
  }
} catch (e) {
  console.warn("[Auth] Failed to load cachedAccessToken from sessionStorage:", e);
}
export const getAccessToken = () => cachedAccessToken;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSigningIn: boolean;
  authResolved: boolean;
  signIn: () => Promise<{ method: 'popup' | 'redirect'; user?: User | null } | void>;
  signInWithEmail?: (email: string, password: string) => Promise<void>;
  signUpWithEmail?: (email: string, password: string) => Promise<User | null>;
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
         if (import.meta.env.DEV) console.log("[Auth] resolveAuth called with user:", u ? u.uid : "null", "current state user:", user ? user.uid : "null");
         setUser(u);
         setLoading(false);
         setAuthResolved(true);
       } else {
         console.warn("[Auth] resolveAuth called but component is NOT mounted!");
       }
    };

    // Safety timeout so headless bots/crawlers with restricted IndexedDB never hang on loading
    const botSafetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        setAuthResolved(true);
      }
    }, 6000);

    const initializeAuth = async () => {
      // Step 1: Ensure persistence is initialized before reading redirect/auth state
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.warn("[Auth] Failed to set persistence:", err);
      }

      // Step 2: Extract redirect credential first if returning from OAuth redirect
      const isMockDevKey =
        import.meta.env.MODE !== "test" &&
        (auth as any)?.app?.options?.apiKey === "mock-test-key";
      let initialRedirectUser: User | null = null;

      if (!isMockDevKey) {
        try {
          if (import.meta.env.DEV) console.log("[Auth] Checking redirect result on load...");
          // Generous 20s timeout so mobile connections are not prematurely dropped
          const redirectPromise = getRedirectResult(auth);
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 20000)
          );
          const result = await Promise.race([redirectPromise, timeoutPromise]);
          
          if (result && 'user' in result && result.user) {
            initialRedirectUser = result.user;
            if (import.meta.env.DEV) console.log("[Auth] Redirect sign-in success for user:", result.user.uid);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
              cachedAccessToken = credential.accessToken;
              try {
                sessionStorage.setItem("google_access_token", credential.accessToken);
              } catch (e) {
                console.warn("[Auth] Failed to persist google_access_token to sessionStorage:", e);
              }
            }
          }
        } catch (error: any) {
          console.warn("[Auth] Redirect sign-in check notice:", error?.code, error?.message);
        }
      }

      // Step 3: Register onAuthStateChanged listener
      unsubscribeFn = onAuthStateChanged(
        auth,
        (u) => {
          if (isMounted) {
            clearTimeout(botSafetyTimer);
            const activeUser = u || initialRedirectUser;
            if (import.meta.env.DEV) console.log("[Auth] onAuthStateChanged fired with user:", activeUser ? activeUser.uid : "null");
            if (activeUser) {
              markUserActive(activeUser.uid, activeUser.email, activeUser.displayName, activeUser.photoURL).catch((err) => console.error("Error marking user active:", err));
            }
            resolveAuth(activeUser ?? null);
          }
        },
        (error) => {
          console.error("Auth observer error:", error);
          if (isMounted) {
            clearTimeout(botSafetyTimer);
            resolveAuth(initialRedirectUser ?? null);
          }
        }
      );

      // If redirect user was resolved, ensure state is updated immediately without waiting
      if (initialRedirectUser && isMounted) {
        clearTimeout(botSafetyTimer);
        resolveAuth(initialRedirectUser);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      clearTimeout(botSafetyTimer);
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, []);

  const signIn = async (): Promise<{ method: 'popup' | 'redirect'; user?: User | null } | void> => {
    if (signInInProgress.current) {
      if (import.meta.env.DEV) console.log("Sign-in already in progress, ignoring duplicate request.");
      return;
    }
    
    signInInProgress.current = true;
    setIsSigningIn(true);
    
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      if (import.meta.env.DEV) console.log("Current Origin:", window.location.origin);

      const isEmbedded = (window !== window.parent);

      if (isEmbedded) {
        if (import.meta.env.DEV) console.log("[Auth] Embedded iframe detected. Attempting signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        if (import.meta.env.DEV) console.log("[Auth] signInWithRedirect initiated.");
        return { method: 'redirect' };
      }
      
      if (import.meta.env.DEV) console.log("[Auth] Attempting signInWithPopup...");
      
      // Popup auth is used for both mobile (Safari/Chrome/PWA) and desktop browsers for seamless in-place login
      const popupPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("auth/popup-timeout")), 45000)
      );
      
      const result: any = await Promise.race([popupPromise, timeoutPromise]);
      if (result?.user) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          try {
            sessionStorage.setItem("google_access_token", credential.accessToken);
          } catch (e) {
            console.warn("[Auth] Failed to persist google_access_token to sessionStorage:", e);
          }
        }
        setUser(result.user);
        setLoading(false);
        setAuthResolved(true);
        if (import.meta.env.DEV) console.log("[Auth] Sign-in with popup successful.");
        return { method: 'popup', user: result.user };
      }
      return { method: 'popup', user: null };

    } catch (popupError: any) {
      console.error("[Auth] signInWithPopup failed:", popupError?.code, popupError?.message);
      
      if (
        popupError?.code === "auth/popup-blocked" || 
        popupError?.code === "auth/unsupported-browser" ||
        popupError?.code === "auth/internal-error" ||
        popupError?.message === "auth/popup-timeout"
      ) {
        console.warn("[Auth] Falling back to redirect sign-in due to popup failure...");
        try {
          await signInWithRedirect(auth, googleProvider);
          return { method: 'redirect' };
        } catch (e: any) {
          console.error("[Auth] Fatal redirect initiation failure:", e);
          if (e?.code === "auth/network-request-failed") {
            alert("Sign in failed due to a network error during fallback. Please check ad blockers/Brave Shields.");
          } else {
            alert(`Redirect sign-in failed: ${e?.message}`);
          }
          return { method: 'redirect' };
        }
      } else if (popupError?.code === "auth/network-request-failed") {
        alert("Sign in failed due to a network error. If you are using an ad blocker (like Brave Shields or uBlock), please disable it for this site and try again. It blocks secure authentication components.");
        return { method: 'popup', user: null };
      } else if (popupError?.code !== "auth/cancelled-popup-request" && popupError?.code !== "auth/popup-closed-by-user") {
        alert(
          `Failed to sign in (${popupError?.code || popupError?.message || "Unknown Error"}). \n\nIf you see this and are using Safari on iPhone or Mac:\n1. Ensure 'aegishealthai.co.in' is added to Authorized Domains in Firebase Console > Authentication > Settings.\n2. In Google Cloud Console, ensure 'https://aegishealthai.co.in/__/auth/handler' is an authorized redirect URI.\n`
        );
        return { method: 'popup', user: null };
      }
      return { method: 'popup', user: null };
    } finally {
      setIsSigningIn(false);
      setTimeout(() => {
        signInInProgress.current = false;
      }, 1000);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (signInInProgress.current) return;
    signInInProgress.current = true;
    setIsSigningIn(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user?.email?.toLowerCase() === "reviewer@aegishealthai.co.in") {
        try {
          localStorage.setItem("aegis_consent_granted", "true");
        } catch (e) {}
      }
    } finally {
      setIsSigningIn(false);
      setTimeout(() => {
        signInInProgress.current = false;
      }, 500);
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<User | null> => {
    if (signInInProgress.current) return null;
    signInInProgress.current = true;
    setIsSigningIn(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user) {
        try {
          await sendEmailVerification(cred.user);
        } catch (vErr) {
          console.warn("[Auth] Email verification dispatch notice:", vErr);
        }
      }
      return cred.user;
    } finally {
      setIsSigningIn(false);
      setTimeout(() => {
        signInInProgress.current = false;
      }, 500);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      cachedAccessToken = null;
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("google_access_token");
        }
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("google_access_token");
        }
      } catch (e) {}
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const value = useMemo(
    () => ({ user, loading, isSigningIn, authResolved, signIn, signInWithEmail, signUpWithEmail, logOut }),
    [user, loading, isSigningIn, authResolved, signIn, signInWithEmail, signUpWithEmail, logOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
