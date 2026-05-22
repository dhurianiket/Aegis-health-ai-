import React, { createContext, useContext, useEffect, useState } from "react";
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
  const signInInProgress = React.useRef(false);
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

    // Check for redirect result on load
    console.log("[Auth] Checking redirect result on load...");
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("[Auth] Redirect sign-in success for user:", result.user?.uid);
        if (result.user && isMounted) {
          setUser(result.user);
          markUserActive(result.user.uid).catch(err => console.error("[Auth] Error marking active after redirect:", err));
        }
      } else {
        console.log("[Auth] No redirect result found on load.");
      }
    }).catch(error => {
      console.error("[Auth] Redirect sign-in error:", error?.code, error?.message);
    });

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
    if (signInInProgress.current) {
      console.log("Sign-in already in progress, ignoring duplicate request.");
      return;
    }
    
    signInInProgress.current = true;
    setIsSigningIn(true);
    
    // Debug logging for config values
    console.log("[Auth] Initiating Google Sign-In...");
    console.log("[Auth] Configuration values:", JSON.stringify({
      authDomain: auth.config?.authDomain ?? (auth.app.options as any).authDomain,
      apiKeySet: !!auth.app.options.apiKey,
      projectId: auth.app.options.projectId
    }));
    
    try {
      // Ensure Google provider is clean
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      // Clear any existing callback URLs that might be stuck in state/storage
      // and ensure we are starting fresh.
      
      console.log("Current Origin:", window.location.origin);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const preferRedirect = isIOS || isMobile || isSafari;

      if (preferRedirect) {
        console.log("[Auth] Mobile/Safari detected. Attempting signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        console.log("[Auth] signInWithRedirect initiated.");
        // Redirect doesn't resolve here, it navigates away
        return;
      }
      
      // Cloudflare caching often breaks signInWithRedirect because of /__/auth/handler
      // Therefore, we try popup auth exclusively for other browsers.
      try {
        console.log("[Auth] Attempting signInWithPopup...");
        // Enforce popup auth mainly, with custom parameters to help with some browser edge cases
        googleProvider.setCustomParameters({
          prompt: 'select_account'
        });
        
        // Add a timeout around signInWithPopup in case it hangs due to COOP/COEP isolation
        const popupPromise = signInWithPopup(auth, googleProvider);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("auth/popup-timeout")), 15000)
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
          const isEmbedded = window !== window.parent;
          console.warn("Popup error (blocked, unsupported, internal, or timeout). Embedded status:", isEmbedded, popupError);
          
          if (isEmbedded) {
            console.error("[Auth] Blocked because in embedded context.");
            throw new Error("embedded-auth-blocked");
          }
          
          console.warn("[Auth] Falling back to redirect sign-in...");
          // Fallback to redirect sign in if we aren't embedded
          await signInWithRedirect(auth, googleProvider);
          console.log("[Auth] signInWithRedirect initiated.");
        } else if (popupError?.code === "auth/cancelled-popup-request" || popupError?.code === "auth/popup-closed-by-user") {
          console.log("[Auth] Sign-in popup closed by user or cancelled.");
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error("[Auth] Error signing in with Google:", error?.code, error?.message);
      
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
      } else if (error.message === "embedded-auth-blocked") {
        alert(
          "Safari and some mobile browsers block authentication inside embedded previews. Please click the 'Open in New Tab' button in the top right to sign in."
        );
      } else if (errorCode === "auth/network-request-failed") {
        alert(
          "Network request failed during authentication. This is common on Safari when 'Prevent Cross-Site Tracking' is enabled. Please try allowing cross-site tracking or check your network connection."
        );
      } else {
        alert(
          `Failed to sign in (${errorCode || errorMessage || "Unknown Error"}). \n\nIf you see this and are using Safari on iPhone or Mac:\n1. Ensure 'aegishealthai.co.in' is added to Authorized Domains in Firebase Console > Authentication > Settings.\n2. In Google Cloud Console, ensure 'https://aegishealthai.co.in/__/auth/handler' is an authorized redirect URI.\n3. Clear your Safari cache (you may be seeing an older version of this message if it mentions 'AI Studio preview').`
        );
      }
    } finally {
      setIsSigningIn(false);
      signInInProgress.current = false;
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
