1. **Explore `VisualLabReportCard.tsx`** for missing `focus-visible` ring on buttons to improve keyboard navigation without adding distracting mouse click styling.
2. **Explore `SpecialistLounge.tsx`** to see if any buttons lack `focus-visible` styling or need better keyboard support.
3. **Explore `IntegrationsPanel.tsx`** to ensure it aligns with our learning about custom integration panel buttons needing visual focus indicators (which seems to be there but we can check if any are missing).
4. **Choose ONE small enhancement**: Add `focus-visible:ring-2` to buttons in `VisualLabReportCard.tsx` where they are missing. This fulfills a known UX learning (`focus-visible` over `focus` for cleaner UI).
5. **Pre-commit testing**: Run `pnpm lint`, `pnpm build`, and tests for verification.
6. **Submit PR**: Format according to Palette persona constraints.
