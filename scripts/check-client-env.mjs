#!/usr/bin/env node
/**
 * Client-bundle secret guard.
 *
 * Every `VITE_*` variable is compiled into the public SPA bundle, so it must
 * never carry a secret. This script fails the build when:
 *   1. an env var (process env or .env* files) or a source reference named
 *      VITE_* looks like a secret (SECRET / TOKEN / BEARER / PRIVATE / PASSWORD), or
 *   2. (`--dist`) the built output in dist/ contains secret-shaped strings.
 *
 * It NEVER prints secret values — only variable names, file paths and pattern names.
 * Public-by-design keys (Firebase / Maps `AIza…`, reCAPTCHA / Turnstile site keys)
 * are intentionally allowed.
 *
 * Usage:
 *   node scripts/check-client-env.mjs          # env + source check (prebuild)
 *   node scripts/check-client-env.mjs --dist   # also scan dist/ (postbuild)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SECRET_NAME = /SECRET|TOKEN|BEARER|PRIVATE|PASSWORD/i;
const VITE_NAME = /\bVITE_[A-Z0-9_]+\b/g;

const errors = [];

// --- 1a. Environment variables (CI env + local .env files Vite would load) ---
const envNames = new Set(Object.keys(process.env).filter((k) => k.startsWith('VITE_')));
for (const file of fs.readdirSync(ROOT)) {
  if (!/^\.env(\..+)?$/.test(file)) continue;
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?(VITE_[A-Z0-9_]+)\s*=/);
    if (m) envNames.add(`${m[1]} (${file})`);
  }
}
for (const name of envNames) {
  if (SECRET_NAME.test(name.split(' ')[0])) {
    errors.push(`Secret-looking client env var: ${name} — VITE_* values are PUBLIC. Move it server-side (Worker/Functions secret).`);
  }
}

// --- 1b. Source references to VITE_* names (src/ and app/) ---
const SRC_DIRS = ['src', 'app'].map((d) => path.join(ROOT, d)).filter((d) => fs.existsSync(d));
const SRC_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
for (const dir of SRC_DIRS) {
  for (const file of walk(dir)) {
    if (!SRC_EXT.test(file) || /__tests__|\.test\.|\.spec\./.test(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const name of new Set(text.match(VITE_NAME) || [])) {
      if (SECRET_NAME.test(name)) {
        errors.push(`Client source references secret-looking ${name} in ${path.relative(ROOT, file)}`);
      }
    }
  }
}

// --- 2. Built bundle scan ---
if (process.argv.includes('--dist')) {
  const DIST = path.join(ROOT, 'dist');
  const PATTERNS = [
    ['PRIVATE_KEY_BLOCK', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ['GITHUB_PAT_CLASSIC', /\bgh[pousr]_[A-Za-z0-9]{36}\b/],
    ['GITHUB_PAT_FINE_GRAINED', /\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
    ['WEBHOOK_SIGNING_SECRET', /\bwhsec_[A-Za-z0-9+/=]{20,}\b/],
    ['STRIPE_LIVE_SECRET', /\b[sr]k_live_[A-Za-z0-9]{16,}\b/],
    ['RAZORPAY_LIVE_KEY', /\brzp_live_[A-Za-z0-9]{10,}\b/],
    ['SLACK_TOKEN', /\bxox[abpr]-[A-Za-z0-9-]{10,}\b/],
    ['AWS_ACCESS_KEY_ID', /\bAKIA[0-9A-Z]{16}\b/],
    ['GOOGLE_OAUTH_CLIENT_SECRET', /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/],
  ];
  if (!fs.existsSync(DIST)) {
    errors.push('dist/ not found — run the build before `--dist`.');
  } else {
    const TEXT_EXT = /\.(js|mjs|cjs|css|html|json|map|txt|xml|webmanifest|svg)$/;
    for (const file of walk(DIST)) {
      if (!TEXT_EXT.test(file)) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const [label, re] of PATTERNS) {
        if (re.test(text)) {
          errors.push(`dist bundle contains [REDACTED_SECRET_${label}] in ${path.relative(ROOT, file)}`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error('\n✖ check-client-env: possible secret exposure in the client bundle\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nSee SECURITY.md → "Secrets policy". Never put secrets in VITE_* variables.\n');
  process.exit(1);
}
console.log(`✔ check-client-env: no secret-looking VITE_* vars${process.argv.includes('--dist') ? ' and no secret patterns in dist/' : ''}.`);
