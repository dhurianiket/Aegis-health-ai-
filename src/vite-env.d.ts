/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_CLOUDFLARE_AI_GATEWAY_URL: string;
  readonly VITE_CF_AIG_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
