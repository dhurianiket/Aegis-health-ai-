# Implementation Plan — Fix Build Failure (AI Studio & GitHub CI/CD Pipeline)

## 1. Root-Cause Diagnosis (What Is Failing & Why)

### A. What `dompurify` Is and Why AI Studio Fails (`Build failed: exit status 1`)
- **What it is**: `dompurify` is the HTML XSS sanitizer used in `src/services/opdConsultationPdfService.ts` (`DOMPurify.sanitize(rawHtml)` when rendering the 1-page printable OPD Consultation PDF) and is also imported internally by `jspdf`.
- **Why `vite build` fails**:
  - `package.json` specifies `"dompurify": "^3.4.16"` in `dependencies` and `overrides`, which installed `dompurify@3.4.17` into `node_modules/dompurify`.
  - In `node_modules/dompurify/package.json`, the module entry point is declared as `"./dist/purify.es.mjs"`, **but `node_modules/dompurify` does not contain a `dist/` folder** — it only contains the TypeScript source at `./src/purify.ts`.
  - `tsc --noEmit` passes because `@types/dompurify` supplies type definitions, and `scripts/check-client-env.mjs` passes because no `VITE_*` secrets exist. However, when `vite build` runs Rollup, it cannot find `node_modules/dompurify/dist/purify.es.mjs` and exits with status `1`.

### B. Why the GitHub Actions CD Pipeline (`deploy.yml` & `ci-smoke.yml`) Is Also Affected
- Your repository has two GitHub Actions workflows that build/test the live app:
  1. `.github/workflows/deploy.yml` (`Deploy Aegis Health AI to Firebase Hosting`) — runs `npm ci` followed by `npm run build`.
  2. `.github/workflows/ci-smoke.yml` (`Nightly smoke`) — runs `npm ci` followed by Playwright smoke tests.
- Currently, `package.json` (`version: 2.0.0`, with newly added packages `dompurify`, `@types/dompurify`, `three`, `@types/three`, `@types/google.maps`, `@firebase/rules-unit-testing`, `react-is`, and `overrides`) is **out of sync with `package-lock.json`** (which still reflects `version: 1.7.0`).
- On GitHub Actions, `npm ci` strictly requires `package.json` and `package-lock.json` to match; otherwise it fails immediately with `npm error EUSAGE` before even reaching `npm run build` (as documented in `AGENTS.md` §4 *Lockfile Synchronization Rule*).

---

## 2. Proposed Changes (What the Fix Will Do)

### Step 1 — Resilient `dompurify` Resolution in `vite.config.ts`
- **File**: `/vite.config.ts`
- **Action**:
  - Check whether `node_modules/dompurify/dist/purify.es.mjs` exists on disk; when absent (as in `dompurify@3.4.17` where only `src/purify.ts` is present), resolve `"dompurify"` directly to `node_modules/dompurify/src/purify.ts`.
  - Define global `VERSION: JSON.stringify("3.4.17")` in `vite.config.ts` `define` block (required by `dompurify/src/purify.ts` line 55: `declare const VERSION: string`).
- **Effect**: Both AI Studio (`compile_applet` / `vite build`) and GitHub Actions (`npm run build`) will bundle `dompurify` cleanly whether `dist/` is prebuilt or only `src/purify.ts` is present.

### Step 2 — Synchronize `package-lock.json` for GitHub Actions `npm ci`
- **Files**: `/package.json`, `/package-lock.json`
- **Action**:
  - Run `npm install` to synchronize `package-lock.json` with all current dependencies and security `overrides` in `package.json` per `AGENTS.md` §4 (*Lockfile Synchronization Rule*).
- **Effect**: `npm ci` in `.github/workflows/deploy.yml` and `.github/workflows/ci-smoke.yml` will succeed without `EUSAGE` lockfile mismatch errors when pushed to GitHub.

---

## 3. Verification Pipeline (What Each Verification Step Does)

1. **Prebuild Secret Guard (`node scripts/check-client-env.mjs`)**
   - Scans `.env*` files and all non-test source files in `src/` to verify no `VITE_*` variable carries a secret-like name (`SECRET`, `TOKEN`, `BEARER`, `PRIVATE`, `PASSWORD`).
2. **Production Bundle (`vite build` / `compile_applet`)**
   - Compiles the full React 19 + TypeScript application and verifies Rollup bundles `opdConsultationPdfService.ts`, `jspdf`, `dompurify`, and all lazy-loaded routes into `dist/` with exit code `0`.
3. **Postbuild Prerendering & Bundle Secret Audit (`node scripts/prerender-routes.mjs && node scripts/check-client-env.mjs --dist`)**
   - Generates the static SEO HTML shells (`dashboard.html`, `demo.html`, `how-it-works.html`, `about.html`, `security.html`, `engineering-playbook.html`, `blog-hba1c.html`, `blog-cbc.html`, `privacy-policy.html`, `terms-of-service.html`) in `dist/` and scans all compiled assets in `dist/` to ensure zero leaked credential patterns.
4. **TypeScript Lint (`lint_applet` / `tsc --noEmit`) & Unit Tests (`vitest run`)**
   - Confirms zero TypeScript errors across the project and verifies unit tests pass.
