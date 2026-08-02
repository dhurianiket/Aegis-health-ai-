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
