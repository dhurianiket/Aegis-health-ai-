# Secrets Management

## Environment Variables

Never commit `.env` / `.env.local` files to version control. See `.env.example` for the template.

### Client-Exposed Variables (`VITE_*`)

Anything prefixed with `VITE_` is **public in the client JavaScript bundle**.

| Variable | Status | Description |
|----------|--------|-------------|
| Firebase web config (`VITE_FIREBASE_*`) | Public by design | Protect data with Auth + Security Rules (+ App Check). Never put Admin SDK keys or service-account JSON in `VITE_*`. |
| `VITE_EDGE_API_URL` | Public Worker base URL | `https://api.aegishealthai.co.in`. |
| `VITE_AEGIS_EDGE_BEARER` | **Interim** shared bearer | Interim shared secret for Worker proxy auth. Still leakable from the SPA. Rotate when Firebase JWT verification lands on the Worker. |
| `VITE_GA_MEASUREMENT_ID` | Public by design | Standard GA4 measurement stream id (`G-KKGF16H7CY`). |
| `VITE_GEMINI_API_KEY` | **Deprecated** | Do not set on Hosting after edge cutover. Rotate any key that was ever built into a production bundle. |
| `VITE_CF_AIG_TOKEN` | **Forbidden** client-side | Cloudflare AI Gateway tokens must remain strictly in server/Worker secrets. |
| `VITE_RECAPTCHA_SITE_KEY` | Public by design | Standard public Google reCAPTCHA v3 site key. |

### Server / Worker-Only Secrets

Variables **without** the `VITE_` prefix must never be referenced from client code or injected into the Vite `define` block.

| Secret | Where | Description |
|--------|-------|-------------|
| `GEMINI_API_KEY` | Cloudflare Worker `aegishealthai-edge` | Server-side Gemini API key used by the edge proxy. |
| `EDGE_SHARED_SECRET` | Cloudflare Worker `aegishealthai-edge` | Worker secret matching `VITE_AEGIS_EDGE_BEARER` until JWT auth. |
| `GA_API_SECRET` | Functions/Express only | Server-side only for GA4 Measurement Protocol. The browser must use `gtag`, not MP with a secret. |
| Firebase service accounts / PEMs | CI secrets / local gitignored files only | Never committed to version control. |

### Edge Gemini Proxy (`aegishealthai-edge`)

- **Worker**: `aegishealthai-edge`
- **Custom domain**: `https://api.aegishealthai.co.in`
- **Contract**: `POST /api/ai/generate` with Gemini `generateContent`-shaped JSON and `Authorization: Bearer …`
- **AI Gateway slug**: `aegishealthai` → Google AI Studio
- **CORS allowlist**: `https://aegishealthai.co.in`, `https://www.aegishealthai.co.in`, `http://localhost:5173`
- Never log PHI or upload bodies at the edge or in the SPA console beyond request IDs.

### Storage Rules

Repository Storage rules live in `storage.rules` and are wired in `firebase.json`. Deploying them is an explicit `firebase deploy --only storage` (or full deploy) — confirm live bucket rules in the Firebase console before/after deploy.

## Security Practices

1. **Never commit secrets**: `.env*`, `*.pem`, and `*serviceAccount*.json` are gitignored. Keep them out of version control and PR diffs.
2. **Key rotation**: After removing `VITE_GEMINI_API_KEY` from Hosting, **rotate** the old Gemini key.
3. **Transition to JWT**: Prefer Firebase ID tokens on the Worker ASAP so the interim SPA bearer can be completely removed.
4. **CI secrets**: GitHub Actions should inject secrets only into the build/deploy job environment; never echo them in logs.
