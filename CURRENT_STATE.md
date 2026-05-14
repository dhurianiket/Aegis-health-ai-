# Aegis Health Intelligence - Development Tracker

This document is the single source of truth for the app’s current status.

## Current Local Status (Implemented locally)
The following files were changed in the latest fix session:
- `src/components/Specialists/SpecialistLounge.tsx`
- `src/services/usageService.ts`
- `src/components/Admin/AdminDashboard.tsx`
- `firebase.json`
- `firestore.rules`

### Local Code Status
- **SpecialistLounge React #310**: Implemented locally. Hook-order issue addressed by moving conditional early returns below all hook declarations.
- **Admin Dashboard Permission Handling**: Implemented locally. Enforced strict admin role checks before performing `collectionGroup` fetches, with graceful fallback UI for non-admins.
- **Global Stats Tracking**: Implemented locally. Ensured best-effort writes by silently wrapping errors to prevent unhandled promise rejections on permission failures for non-admin users.
- **Firebase Hosting COOP Policies**: Implemented locally. Updated header matcher in `firebase.json` to properly apply `Cross-Origin-Opener-Policy: same-origin-allow-popups` to `/**` to resolve Google Auth popup warnings.
- **Build / Lint**: Passed locally.

## Current Deployment Status (Pending deployment)
- **Firestore Rules**: Pending deployment. Must be deployed manually via `firebase deploy --only firestore:rules` or through GitHub Actions.
- **Firebase Hosting**: Pending deployment. Must be deployed manually via `firebase deploy --only hosting` or through GitHub Actions.

## Last Known Production Symptoms (Before Redeploy)
- React minified error #310 triggered when using `SpecialistLounge.tsx`.
- Uncaught "Missing or insufficient permissions" failures generated in `AdminDashboard.tsx` for non-admin users.
- `Global stats tracking error: FirebaseError: Missing or insufficient permissions` logging as uncaught error.
- Browser warnings: `Cross-Origin-Opener-Policy policy would block the window.closed call` blocking Google sign-in.

## Production Verification Status (Pending production verification)
- Verification cannot be completed until the deployment succeeds. 
- Required Next Steps:
  1. Push changes to remote.
  2. Let GitHub Actions deploy, or deploy manually via Firebase CLI.
  3. Retest production URL.
  4. Update this document's status based solely on live runtime evidence.
