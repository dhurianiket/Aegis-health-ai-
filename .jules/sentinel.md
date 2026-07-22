## 2025-02-28 - Firestore Rules Evaluation Error on Write
**Vulnerability:** Privilege escalation via self-assigned `role` updates.
**Learning:** Applying data-diffing restrictions (e.g., `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])`) globally to a `write` rule causes evaluation errors during document creation and deletion because `resource` is null during create and `request.resource` is null during delete.
**Prevention:** Always split `write` rules into explicit `create`, `delete`, and `update` rules when enforcing data mutation boundaries on existing fields.
