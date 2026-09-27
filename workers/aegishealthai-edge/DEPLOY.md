# aegishealthai-edge — deploy notes

The live Worker at `api.aegishealthai.co.in` is built from **this directory**
(`workers/aegishealthai-edge`, config `wrangler.json`). Do not deploy from other
local copies of a Worker with the same name.

## Deploy (FlareOps)

```bash
git checkout main && git pull
cd workers/aegishealthai-edge
npx wrangler@4 deploy --dry-run --outdir /tmp/aegis-edge-dryrun   # bundle check, no upload
npx wrangler@4 deploy                                              # uses wrangler.json
```

- Secrets used: `GEMINI_API_KEY`, optional `CF_AIG_TOKEN`, `TURNSTILE_SECRET`/`TURNSTILE_ENFORCE`.
- Auth: **Firebase ID token only** (RS256, verified against Google JWKs). The shared-secret code path was removed in `fix/lounge-phase1-followups`; after deploying, delete the now-unused secret: `npx wrangler@4 secret delete EDGE_SHARED_SECRET` (safe if it does not exist — wrangler just reports it). Smoke-test with a real signed-in session.
- Compatibility flags (in `wrangler.json`): `nodejs_compat`, `enable_request_signal` (lets the Worker cancel the upstream Gemini call when the client aborts/Stops).
- Lounge requests send `cf-aig-skip-cache: true` (no AI Gateway caching of personalised replies) and `cf-aig-collect-log-payload: false` (all requests).

## Post-deploy checks

```bash
curl -s https://api.aegishealthai.co.in/api/health
curl -s -i -X OPTIONS https://api.aegishealthai.co.in/api/ai/generate \
  -H "Origin: https://aegishealthai.co.in" -H "Access-Control-Request-Method: POST" \
  | grep -i access-control-allow-headers      # now includes X-Aegis-Feature
```

Then, signed in on https://aegishealthai.co.in:

1. Open Health Guides (AI) and ask a normal question. In DevTools → Network → `generate`, the response headers should show `X-Aegis-Output-Guard: pass`.
2. Ask "how many units of insulin should I take tonight?". If the model answers with a dose, the reply is replaced by the fixed RMP message (`X-Aegis-Output-Guard: replaced`).
3. Upload or scan a report. Extraction responses should show `X-Aegis-Output-Guard: off`, with dose strings untouched.
4. In the AI Gateway logs (Cloudflare dashboard), new entries should have no request or response payloads, only metadata.

## Rollback

`npx wrangler@4 rollback` (or pick the previous version under Workers → aegishealthai-edge → Deployments).
The SPA keeps working against the old Worker: the `aegisFeature` body field is ignored and the caps are still sent by the client.
