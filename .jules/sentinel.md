## 2025-03-09 - Insecure Randomness in DPDP Erasure
**Vulnerability:** Use of Math.random() for generating sensitive DPDP erasure receipt IDs.
**Learning:** Math.random() is predictable and flagged by SAST tools for insecure randomness in sensitive operations.
**Prevention:** Always use crypto.randomUUID() or window.crypto for generating identifiers, tokens, and receipts.
## 2023-10-27 - Fix XSS Vulnerability in OPD Consultation PDF Generation
**Vulnerability:** Use of innerHTML without robust HTML sanitization leaves application vulnerable to Cross-Site Scripting (XSS). Custom escape functions may be bypassed.
**Learning:** Always use a well-maintained library like DOMPurify when assigning untrusted data to innerHTML, even if it's meant to be hidden or converted to an image.
**Prevention:** Strictly enforce the use of DOMPurify for all innerHTML assignments across the codebase.
## 2023-10-27 - Fix API Key Exposure in URL Query String
**Vulnerability:** External API calls (e.g., to Google Gemini API) transmitted sensitive API keys via the URL query string (`?key=...`).
**Learning:** Full URLs, including query strings, are often logged in plaintext by reverse proxies, web servers, APM tools, and browser history, leading to potential credential leakage.
**Prevention:** Always transmit sensitive tokens and API keys via secure HTTP headers (e.g., `Authorization` or `x-goog-api-key`) when making outbound requests, as headers are generally excluded from standard access logs and encrypted in transit via TLS.
