## 2026-07-06 - Prevent Privilege Escalation in Firestore Rules
**Vulnerability:** Users could modify their own 'role' field in Firestore to become an admin, and any authenticated user could write to global analytics stats.
**Learning:** Relying solely on 'isOwner' for user documents allows privilege escalation if sensitive fields like 'role' are stored in the same document.
**Prevention:** Explicitly restrict modifications to the 'role' field during document updates using '!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])' and enforce role checks on administrative collections.
