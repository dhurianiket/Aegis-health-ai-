## 2024-05-18 - Memoize inline array filtering
**Learning:** Performing inline `.filter()` operations on large document/report arrays (especially when involving nested loops like `.some()` or `.toLowerCase()` regex matching) during the React render cycle creates O(N^2) bottlenecks that block the main thread and severely degrade typing responsiveness in search inputs.
**Action:** Always wrap expensive, data-heavy filtering operations in `useMemo` hooks (e.g. `const filteredDocs = useMemo(() => docs.filter(...), [docs, query])`) to prevent redundant execution on every re-render and maintain 60FPS UI interactions.

## 2026-08-02 - Optimize Sort Comparators with Schwartzian Transform
**Learning:** Executing expensive operations (such as `parseSafeTimestamp`, regex matching, or `findIndex`) inside React `useMemo` array `.sort()` comparators causes redundant O(N log N) executions, creating significant CPU bottlenecks during re-renders.
**Action:** Use a Schwartzian transform (Decorate-Sort-Undecorate) to pre-compute and cache expensive values in a single O(N) forward pass before sorting.
