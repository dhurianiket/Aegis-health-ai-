## 2024-06-11 - crypto.timingSafeEqual DoS Vulnerability
**Vulnerability:** Denial of Service caused by unhandled `TypeError` thrown from `crypto.timingSafeEqual` in `functions/src/julesWebhook.ts`.
**Learning:** `crypto.timingSafeEqual` throws an unhandled `TypeError: Input buffers must have the same byte length` if the input buffers are not of identical length. If not caught, it crashes the Node.js process, which attackers can exploit by sending webhook payloads with signatures of incorrect lengths.
**Prevention:** Always verify that input buffers are of identical length (`calculatedBuffer.byteLength !== hashBuffer.byteLength`) before calling `crypto.timingSafeEqual()`, or catch the error appropriately.
