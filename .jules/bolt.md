## 2024-05-18 - Memoize inline array filtering
**Learning:** Performing inline `.filter()` operations on large document/report arrays (especially when involving nested loops like `.some()` or `.toLowerCase()` regex matching) during the React render cycle creates O(N^2) bottlenecks that block the main thread and severely degrade typing responsiveness in search inputs.
**Action:** Always wrap expensive, data-heavy filtering operations in `useMemo` hooks (e.g. `const filteredDocs = useMemo(() => docs.filter(...), [docs, query])`) to prevent redundant execution on every re-render and maintain 60FPS UI interactions.

## 2026-08-02 - Optimize Sort Comparators with Schwartzian Transform
**Learning:** Executing expensive operations (such as `parseSafeTimestamp`, regex matching, or `findIndex`) inside React `useMemo` array `.sort()` comparators causes redundant O(N log N) executions, creating significant CPU bottlenecks during re-renders.
**Action:** Use a Schwartzian transform (Decorate-Sort-Undecorate) to pre-compute and cache expensive values in a single O(N) forward pass before sorting.

## 2026-08-04 - Precompute Repeated Backwards Scanning
**Learning:** Using `findIndex` combined with a backward `for` loop inside a render function to locate preceding marker values across a list of medical reports created a severe O(N^2 * M^2) time complexity bottleneck. This caused significant lag during rendering as the number of reports grew.
**Action:** Replace nested array scanning inside render with a single O(N) forward pass inside a `useMemo` hook to precompute mapping values (e.g. using a Map of Maps). This reduces the per-item lookup time complexity to O(1) during the actual render.
