## 2025-05-18 - Improve Mobile Menu Toggle Accessibility
**Learning:** Icon-only buttons handling important responsive UI interactions (like the mobile menu toggle) should use accessible attributes (e.g. `aria-expanded`, `aria-controls`) to inform screen readers of the state of the component they control.
**Action:** When implementing expandable menus, explicitly link the trigger button with `aria-expanded` corresponding to the menu open state.
