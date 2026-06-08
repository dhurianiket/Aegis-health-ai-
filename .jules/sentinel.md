## 2024-05-18 - Math.random() usage for IDs
**Vulnerability:** Weak Random Number Generation in `src/context/ToastContext.tsx`.
**Learning:** `Math.random` was being used to generate unique identifiers. While low impact for UI components, this is a known anti-pattern that can lead to collisions.
**Prevention:** Use `crypto.randomUUID()` for generating random identifiers, as it utilizes the secure Web Crypto API.
