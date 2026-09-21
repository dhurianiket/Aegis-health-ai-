# Secrets Management

## Environment Variables

This application requires certain environment variables to function properly.
Never commit your `.env` / `.env.local` files to version control.

Required variables are documented in `.env.example`.

### Client-Exposed Variables (`VITE_*`)

Variables prefixed with `VITE_` are **public** in the client JavaScript bundle. Use them only for non-sensitive configuration (Firebase web config, reCAPTCHA site key, GA measurement id, public gateway URLs).

- **Firebase web config**: Generally safe to expose; access control must come from Auth + Firestore/Storage rules (+ App Check when enabled). Never put Admin SDK keys or service-account JSON in `VITE_*`.
- **`VITE_GEMINI_API_KEY` (current state)**: This value **is embedded in the production bundle** today via the Vite client Gemini path. Treat any key that has ever been set here as **exposed** — rotate it and migrate inference to a server proxy (`GEMINI_API_KEY` on Express / Cloud Functions only). Until that migration ships, restrict the key (HTTP referrer / API restrictions) as a temporary control.
- **Forbidden as `VITE_*`**: GA Measurement Protocol API secrets, Cloudflare AI Gateway tokens, GitHub PATs, Firebase service-account keys, webhook signing secrets, Razorpay key secrets.

### Server-Only Secrets

Variables **without** the `VITE_` prefix must never be referenced from client code or injected into the Vite `define` block.

- **`GEMINI_API_KEY`**: Server-side only (Express / Functions). This is the correct long-term home for Gemini credentials.
- **`GA_API_SECRET`**: Server-side only for GA4 Measurement Protocol. The browser must use `gtag`, not MP with a secret.
- **Other third-party secrets**: Proxy through Cloud Functions or Express; do not ship them in Hosting assets.

### Storage rules

Repository Storage rules live in `storage.rules` and are wired in `firebase.json`. Deploying them is an explicit `firebase deploy --only storage` (or full deploy) — confirm live bucket rules in the Firebase console before/after deploy.

## Security Practices

1. **Never commit secrets**: `.env*`, `*.pem`, and `*serviceAccount*.json` are gitignored. Keep them out of version control and out of PR diffs.
2. **Access control**: Firestore and Storage must enforce Auth + ownership (and admin via custom claims — not hardcoded emails long-term).
3. **Key rotation**: Rotate any key that may have been built into Hosting as `VITE_*`. Scope Google API keys to specific APIs and HTTP referrers where possible.
4. **CI secrets**: GitHub Actions should inject secrets only into the build/deploy job environment; never echo them in logs.
