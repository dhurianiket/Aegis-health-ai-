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
- No new secrets are needed for the quota/streaming release.
- Auth: **Firebase ID token only** (RS256, verified against Google JWKs). The shared-secret code path was removed in #271 and `EDGE_SHARED_SECRET` has been deleted in production (FlareOps, version d8564f17). Smoke-test with a real signed-in session.
- `wrangler.json` mirrors production settings: `"workers_dev": true` (without it a deploy disables the workers.dev URL), `"preview_urls": false`, `"observability": {"enabled": true, "head_sampling_rate": 1}`.
- Compatibility flags (in `wrangler.json`): `nodejs_compat`, `enable_request_signal` (lets the Worker cancel the upstream Gemini call when the client aborts/Stops).
- **Durable Object (Lounge daily quota):** `wrangler.json` declares binding `LOUNGE_QUOTA` → class `LoungeQuota` (exported from `src/index.ts`) with the declarative `"exports": {"LoungeQuota": {"type": "durable-object", "storage": "sqlite"}}`. The namespace is created automatically by `wrangler deploy` (not by `wrangler versions upload`); no manual command. **Rollback caveat:** once deployed, Cloudflare will not roll back to a version from before this DO class was created (d8564f17 and older). To back the feature out, deploy a fix forward (e.g. the quota fails open if the binding is removed from code), don't use `wrangler rollback`.
- Lounge quota tiers come only from the verified ID-token custom claim `aegis_plan` (or `admin: true`); no claim = free (40 messages / 150k tokens per IST day). Paid users are on the free tier until the backend sets custom claims.
- Lounge requests send `cf-aig-skip-cache: true` (no AI Gateway caching of personalised replies) and `cf-aig-collect-log-payload: false` (all requests).

## Post-deploy checks

```bash
curl -s https://api.aegishealthai.co.in/api/health
curl -s -i -X OPTIONS https://api.aegishealthai.co.in/api/ai/generate \
  -H "Origin: https://aegishealthai.co.in" -H "Access-Control-Request-Method: POST" \
  | grep -i -E "access-control-(allow|expose)-headers"   # allow: X-Aegis-Feature; expose: X-Aegis-Stream, X-Aegis-Quota-*, Retry-After
STATIC_BEARER=legacy-static-value   # any non-Firebase value; the old shared-secret path is gone
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.aegishealthai.co.in/api/ai/generate \
  -H "Authorization: Bearer $STATIC_BEARER" -H "Content-Type: application/json" -d '{}'   # expect 401
```

Then, signed in on https://aegishealthai.co.in:

1. Open Health Guides (AI) and ask a normal question. In DevTools → Network → `generate`, the response headers should show `X-Aegis-Output-Guard: pass`.
2. Ask "how many units of insulin should I take tonight?". If the model answers with a dose, the reply is replaced by the fixed RMP message (`X-Aegis-Output-Guard: replaced`).
3. Upload or scan a report. Extraction responses should show `X-Aegis-Output-Guard: off`, with dose strings untouched.
4. In the AI Gateway logs (Cloudflare dashboard), new entries should have no request or response payloads, only metadata.
5. **Streaming:** a Lounge reply should render progressively. The `generate` response has `Content-Type: text/event-stream` and `X-Aegis-Stream: 1`, and the EventStream tab shows `delta` events and a final `done` event (`"guard":"pass"`). The dosing question from step 2 ends with a `replace` event.
6. **Stop:** press Stop mid-reply. Observability logs should show the upstream call cancelled (no completed Gemini call for that request); a Stop before headers returns 499.
7. **Quota:** response headers include `X-Aegis-Quota-Remaining` and `X-Aegis-Quota-Reset`. After 40 Lounge messages in an IST day on a free account the Worker returns 429 `LOUNGE_QUOTA_EXCEEDED` with `Retry-After`, and the Lounge shows the daily-limit message with the reset time in IST. (To test without burning 40 messages, temporarily lower `LOUNGE_QUOTA_LIMITS.free` in a preview, never in production.)
8. Workers → aegishealthai-edge → Durable Objects should list the `LoungeQuota` namespace.

## Rollback

`npx wrangler@4 rollback` (or pick the previous version under Workers → aegishealthai-edge → Deployments).
The SPA keeps working against an older Worker: the `aegisFeature` and `stream` body fields are ignored, the JSON reply is shown as one chunk, and the caps are still sent by the client. Rollback cannot cross the `LoungeQuota` Durable Object creation (see above).
