## 2024-06-15 - Memoizing expensive array filters in render path
**Learning:** Found inline `keyLabs.filter(...)` operations in `Dashboard.tsx` executing on every render. Because these filters also performed string casing operations (`toLowerCase`, `trim`) on potentially large lab arrays, it was causing unnecessary CPU cycles during re-renders. Additionally, lookups like `['hba1c', ...].includes(markerName)` were running linearly in the loop.
**Action:** Always wrap derived datasets using `useMemo` when working with potentially large arrays (like `keyLabs`) to ensure expensive filtering/transformations are only run when the dependencies change. Used a `Set` for array inclusion checks for better algorithmic performance.

## 2026-06-16 - Schwartzian transform for expensive sort keys
**Learning:** Discovered O(N log N) timestamp parsing in `Dashboard.tsx` and `ComparativeAnalysis.tsx`. Using complex parsing functions inside a `sort` callback causes redundant execution.
**Action:** Use a Schwartzian transform (map to objects with cached keys, sort, map back) to reduce expensive key parsing to strictly O(N).
## 2024-05-18 - Schwartzian Transform for O(N log N) Sorting Overhead
**Learning:** In `src/services/ai/contextService.ts`, array sorting logic was nested inside another sort loop's comparator callback, causing inner `Array.sort()` and redundant `parseSafeTimestamp()` operations to be executed quadratically (`O(M * N log N)`). The application handles lots of mock lab data here so the impact was massive (9x overhead).
**Action:** Use a Schwartzian Transform pattern (Decorate-Sort-Undecorate) to pre-calculate computed values, map cache lookups, and execute inner sorts outside the primary sort loop to achieve `O(N log N)` flat complexity.
