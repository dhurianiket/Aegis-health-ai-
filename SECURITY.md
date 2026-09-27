# Security Policy

## Reporting a vulnerability

Please report security issues privately to **aniket@aegishealthai.co.in**.
Do **not** open a public issue, PR, or discussion for a vulnerability, and do not include
real secrets, tokens, or patient data in your report — describe the location instead.
We aim to acknowledge reports within 72 hours.

## Secrets policy

**Rule: never share, commit, paste, or log an API key, secret, token, password, private key,
or service-account file anywhere online.** That includes:

- this repository (code, config, tests, fixtures, docs, commit messages, branch names),
- gists, issues, pull requests, reviews and discussions,
- chat tools, AI assistants, screenshots, docs and wikis,
- CI logs, browser console output and error messages,
- the client JS bundle (anything built into `dist/`).

When a value must be referenced in writing, redact it as `[REDACTED_SECRET_<TYPE>]`.

### Where secrets are allowed to live

| Location | Used for |
|----------|----------|
| `.env.local` (gitignored, local machine only) | Local development values |
| GitHub → Settings → Secrets and variables → Actions | CI / deploy |
| Cloudflare Worker secrets (`wrangler secret put`, `.dev.vars` locally — gitignored) | `aegishealthai-edge` |
| Firebase / Google Cloud Secret Manager (`firebase functions:secrets:set`) | Cloud Functions |

Nowhere else.

### `VITE_*` variables are public

Every `VITE_*` variable is compiled into the browser bundle and can be read by anyone.
Only public-by-design identifiers belong there (Firebase web config, reCAPTCHA/Turnstile
**site** keys, GA measurement ID, the edge base URL, restricted Maps browser key).

- The SPA authenticates to the edge Worker **only** with the signed-in user's Firebase ID token.
- `npm run build` runs [`scripts/check-client-env.mjs`](scripts/check-client-env.mjs)
  before and after the build. It fails if a `VITE_*` name matches
  `SECRET|TOKEN|BEARER|PRIVATE|PASSWORD`, or if `dist/` contains private-key blocks,
  GitHub tokens, webhook secrets, live payment keys, etc. Run it manually with
  `npm run check:secrets`.

### Pre-commit scanning with ggshield (required)

```bash
pip install pre-commit ggshield   # or: pipx install pre-commit ggshield
ggshield auth login               # or export GITGUARDIAN_API_KEY=... in your shell (never in a file you commit)
pre-commit install                # installs the hook from .pre-commit-config.yaml
```

- Never bypass the hook with `git commit --no-verify`.
- CI also runs GitGuardian on every push and pull request (`.github/workflows/ggshield.yml`),
  in addition to GitHub secret scanning + push protection.
- Keep `.gitguardian.yaml` ignores narrow; never blanket-ignore `src/`, `tests/` or real `.env` files.

### If a secret leaks

1. **Rotate / revoke it immediately** at the provider (Cloudflare, Google Cloud, Firebase,
   GitHub, GA, payment provider, …). Assume it is compromised the moment it was public —
   removing it later does not un-leak it.
2. **Remove it** from the code, config, bundle, message or document, and replace the usage with a
   server-side secret.
3. **If it was committed**, purge it from git history (`git filter-repo` / BFG), force-push only
   after coordinating, and ask GitHub Support to clear cached views if needed.
4. Check provider logs for misuse, then note the incident (without the value) in `LESSONS.md`.
