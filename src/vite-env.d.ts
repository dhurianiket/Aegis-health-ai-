/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** @deprecated Prefer edge proxy; do not ship Gemini keys in the SPA. */
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_CLOUDFLARE_AI_GATEWAY_URL?: string;
  /** @deprecated Do not set — gateway tokens must stay server-side / Worker secrets. */
  readonly VITE_CF_AIG_TOKEN?: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Google Maps Platform API Key for Localized Care Map. */
  readonly VITE_GOOGLE_MAPS_PLATFORM_KEY?: string;
  readonly GOOGLE_MAPS_PLATFORM_KEY?: string;
  /** Base URL for aegishealthai-edge Worker (default https://api.aegishealthai.co.in). */
  readonly VITE_EDGE_API_URL?: string;
  /**
   * Interim shared bearer for Worker auth (EDGE_SHARED_SECRET).
   * Still public in the JS bundle — rotate when Firebase JWT auth lands.
   */
  readonly VITE_AEGIS_EDGE_BEARER?: string;
}

interface Window {
  grecaptcha: {
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
