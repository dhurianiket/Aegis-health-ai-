## 2026-07-06 - Prevent Privilege Escalation in Firestore Rules
**Vulnerability:** Users could modify their own 'role' field in Firestore to become an admin, and any authenticated user could write to global analytics stats.
**Learning:** Relying solely on 'isOwner' for user documents allows privilege escalation if sensitive fields like 'role' are stored in the same document.
**Prevention:** Explicitly restrict modifications to the 'role' field during document updates using '!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])' and enforce role checks on administrative collections.

## 2026-06-18 - Express x-powered-by Header Technology Stack Leakage
**Vulnerability:** The Express server did not disable the `x-powered-by` header, exposing the backend technology stack.
**Learning:** By default, Express includes an `X-Powered-By: Express` HTTP response header. This broadcasts to attackers that the server is using Express, potentially aiding them in finding target-specific vulnerabilities.
**Prevention:** Always disable this header using `app.disable('x-powered-by')` as a defense-in-depth practice to prevent stack broadcasting.
