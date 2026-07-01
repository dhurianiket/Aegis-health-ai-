## 2024-06-18 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found several recurring patterns across dashboard widgets (e.g., `RemindersWidget.tsx`) and layout overlays (`NotificationCenter.tsx`) where icon-only action buttons (e.g., "Snooze", "Complete", "Close") lacked accessible names (`aria-label`). This renders them completely silent or uninformative to screen reader users.
**Action:** When auditing or implementing new components with `lucide-react` icons acting as buttons, always verify an explicit `aria-label` is present to describe the action.

## 2024-05-24 - Missing Accessible Names on Modal Controls
**Learning:** The application extensively uses icon-only modal close buttons (`<X />`) and navigation controls without `aria-label` attributes and proper keyboard focus states. This prevents screen reader users from understanding the button's purpose and limits keyboard accessibility.
**Action:** Ensure all icon-only action buttons are decorated with descriptive `aria-label` attributes and explicit focus visible states (`focus:outline-none focus-visible:ring-2 focus-visible:ring-current`) during implementation.
