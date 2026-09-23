import { useEffect, useRef, useState, useCallback } from "react";
import { setTurnstileTokenProvider, setCachedTurnstileToken } from "../lib/turnstileTokenProvider";

export interface UseTurnstileOptions {
  siteKey?: string;
  action?: string;
  cdata?: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "compact" | "flexible";
  onSuccess?: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
}

export interface UseTurnstileReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  token: string | null;
  isLoaded: boolean;
  isVerified: boolean;
  error: string | null;
  resetWidget: () => void;
  renderWidget: (target?: HTMLElement | null) => string | null;
  getToken: () => Promise<string | null>;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          action?: string;
          cdata?: string;
          theme?: "auto" | "light" | "dark";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
          "timeout-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const DEFAULT_SITE_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TURNSTILE_SITE_KEY) ||
  "0x4AAAAAAFA-TF6j3OO6uZY0";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * React hook to manage Cloudflare Turnstile bot verification lifecycle.
 */
export function useTurnstile(options: UseTurnstileOptions = {}): UseTurnstileReturn {
  const {
    siteKey = DEFAULT_SITE_KEY,
    action = "ai_generate",
    cdata,
    theme = "auto",
    size = "flexible",
    onSuccess,
    onError,
    onExpire,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Keep latest callbacks in refs to prevent unnecessary re-renders
  const callbacksRef = useRef({ onSuccess, onError, onExpire });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onExpire };
  }, [onSuccess, onError, onExpire]);

  // Load the Turnstile script once
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(`script[src*="turnstile/v0/api.js"]`);
    if (existingScript) {
      const handleLoad = () => setIsLoaded(true);
      existingScript.addEventListener("load", handleLoad);
      return () => existingScript.removeEventListener("load", handleLoad);
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      setError("Failed to load Turnstile security widget");
      callbacksRef.current.onError?.("network_error");
    };
    document.head.appendChild(script);
  }, []);

  const renderWidget = useCallback((target?: HTMLElement | null): string | null => {
    const node = target || containerRef.current;
    if (!node || typeof window === "undefined" || !window.turnstile) return null;
    if (widgetIdRef.current) return widgetIdRef.current;

    try {
      const id = window.turnstile.render(node, {
        sitekey: siteKey,
        action,
        cdata,
        theme,
        size,
        callback: (newToken: string) => {
          setToken(newToken);
          setIsVerified(true);
          setError(null);
          setCachedTurnstileToken(newToken);
          callbacksRef.current.onSuccess?.(newToken);
        },
        "error-callback": (errCode?: string) => {
          setError(errCode || "Verification failed");
          setIsVerified(false);
          setCachedTurnstileToken(null);
          callbacksRef.current.onError?.(errCode);
        },
        "expired-callback": () => {
          setToken(null);
          setIsVerified(false);
          setCachedTurnstileToken(null);
          callbacksRef.current.onExpire?.();
        },
      });

      widgetIdRef.current = id;
      return id;
    } catch (renderErr: any) {
      console.warn("[Turnstile] Render error:", renderErr);
      setError(renderErr?.message || "Render error");
      return null;
    }
  }, [siteKey, action, cdata, theme, size]);

  // Render widget once script is loaded and container is ready
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;
    renderWidget(containerRef.current);

    return () => {
      if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [isLoaded, renderWidget]);

  const resetWidget = useCallback(() => {
    if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (e) {
        console.warn("[Turnstile] Reset failed:", e);
      }
    }
    setToken(null);
    setIsVerified(false);
    setCachedTurnstileToken(null);
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (token) return token;
    if (typeof window !== "undefined" && window.turnstile && widgetIdRef.current) {
      const current = window.turnstile.getResponse(widgetIdRef.current);
      if (current) {
        setToken(current);
        setCachedTurnstileToken(current);
        return current;
      }
    }
    return null;
  }, [token]);

  // Register this hook's token provider with the global provider
  useEffect(() => {
    setTurnstileTokenProvider(async () => {
      return await getToken();
    });

    return () => {
      setTurnstileTokenProvider(null);
    };
  }, [getToken]);

  return {
    containerRef,
    token,
    isLoaded,
    isVerified,
    error,
    resetWidget,
    renderWidget,
    getToken,
  };
}
