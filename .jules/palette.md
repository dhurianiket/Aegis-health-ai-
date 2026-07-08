## 2025-07-08 - Icon-Only Button Accessibility and Focus States
**Learning:** The compact ExportButton relies solely on a "title" attribute for accessibility and lacks visible focus states, making it difficult for keyboard users to navigate and for screen readers to interpret correctly.
**Action:** Always include an explicit "aria-label" and "focus-visible" styling (e.g., focus-visible:ring-2) for icon-only action buttons.
