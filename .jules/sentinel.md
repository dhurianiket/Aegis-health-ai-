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
