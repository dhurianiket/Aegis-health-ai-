## 2024-08-01 - Add aria-labels for Close buttons
**Learning:** Found multiple instances of icon-only Close buttons (using Lucide X icon) missing aria-labels.
**Action:** Always add descriptive `aria-label`s (e.g. 'Close') to icon-only interactive elements to ensure they are accessible to screen readers.
## 2025-03-01 - Add aria-labels for Close buttons
**Learning:** Found multiple instances of icon-only Close buttons (using Lucide X icon) missing aria-labels.
**Action:** Always add descriptive `aria-label`s (e.g. "Close modal") to icon-only interactive elements to ensure they are accessible to screen readers, along with focus-visible classes for keyboard navigation.
## 2025-03-09 - Ensure bottom sheets are keyboard accessible
**Learning:** Bottom sheets that use a list of grid buttons for navigation without explicit outline overrides hide default focus rings, failing keyboard accessibility.
**Action:** Always add `focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]` to icon-heavy navigation buttons (especially ones rendering in a modal/bottom sheet context).
## 2025-03-09 - Prefer focus-visible over focus for interactive cards
**Learning:** Using standard `focus:ring-2` on clickable UI cards (like ConditionTile) creates distracting visual noise when users click them with a mouse, leading to a degraded experience.
**Action:** When styling cards or buttons that act as primary navigation, always replace `focus:ring-*` with `focus-visible:ring-*` (alongside `focus:outline-none`) to preserve accessibility for keyboard users while maintaining a clean look for mouse/touch interactions.
## 2025-03-09 - Accessible Disabled State Management for Interstitial CTAs
**Learning:** Empty state cards (like in the Dashboard) often use `opacity-70 cursor-not-allowed` to visually indicate a disabled state without setting the `disabled` HTML attribute or an `aria-label` explaining *why* they are disabled. This fails both visual state management for assistive tech and general UX clarity.
**Action:** When styling "Coming Soon" or conditionally locked buttons, always explicitly add the HTML `disabled` attribute and an `aria-label` (e.g., `aria-label="Action (Coming Soon)"` or `aria-label="Action (Unlock by doing X)"`) to clearly communicate the state and requirement to screen readers.
