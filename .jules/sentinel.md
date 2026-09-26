## 2025-03-09 - Insecure Randomness in DPDP Erasure
**Vulnerability:** Use of Math.random() for generating sensitive DPDP erasure receipt IDs.
**Learning:** Math.random() is predictable and flagged by SAST tools for insecure randomness in sensitive operations.
**Prevention:** Always use crypto.randomUUID() or window.crypto for generating identifiers, tokens, and receipts.
## 2023-10-27 - Fix XSS Vulnerability in OPD Consultation PDF Generation
**Vulnerability:** Use of innerHTML without robust HTML sanitization leaves application vulnerable to Cross-Site Scripting (XSS). Custom escape functions may be bypassed.
**Learning:** Always use a well-maintained library like DOMPurify when assigning untrusted data to innerHTML, even if it's meant to be hidden or converted to an image.
**Prevention:** Strictly enforce the use of DOMPurify for all innerHTML assignments across the codebase.
