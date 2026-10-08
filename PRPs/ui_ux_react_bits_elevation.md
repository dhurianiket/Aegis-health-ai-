# PRP: UI/UX Elevation with React-Bits Components

## Goal
Elevate the Aegis Health AI landing page (`LandingPage.tsx`) by integrating three high-performance, accessible visual components adapted from `/Volumes/DEOYANI SSD/antigravity workspace /deoyani ott workspace/dev-resources/react-bits`:
1. `SpotlightCard`: Interactive radial spotlight that tracks cursor movement across clinical feature cards and ABHA gateway cards.
2. `DecryptedText`: Cyber-medical character decryption animation with full accessibility (`sr-only` real text + `aria-hidden` scrambled characters).
3. `CountUp`: Spring-animated counter for clinical accuracy and speed metrics (e.g. 99.4%, 10+, 100%).

## Why
- **User Impact**: First impressions dictate trust in healthcare AI. A clinical intelligence engine handling lab reports and prescriptions needs an interface that feels responsive, modern, and trustworthy.
- **Auditing Resources**: Exploits the tested, performant components in `dev-resources/react-bits` while honoring project constraints (no new packages, vanilla Tailwind 4, `motion/react`).
- **Accessibility & Compliance**: Zero regressions on screen readers, full keyboard compatibility, zero secret leaks.

## What
### Components to Create:
- `src/components/ui/SpotlightCard.tsx`
- `src/components/ui/DecryptedText.tsx`
- `src/components/ui/CountUp.tsx`
- Unit tests in `src/components/ui/__tests__/`

### Integration Points:
- `src/components/LandingPage/LandingPage.tsx`:
  - Enhance Hero badge with `DecryptedText` ("Next-Gen Health Intelligence 2.0")
  - Replace static cards in ABHA Gateway and Features with `SpotlightCard`
  - Enhance statistics counter bar with `CountUp` (99.4% Parsing Precision, 10+ AI Specialists, 100% DPDP 2023 Compliant)

## Success Criteria
- [ ] `src/components/ui/SpotlightCard.tsx` renders smoothly and handles mouse move / enter / leave / focus events with radial spotlight gradient.
- [ ] `src/components/ui/DecryptedText.tsx` renders accessible text with `sr-only` real text and scrambled display text, supporting hover and view triggers.
- [ ] `src/components/ui/CountUp.tsx` animates numeric counters using spring physics when scrolled into view.
- [ ] Comprehensive unit tests cover all three components.
- [ ] Zero type errors (`npx tsc --noEmit`).
- [ ] 100% test pass rate across existing 991 tests plus new tests.
- [ ] `npm run check:secrets` passes with zero leaks.

## Implementation Tasks

### Task 1: Create `src/components/ui/SpotlightCard.tsx`
- Mirror pattern from `dev-resources/react-bits/src/ts-tailwind/Components/SpotlightCard/SpotlightCard.tsx`
- Support customizable `spotlightColor`, `className`, border radii, and children.

### Task 2: Create `src/components/ui/DecryptedText.tsx`
- Mirror pattern from `dev-resources/react-bits/src/ts-tailwind/TextAnimations/DecryptedText/DecryptedText.tsx`
- Import from `motion/react`
- Include `sr-only` text and `aria-hidden` animated glyphs.

### Task 3: Create `src/components/ui/CountUp.tsx`
- Mirror pattern from `dev-resources/react-bits/src/ts-tailwind/TextAnimations/CountUp/CountUp.tsx`
- Import from `motion/react`
- Handle decimal places, separators, and intersection observer once trigger.

### Task 4: Write Unit Tests
- `src/components/ui/__tests__/SpotlightCard.test.tsx`
- `src/components/ui/__tests__/DecryptedText.test.tsx`
- `src/components/ui/__tests__/CountUp.test.tsx`

### Task 5: Integrate into `LandingPage.tsx`
- Add `DecryptedText` to hero banner and security banner.
- Add `CountUp` to clinical stats bar.
- Wrap feature cards in `SpotlightCard` with emerald/teal/amber spotlights.

## Validation Gates
```bash
# 1. Type Check
npx tsc --noEmit

# 2. Test Suite
npx vitest run

# 3. Secret Scans
npm run check:secrets
ggshield secret scan pre-commit
```

## Anti-Patterns to Avoid
- Do NOT install any external packages (use existing `motion/react`).
- Do NOT leave scrambled text readable by screen readers (always use `sr-only` for real text).
- Do NOT use unconstrained timers or memory leaks (always clean up RAF/interval in `useEffect` returns).
- Do NOT break existing tests or design tokens.

**Confidence Score**: 10/10 for one-pass execution.
