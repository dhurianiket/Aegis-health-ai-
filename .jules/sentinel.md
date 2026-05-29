## 2025-05-28 - Replace Math.random() with Cryptographically Secure randomUUID
**Vulnerability:** Weak pseudo-random number generator `Math.random()` was used to generate UUIDs/identifiers in ToastContext.tsx.
**Learning:** `Math.random()` is not cryptographically secure, and can be predictable. It is a best practice to use `crypto.randomUUID()` when a reliable unique identifier is needed, even in contexts like Toast messages to ensure consistency and defensive coding practices across the app.
**Prevention:** Replace instances of `Math.random()` string manipulations designed to create IDs with `crypto.randomUUID()` natively supported by browsers.
