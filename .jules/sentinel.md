## 2024-03-24 - [HTTP Parameter Pollution in reCAPTCHA verification]
**Vulnerability:** HTTP Parameter Pollution via unencoded token variable in application/x-www-form-urlencoded body.
**Learning:** Variables were interpolated directly into the body without URL encoding, allowing potential injection of additional form fields.
**Prevention:** Always use encodeURIComponent when interpolating dynamic parameters into URL-encoded bodies.
## 2025-02-28 - [PHI Leakage in Production Logs]
**Vulnerability:** Raw AI responses and normalized lab values (PHI/PII) were logged to the console without environment checks.
**Learning:** Development observability code was unintentionally deployed to production, exposing sensitive patient data in browser consoles and potentially downstream monitoring tools.
**Prevention:** Always wrap sensitive `console.log` statements with `if (import.meta.env.DEV)` to ensure they are stripped or disabled in production builds.
