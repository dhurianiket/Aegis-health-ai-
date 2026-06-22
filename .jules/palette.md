## 2025-02-18 - Missing ARIA Labels on Close Buttons
**Learning:** Icon-only close buttons (`<X />`) in this codebase frequently omit `aria-label`s, which is an accessibility issue for screen readers.
**Action:** Always ensure `aria-label` attributes are included on any newly created icon-only interactive elements like close buttons, following the standard accessibility patterns.
