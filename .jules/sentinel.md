## Sentinel Journal
## 2026-05-29 - Sanitize Server Error Responses
**Vulnerability:** The Express backend `server.ts` was leaking raw API error details (`errBody`) and internal error messages (`e.message`) in the 500 response payloads for the `/api/generate-visit-prep` endpoint.
**Learning:** It is crucial to decouple internal logging from client-facing error responses to avoid information disclosure. Detailed errors should be logged server-side, while clients receive generic failure messages.
**Prevention:** Standardize API error handling to always return sanitized, generic error payloads in catch blocks and failed network requests, relying on `console.error` (or a logger) for detailed telemetry.

## 2026-05-30 - Prevent Privilege Escalation via Firestore Rules
**Vulnerability:** A critical Privilege Escalation vulnerability existed in `firestore.rules`. Users could write to their own user document without restrictions. Because the `isAdmin()` function relies on the `role` field within the user's document, any user could arbitrarily grant themselves admin privileges by setting `role: 'admin'`.
**Learning:** Broad `allow write` rules on user-controlled documents are dangerous when specific fields govern authorization logic. Firestore rules must evaluate the structure and content of incoming updates (`request.resource.data`) to prevent tampering with sensitive fields like roles or permissions.
**Prevention:** Split `write` permissions into granular `create`, `update`, and `delete` operations. Enforce strict checks on `create` and `update` to ensure users cannot add or modify critical authorization fields (like `role`) while still allowing legitimate profile updates.
