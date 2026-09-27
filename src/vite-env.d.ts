/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** @deprecated Prefer edge proxy; do not ship Gemini keys in the SPA. */
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_CLOUDFLARE_AI_GATEWAY_URL?: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Google Maps Platform API Key for Localized Care Map. */
  readonly VITE_GOOGLE_MAPS_PLATFORM_KEY?: string;
  readonly GOOGLE_MAPS_PLATFORM_KEY?: string;
  /** Base URL for aegishealthai-edge Worker (default https://api.aegishealthai.co.in). */
  readonly VITE_EDGE_API_URL?: string;
  // NOTE: every VITE_* value is public (compiled into the bundle). Never declare secrets here.
  // Edge auth uses the user's Firebase ID token only; see SECURITY.md.
}

interface Window {
  grecaptcha: {
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
