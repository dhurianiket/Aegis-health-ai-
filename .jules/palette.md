## 2024-06-18 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found several recurring patterns across dashboard widgets (e.g., `RemindersWidget.tsx`) and layout overlays (`NotificationCenter.tsx`, `ReportComparison.tsx`) where icon-only action buttons (e.g., "Snooze", "Complete", "Close") lacked accessible names (`aria-label`). This renders them completely silent or uninformative to screen reader users.
**Action:** When auditing or implementing new components with `lucide-react` icons acting as buttons, always verify an explicit `aria-label` is present to describe the action.
