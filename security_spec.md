# Security Spec

1. Data Invariants: 
   - A document cannot exist without a valid userId that belongs to the authenticated user.
   - Shares must increment viewCount accurately and expire correctly.
   - Audit logs are append-only.

2. The "Dirty Dozen" Payloads:
   - Setting userId to a different user's UID.
   - Deleting an audit log.
   - Updating read-only fields on a document.
   - Spoofing admin role.

3. The Test Runner: ...
