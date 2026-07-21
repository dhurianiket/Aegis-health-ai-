## 2024-05-18 - Missing ARIA Labels on Close Buttons
**Learning:** Icon-only close buttons (like `<X size={20} />` in `ReportComparison.tsx`) often lack `aria-label` attributes and focus styles, making them inaccessible to screen readers and keyboard users.
**Action:** Always verify that icon-only interactive elements contain `aria-label` and `focus-visible` styles when building or reviewing components.
