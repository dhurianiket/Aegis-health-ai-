## FEATURE:
Integrate high-performance interactive UI components from `dev-resources/react-bits` (SpotlightCard, DecryptedText, CountUp) into Aegis Health AI to elevate the landing page and clinical telemetry presentation while maintaining 100% accessibility (WCAG AA), zero secret leaks, and full TypeScript type safety.

## EXAMPLES:
- `/Volumes/DEOYANI SSD/antigravity workspace /deoyani ott workspace/dev-resources/react-bits/src/ts-tailwind/Components/SpotlightCard/SpotlightCard.tsx`: Pointer-reactive radial flashlight cursor tracking.
- `/Volumes/DEOYANI SSD/antigravity workspace /deoyani ott workspace/dev-resources/react-bits/src/ts-tailwind/TextAnimations/DecryptedText/DecryptedText.tsx`: Accessible cyber-decryption text animation with `sr-only` screen reader support and `aria-hidden` encrypted glyphs.
- `/Volumes/DEOYANI SSD/antigravity workspace /deoyani ott workspace/dev-resources/react-bits/src/ts-tailwind/TextAnimations/CountUp/CountUp.tsx`: Spring-driven numeric counter using `motion/react` with intersection observer triggering.

## DOCUMENTATION:
- Motion library for React: https://motion.dev/ (using `motion/react` already bundled in Aegis)
- WCAG 2.2 Screen Reader text accessibility: https://www.w3.org/WAI/tutorials/forms/labels/
- Project Invariant: React 19 + Vite 6 + Tailwind CSS 4 + TypeScript 5.8.

## OTHER CONSIDERATIONS:
- **No extra dependencies**: Must use existing `motion/react` already present in `package.json`.
- **Accessibility first**: Any animated text MUST preserve `sr-only` real text so screen readers never read scrambled glyphs (preserving Jules Palette learnings).
- **Strict Color Tokens**: Match Aegis cyber-medical aesthetic (emerald-400, teal-400, cyan-400, amber-400, purple-400, deep navy backgrounds `#0A192F` and `#071325`).
- **Validation Gates**: Must pass `npx tsc --noEmit`, `npx vitest run`, `npm run check:secrets`, and `ggshield secret scan`.
