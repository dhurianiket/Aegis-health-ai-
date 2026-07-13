1. **Analyze `src/components/Timeline/Timeline.tsx` and identify performance improvements.**
    - The `Timeline` component sorts `Object.values(trends)` and maps it inline during every render. This operation has a complexity of $O(N \log N)$ and can cause unnecessary performance bottlenecks on re-renders, especially if the `trends` object is large.
    - `filteredDocs` is also computed inline on every render based on `filterType` and `documents`.
2. **Implement `useMemo` for `sortedTrends`.**
    - Create a `useMemo` hook that computes `sortedTrends` from `trends`.
    - Replace the inline `Object.values(trends).sort(...).map(...)` with `sortedTrends.map(...)`.
3. **Implement `useMemo` for `filteredDocs`.**
    - Memoize `filteredDocs` to prevent re-filtering on every render.
4. **Complete pre commit steps.**
    - Run linting, build, and tests to ensure no regressions.
5. **Create a Pull Request.**
    - Add a description explaining the optimization and expected impact.
    - Submit the PR.
