## 2024-08-01 - Add aria-labels for Close buttons
**Learning:** Found multiple instances of icon-only Close buttons (using Lucide X icon) missing aria-labels.
**Action:** Always add descriptive `aria-label`s (e.g. 'Close') to icon-only interactive elements to ensure they are accessible to screen readers.
## 2025-03-01 - Add aria-labels for Close buttons
**Learning:** Found multiple instances of icon-only Close buttons (using Lucide X icon) missing aria-labels.
**Action:** Always add descriptive `aria-label`s (e.g. "Close modal") to icon-only interactive elements to ensure they are accessible to screen readers, along with focus-visible classes for keyboard navigation.
## 2025-03-09 - Ensure bottom sheets are keyboard accessible
**Learning:** Bottom sheets that use a list of grid buttons for navigation without explicit outline overrides hide default focus rings, failing keyboard accessibility.
**Action:** Always add `focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]` to icon-heavy navigation buttons (especially ones rendering in a modal/bottom sheet context).
