/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_CLOUDFLARE_AI_GATEWAY_URL: string;
  /** @deprecated Do not set — gateway tokens must stay server-side. */
  readonly VITE_CF_AIG_TOKEN?: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface Window {
  grecaptcha: {
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
