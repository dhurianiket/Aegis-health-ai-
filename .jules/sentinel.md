## 2024-06-11 - crypto.timingSafeEqual DoS Vulnerability
**Vulnerability:** Denial of Service caused by unhandled `TypeError` thrown from `crypto.timingSafeEqual` in `functions/src/julesWebhook.ts`.
**Learning:** `crypto.timingSafeEqual` throws an unhandled `TypeError: Input buffers must have the same byte length` if the input buffers are not of identical length. If not caught, it crashes the Node.js process, which attackers can exploit by sending webhook payloads with signatures of incorrect lengths.
**Prevention:** Always verify that input buffers are of identical length (`calculatedBuffer.byteLength !== hashBuffer.byteLength`) before calling `crypto.timingSafeEqual()`, or catch the error appropriately.
## 2025-02-28 - Insecure API Key Loading via globalThis
**Vulnerability:** The application attempted to load the Google Maps API key from multiple sources including `(globalThis as any).GOOGLE_MAPS_PLATFORM_KEY` and non-Vite-prefixed `process.env`.
**Learning:** This introduces a vulnerability where an attacker could inject an API key via XSS or DOM Clobbering by manipulating the global environment or `globalThis`. It also exposes the client bundle to unintended environments.
**Prevention:** Strictly use Vite's static injection mechanism `import.meta.env.VITE_*` to access client-exposed environment variables.
## 2025-02-28 - Express Parsing and Parameter DoS Vulnerability
**Vulnerability:** The application was vulnerable to Denial of Service via a 50MB `express.json` parsing limit and lack of type checking on parameters passed directly from `req.body` into native and external APIs.
**Learning:** Using a massive JSON parsing limit allows an attacker to exhaust server memory easily. Failing to check if `req.body.prompt` is an actual string before passing it allows prototype pollution and type mismatches.
**Prevention:** Always restrict `express.json({ limit: "1mb" })` unless large payloads are strictly required, and always validate request parameter types (e.g., `typeof param !== "string"`) before executing business logic.
## 2025-03-01 - HTTP Parameter Pollution in API Request Bodies
**Vulnerability:** The reCAPTCHA verification function manually constructed an `application/x-www-form-urlencoded` payload without URL-encoding its parameters, allowing HTTP Parameter Pollution if a malicious user injected characters like `&` or `=`.
**Learning:** When using template literals to construct URL-encoded payloads, raw strings map directly to the payload, bypassing safety checks inherent in objects/URLSearchParams.
**Prevention:** When manually constructing `application/x-www-form-urlencoded` request bodies (e.g., in `fetch` API calls), always wrap user-supplied or dynamic parameters with `encodeURIComponent()` to prevent HTTP Parameter Pollution (HPP) vulnerabilities.
## 2026-06-17 - Broken Access Control in Global Analytics
**Vulnerability:** The `firestore.rules` file allowed any authenticated user to write to the `/analytics/globalStats` collection via `allow write: if request.auth != null;`.
**Learning:** While the rule correctly required admin access to *read* the stats, it mistakenly allowed any logged-in user to *write* to them, enabling potential tampering or data corruption of global analytics.
**Prevention:** Always verify that both `read` and `write` rules for administrative paths use the `isAdmin()` function.
## 2026-06-18 - Express x-powered-by Header Technology Stack Leakage
**Vulnerability:** The Express server did not disable the `x-powered-by` header, exposing the backend technology stack.
**Learning:** By default, Express includes an `X-Powered-By: Express` HTTP response header. This broadcasts to attackers that the server is using Express, potentially aiding them in finding target-specific vulnerabilities.
**Prevention:** Always disable this header using `app.disable('x-powered-by')` as a defense-in-depth practice to prevent stack broadcasting.
