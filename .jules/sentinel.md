## 2025-03-05 - Fix Firestore Privilege Escalation and Broken Access Control
**Vulnerability:** The Firestore rules allowed unrestricted writes to user documents, enabling users to escalate privileges by setting `role: 'admin'`. Additionally, the `/analytics/globalStats` admin endpoint allowed writes by any authenticated user.
**Learning:** Overly permissive `isOwner` write rules and generic authenticated checks on admin endpoints expose the system to privilege escalation and unauthorized data modification.
**Prevention:** Explicitly restrict role modifications during user document creation and updates using `request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`, and enforce `isAdmin()` instead of `request.auth != null` for admin-only resources.
