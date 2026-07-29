## 2024-03-24 - Express App JSON Body Parsing Limit
**Vulnerability:** Found `express.json({ limit: "50mb" })` in `server.ts`.
**Learning:** Accepting unnecessarily large JSON payloads creates a Denial of Service (DoS) vulnerability via memory exhaustion during parsing, even if rate limiting is present.
**Prevention:** Always scope JSON body limits to the minimum necessary size (e.g., `1mb`) unless a specific endpoint fundamentally requires larger payloads (like file uploads), which should then be handled via dedicated streaming or multipart middleware.

## 2024-03-24 - API Parameter Validation Missing
**Vulnerability:** Found `const prompt = req.body.prompt; if (!prompt) return...` in `server.ts` without type or length checks.
**Learning:** Checking for truthiness is insufficient for security. Missing type checks can lead to unexpected crashes or downstream type coercion bugs. Missing length checks can lead to token exhaustion in connected AI services or DoS.
**Prevention:** Always explicitly validate the `typeof` and set reasonable `length` bounds for user-supplied string inputs on API endpoints.

## 2024-03-24 - HTTP Parameter Pollution in URL-Encoded Bodies
**Vulnerability:** Found unencoded string interpolation `body: \`secret=${secretKey}&response=${token}\`` in `functions/src/index.ts`.
**Learning:** If user-supplied or dynamic variables contain `&` or `=`, they can prematurely terminate parameters or inject new ones, altering the intended API request payload structure.
**Prevention:** Always wrap variables with `encodeURIComponent()` when constructing `application/x-www-form-urlencoded` request bodies manually.

## 2024-05-18 - Privilege Escalation in Firestore Create Rules
**Vulnerability:** Found `allow create, delete: if isOwner(userId) || isAdmin();` in `firestore.rules` which allowed a new user to set `role: 'admin'` upon document creation.
**Learning:** Users creating their own document can set arbitrary fields. `update` rules handle diffs, but `create` rules need explicit checks for sensitive fields.
**Prevention:** Always restrict sensitive fields like `role` in `create` rules using `!('role' in request.resource.data) || request.resource.data.role != 'admin'`, wrapped in explicit parentheses for proper precedence.

## 2024-03-24 - crypto.timingSafeEqual Length Mismatch Crash & Webhook Error Leakage
**Vulnerability:** Found `crypto.timingSafeEqual` used without length checks in `functions/src/julesWebhook.ts` and error message leakage in the catch block.
**Learning:** `crypto.timingSafeEqual` throws an exception if buffers are of different lengths. If an attacker sends an improperly sized signature, it causes an unhandled exception. Additionally, exposing `error.message` in HTTP 500 responses leaks internal stack or state details.
**Prevention:** Always compare buffer lengths before passing them to `timingSafeEqual`. Always return generic error messages to clients, logging the actual error internally.
