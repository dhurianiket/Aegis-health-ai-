## 2025-03-09 - Insecure Randomness in DPDP Erasure
**Vulnerability:** Use of Math.random() for generating sensitive DPDP erasure receipt IDs.
**Learning:** Math.random() is predictable and flagged by SAST tools for insecure randomness in sensitive operations.
**Prevention:** Always use crypto.randomUUID() or window.crypto for generating identifiers, tokens, and receipts.
## 2023-10-27 - Fix XSS Vulnerability in OPD Consultation PDF Generation
**Vulnerability:** Use of innerHTML without robust HTML sanitization leaves application vulnerable to Cross-Site Scripting (XSS). Custom escape functions may be bypassed.
**Learning:** Always use a well-maintained library like DOMPurify when assigning untrusted data to innerHTML, even if it's meant to be hidden or converted to an image.
**Prevention:** Strictly enforce the use of DOMPurify for all innerHTML assignments across the codebase.
## 2025-03-09 - Insecure Randomness in Message IDs
**Vulnerability:** Use of `Math.random()` to generate the suffix for collision-resistant message IDs in `buildMessageId`.
**Learning:** `Math.random()` is not cryptographically secure and will be flagged by SAST tools. When replacing it with `crypto.randomUUID()` substrings, remember that UUIDs are hexadecimal (base-16) whereas `Math.random().toString(36)` is base-36, so extracting the same number of characters results in lower entropy.
**Prevention:** Use `crypto.randomUUID()` or `crypto.getRandomValues()` for collision-resistant identifiers, and ensure the resulting string provides adequate entropy.
