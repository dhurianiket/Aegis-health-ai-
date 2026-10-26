## 2023-10-26 - Keyboard Focus Visibility
**Learning:** Found multiple critical path buttons in `App.tsx` (like Sign Out and Modal triggers) missing focus rings, making keyboard navigation difficult for screen reader and keyboard-only users.
**Action:** When adding new buttons or fixing old ones, ensure `focus:outline-none focus-visible:ring-2 focus-visible:ring-*` are consistently applied, and use `focus-visible` over plain `focus` to prevent annoying rings on mouse clicks.
