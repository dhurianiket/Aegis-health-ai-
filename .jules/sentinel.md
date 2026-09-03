## 2024-03-24 - [HTTP Parameter Pollution in reCAPTCHA verification]
**Vulnerability:** HTTP Parameter Pollution via unencoded token variable in application/x-www-form-urlencoded body.
**Learning:** Variables were interpolated directly into the body without URL encoding, allowing potential injection of additional form fields.
**Prevention:** Always use encodeURIComponent when interpolating dynamic parameters into URL-encoded bodies.
## 2025-02-28 - [PHI Leakage in Production Logs]
**Vulnerability:** Raw AI responses and normalized lab values (PHI/PII) were logged to the console without environment checks.
**Learning:** Development observability code was unintentionally deployed to production, exposing sensitive patient data in browser consoles and potentially downstream monitoring tools.
**Prevention:** Always wrap sensitive `console.log` statements with `if (import.meta.env.DEV)` to ensure they are stripped or disabled in production builds.
## 2026-08-02 - [Insecure Randomness for Unique IDs and Render Keys]
**Vulnerability:** Weak pseudo-random number generators (`Math.random()`) were used to generate unique identifiers (Toast IDs) and render keys/states (percentile values).
**Learning:** Using predictable randomness can lead to ID collisions or allow attackers to predict UI states, failing SAST checks.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` for identifiers, or deterministic object property hashing for stable rendering logic that doesn't trigger security flags.
## 2025-03-08 - [DoS Vulnerability in Webhook Signature Verification]
**Vulnerability:** `crypto.timingSafeEqual` was used without verifying that input buffers have the exact same length.
**Learning:** Node.js throws an exception ('Input buffers must have the same byte length') if the lengths differ, which can lead to Denial of Service (DoS) vulnerabilities or unhandled rejections if not properly caught.
**Prevention:** Always verify that input buffers have the exact same length before comparing them with `crypto.timingSafeEqual` (e.g., `if (a.length !== b.length) return false;`).
## 2024-05-18 - [DOM-based XSS in PDF Exporter]
**Vulnerability:** Dynamic inputs like patient demographics and clinical records were directly interpolated into a hidden DOM element via `innerHTML` during PDF generation (html-to-image). This allowed malicious payloads in input fields to execute in the browser context.
**Learning:** Even though the DOM is hidden and only used for generating a PDF, standard DOM injection vulnerabilities still apply because `innerHTML` executes inline scripts and fetches assets.
**Prevention:** Always sanitize or HTML-escape dynamic content before injecting it into `innerHTML`, even if the element is not visibly appended to the main document body.
## 2026-08-29 - [Privilege Escalation via Missing Grouping in Firestore Rules]
**Vulnerability:** A missing grouping structure in the Firestore rules 'allow create' condition could bypass ownership checks if evaluated incorrectly by the rules engine.
**Learning:** In Firestore rules (CEL), operator precedence issues can be prevented by explicitly wrapping compound logic with parentheses (e.g., `isOwner(userId) && (!('role' in request.resource.data) || request.resource.data.role != 'admin')`). Additionally, checking for key existence via `'key' in map` is a concise alternative to `.keys().hasAny()`.
**Prevention:** Always use explicit parentheses for compound conditional checks in `firestore.rules` to strictly enforce operator precedence, and use idiomatic CEL checks.
## 2024-03-24 - [Insecure Cryptographic Identifiers in ABDM Integration]
**Vulnerability:** Weak pseudo-random number generators (`Math.random()`) were used to generate cryptographic nonces, tokens, and IDs in ABDM integration, allowing an attacker to predict tokens and bypass data consent validation on ABDM endpoints.
**Learning:** Using predictable randomness for cryptographic payloads can lead to potential token collisions and signature forgery, severely compromising system security.
**Prevention:** Always use cryptographically secure methods like `crypto.randomUUID()` or `crypto.getRandomValues()` for identifiers and tokens that require high entropy and uniqueness.
