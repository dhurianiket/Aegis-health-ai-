## 2024-07-09 - Accessible Icon Buttons
**Learning:** Found a recurring pattern where icon-only buttons (like `X` for close or remove) lack both `aria-label`s for screen readers and visible focus states for keyboard users.
**Action:** Always ensure icon-only action buttons have descriptive `aria-label` attributes and appropriate focus classes (like `focus:outline-none focus-visible:ring-2 focus-visible:ring-current`) in this codebase.
