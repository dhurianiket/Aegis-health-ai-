import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dompurifyDist = path.resolve(__dirname, "node_modules/dompurify/dist/purify.es.mjs");
const dompurifySrc = path.resolve(__dirname, "node_modules/dompurify/src/purify.ts");
const dompurifyAlias: Record<string, string> =
  !fs.existsSync(dompurifyDist) && fs.existsSync(dompurifySrc)
    ? { dompurify: dompurifySrc }
    : {};

const SECRET_VITE_RE = /^VITE_.*(SECRET|TOKEN|BEARER|PRIVATE|PASSWORD)/i;
for (const key of Object.keys(process.env)) {
  if (SECRET_VITE_RE.test(key)) {
    delete process.env[key];
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    base: "/",
    plugins: [react(), tailwindcss()],
    define: {
      VERSION: JSON.stringify("3.4.17"),
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_PLATFORM_KEY || env.GOOGLE_MAPS_PLATFORM_KEY || process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_PLATFORM_KEY || env.GOOGLE_MAPS_PLATFORM_KEY || process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'import.meta.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        ...dompurifyAlias,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
