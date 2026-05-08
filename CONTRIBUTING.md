# Contributing Guidelines

## Getting Started
1. Install dependencies with `npm install`
2. Set up your `.env` file according to `.env.example`
3. Run the development server with `npm run dev`

## Code Style
- Use TypeScript for all new files.
- Favor standard React hooks (`useState`, `useEffect`, `useMemo`).
- Utilize global contexts for shared state where applicable, but prefer localized state for specific components.
- Tailwind CSS should be used for styling. Keep custom CSS to a minimum.
- Ensure components are lazy-loaded within `App.tsx` if they aren't required for initial paint.
- All dynamic routes/components must be wrapped in `ErrorBoundary`.

## Submission Process
1. Create a feature branch.
2. Implement your changes.
3. Write/update tests if applicable.
4. Run `npm run lint` and `npm run build` to verify there are no basic errors.
5. Create a pull request explaining your changes.
