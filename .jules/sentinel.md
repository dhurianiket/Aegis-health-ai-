## 2024-06-11 - crypto.timingSafeEqual DoS Vulnerability
**Vulnerability:** Denial of Service caused by unhandled `TypeError` thrown from `crypto.timingSafeEqual` in `functions/src/julesWebhook.ts`.
**Learning:** `crypto.timingSafeEqual` throws an unhandled `TypeError: Input buffers must have the same byte length` if the input buffers are not of identical length. If not caught, it crashes the Node.js process, which attackers can exploit by sending webhook payloads with signatures of incorrect lengths.
**Prevention:** Always verify that input buffers are of identical length (`calculatedBuffer.byteLength !== hashBuffer.byteLength`) before calling `crypto.timingSafeEqual()`, or catch the error appropriately.
## 2025-02-28 - Insecure API Key Loading via globalThis
**Vulnerability:** The application attempted to load the Google Maps API key from multiple sources including `(globalThis as any).GOOGLE_MAPS_PLATFORM_KEY` and non-Vite-prefixed `process.env`.
**Learning:** This introduces a vulnerability where an attacker could inject an API key via XSS or DOM Clobbering by manipulating the global environment or `globalThis`. It also exposes the client bundle to unintended environments.
**Prevention:** Strictly use Vite's static injection mechanism `import.meta.env.VITE_*` to access client-exposed environment variables.
