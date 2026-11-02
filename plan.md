1. **Add `focus-visible:ring-*` to buttons without focus states across the app.**
   - Modify `src/App.tsx` (Sign out button, Demo mode sign in button, Reviewer sign out button)
   - Modify `src/components/ABDM/AbdmConnectModal.tsx` (Various buttons that don't have focus rings)
   - Modify `src/components/AIHelper/WearableCoachWidget.tsx` (Close button, sync button)
   - Modify `src/components/AIHelper/ChatCoach.tsx` (Voice toggle, scroll to bottom, clear chat buttons)
   - Add `focus-visible:ring-2 focus-visible:ring-current` or `focus-visible:ring-indigo-500` appropriately.

2. **Add `aria-label` to icon-only buttons**
   - Modify `src/components/Dashboard/SmartAlertCard.tsx` (if any missing, otherwise skip)
   - Modify `src/components/Dashboard/FeedbackWidget.tsx` (Submit button if needed)
   - Modify `src/components/ui/SectionErrorBoundary.tsx` (Refresh button)

3. **Verify Changes**
   - Read modified files to ensure correct replacement.
   - Run `pnpm lint` to check for syntax/type errors.
   - Run `pnpm test` to ensure tests aren't broken.

4. **Pre-commit & Submit**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
   - Request review and submit PR using title format `🎨 Palette: [UX improvement]`.
