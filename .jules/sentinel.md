## 2025-03-09 - Insecure Randomness in DPDP Erasure
**Vulnerability:** Use of Math.random() for generating sensitive DPDP erasure receipt IDs.
**Learning:** Math.random() is predictable and flagged by SAST tools for insecure randomness in sensitive operations.
**Prevention:** Always use crypto.randomUUID() or window.crypto for generating identifiers, tokens, and receipts.
## 2023-10-27 - Fix XSS Vulnerability in OPD Consultation PDF Generation
**Vulnerability:** Use of innerHTML without robust HTML sanitization leaves application vulnerable to Cross-Site Scripting (XSS). Custom escape functions may be bypassed.
**Learning:** Always use a well-maintained library like DOMPurify when assigning untrusted data to innerHTML, even if it's meant to be hidden or converted to an image.
**Prevention:** Strictly enforce the use of DOMPurify for all innerHTML assignments across the codebase.

## 2024-10-06 - Prevent API Key Leakage in Proxy Logs
**Vulnerability:** Google Gemini API key passed via URL query parameters (`?key=...`) in `server.ts` and `workers/aegishealthai-edge/src/index.ts`.
**Learning:** Query parameters are often recorded in server and proxy access logs, risking credential exposure even over HTTPS.
**Prevention:** Always pass sensitive credentials like API keys via secure HTTP headers (e.g., `x-goog-api-key`) rather than URL strings.

