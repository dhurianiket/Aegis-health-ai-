## 2024-05-24 - Icon-Only Buttons Require ARIA Labels
**Learning:** Found an accessibility issue where the close button (`<button><X /></button>`) in `NotificationDropdown.tsx` lacked an `aria-label`. This pattern is common for icon-only buttons and makes them inaccessible to screen readers.
**Action:** When implementing icon-only buttons, always ensure an `aria-label` is provided to describe the action.
