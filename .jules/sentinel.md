## Sentinel Journal
## 2026-05-29 - Sanitize Server Error Responses
**Vulnerability:** The Express backend `server.ts` was leaking raw API error details (`errBody`) and internal error messages (`e.message`) in the 500 response payloads for the `/api/generate-visit-prep` endpoint.
**Learning:** It is crucial to decouple internal logging from client-facing error responses to avoid information disclosure. Detailed errors should be logged server-side, while clients receive generic failure messages.
**Prevention:** Standardize API error handling to always return sanitized, generic error payloads in catch blocks and failed network requests, relying on `console.error` (or a logger) for detailed telemetry.
