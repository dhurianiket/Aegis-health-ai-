## 2025-03-09 - Insecure Randomness in DPDP Erasure
**Vulnerability:** Use of Math.random() for generating sensitive DPDP erasure receipt IDs.
**Learning:** Math.random() is predictable and flagged by SAST tools for insecure randomness in sensitive operations.
**Prevention:** Always use crypto.randomUUID() or window.crypto for generating identifiers, tokens, and receipts.
