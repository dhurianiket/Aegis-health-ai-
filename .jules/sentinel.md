## 2026-07-06 - Prevent Privilege Escalation in Firestore Rules
**Vulnerability:** Users could modify their own 'role' field in Firestore to become an admin, and any authenticated user could write to global analytics stats.
**Learning:** Relying solely on 'isOwner' for user documents allows privilege escalation if sensitive fields like 'role' are stored in the same document.
**Prevention:** Explicitly restrict modifications to the 'role' field during document updates using '!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])' and enforce role checks on administrative collections.

## 2026-06-18 - Express x-powered-by Header Technology Stack Leakage
**Vulnerability:** The Express server did not disable the `x-powered-by` header, exposing the backend technology stack.
**Learning:** By default, Express includes an `X-Powered-By: Express` HTTP response header. This broadcasts to attackers that the server is using Express, potentially aiding them in finding target-specific vulnerabilities.
**Prevention:** Always disable this header using `app.disable('x-powered-by')` as a defense-in-depth practice to prevent stack broadcasting.

## 2026-07-07 - Prevent DOM Clobbering Vulnerabilities in Client Environment Variable Access
**Vulnerability:** Client-side code in `CareMap.tsx` accessed environment variables using fallbacks like `globalThis.GOOGLE_MAPS_PLATFORM_KEY`, introducing a DOM clobbering vulnerability vector.
**Learning:** Accessing variables via `globalThis` or relying on un-prefixed environment variable injections in the client allows attackers to inject malicious elements into the DOM with specific IDs, tricking the application into using compromised values.
**Prevention:** Strictly use the framework's recommended static injection method (e.g., `import.meta.env.VITE_*` in Vite) for client-side configuration, and avoid `globalThis` or arbitrary `process.env` lookups in the browser.

## 2026-07-09 - Prevent DoS Vulnerability in crypto.timingSafeEqual
**Vulnerability:** The webhook verification function used `crypto.timingSafeEqual()` without checking if the input buffers were of identical length, introducing a Denial of Service (DoS) vulnerability vector where mismatched lengths throw a TypeError.
**Learning:** `crypto.timingSafeEqual()` requires both input buffers to be of identical byte length. If they are not, it immediately throws an unhandled `TypeError`, which crashes the Node.js application or Cloud Function.
**Prevention:** Always verify that input buffers are of identical length (`bufferA.length === bufferB.length`) before executing the `crypto.timingSafeEqual()` comparison. If they do not match, return false immediately.

## 2026-07-10 - Enforce reasonable request limits and explicitly validate types
**Vulnerability:** Express body parsing allowed up to 50MB of data without type checking body parameters, causing potential DoS and unexpected crashes. Also leaked internal error details on failure.
**Learning:** The default or overly large express body limits combined with missing type validation of req.body expose the application to DoS attacks and application crash risks.
**Prevention:** When configuring Express applications, always enforce reasonable request body limits (e.g., express.json({ limit: '1mb' })) and explicitly validate parameter types from req.body to prevent DoS vulnerabilities and unexpected crashes.

## 2026-07-11 - Prevent HTTP Parameter Pollution (HPP) Vulnerabilities
**Vulnerability:** The reCAPTCHA verification function manually constructed an `application/x-www-form-urlencoded` body without URL-encoding the dynamic parameters, introducing an HTTP Parameter Pollution vulnerability.
**Learning:** When constructing form-urlencoded strings manually, failing to encode parameters allows attackers to inject `&` and `=` characters, potentially altering the request's logic or bypassing checks.
**Prevention:** Always wrap user-supplied or dynamic parameters with `encodeURIComponent()` when manually constructing `application/x-www-form-urlencoded` request bodies (e.g., in `fetch` API calls).

## 2026-07-12 - Prevent Information Leakage in Webhook Error Responses
**Vulnerability:** The GitHub webhook handler caught errors and returned the raw `error.message` in the HTTP 500 response, potentially leaking internal stack traces or third-party API error details.
**Learning:** Returning raw error messages from catch blocks directly to the client exposes internal implementation details and third-party API behaviors, which can aid attackers in mapping out internal architecture or exploiting other vulnerabilities.
**Prevention:** When implementing API error handling, prevent information leakage by avoiding sending raw error responses to the client. Always map these to generic, safe error messages.
