# Secrets Management

## Environment Variables

Never commit `.env` / `.env.local` files. See `.env.example` for the template.

### Client-Exposed Variables (`VITE_*`)

Anything prefixed with `VITE_` is **public in the JavaScript bundle**.

| Variable | Status |
|----------|--------|
| Firebase web config (`VITE_FIREBASE_*`) | Public by design; protect data with Auth + Security Rules (+ App Check). |
| `VITE_EDGE_API_URL` | Public Worker base URL (`https://api.aegishealthai.co.in`). |
| `VITE_AEGIS_EDGE_BEARER` | **Interim** shared bearer for Worker auth. Still leakable from the SPA. Rotate when Firebase JWT verify ships on the Worker. |
| `VITE_GEMINI_API_KEY` | **Deprecated.** Do not set on Hosting after edge cutover. Rotate any key that was ever built into a production bundle. |
| `VITE_CF_AIG_TOKEN` | **Forbidden** client-side. Gateway tokens stay in Worker secrets. |

### Server / Worker-Only Secrets

| Secret | Where |
|--------|--------|
| `GEMINI_API_KEY` | Cloudflare Worker `aegishealthai-edge` (and Express/Functions if used). |
| `EDGE_SHARED_SECRET` | Worker secret; SPA mirrors as `VITE_AEGIS_EDGE_BEARER` only until JWT auth. |
| `GA_API_SECRET` | Functions/Express only — never `VITE_`. |
| Firebase service accounts / PEMs | CI secrets / local gitignored files only. |

### Edge Gemini proxy

- Worker: `aegishealthai-edge`
- Custom domain: `https://api.aegishealthai.co.in`
- Contract: `POST /api/ai/generate` with Gemini `generateContent`-shaped JSON and `Authorization: Bearer …`
- AI Gateway slug: `aegishealthai` → Google AI Studio
- CORS allowlist: apex, `www`, `http://localhost:5173`
- Never log PHI / upload bodies at the edge or in the SPA console beyond request ids.

## Security Practices

1. Never commit secrets (`.env*`, `*.pem`, `*serviceAccount*.json`).
2. After removing `VITE_GEMINI_API_KEY` from Hosting, **rotate** the old Gemini key.
3. Prefer Firebase ID tokens on the Worker ASAP so the SPA bearer can be deleted.
4. CI must not echo secrets in logs.
