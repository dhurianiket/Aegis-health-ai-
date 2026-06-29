## 2024-06-15 - Memoizing expensive array filters in render path
**Learning:** Found inline `keyLabs.filter(...)` operations in `Dashboard.tsx` executing on every render. Because these filters also performed string casing operations (`toLowerCase`, `trim`) on potentially large lab arrays, it was causing unnecessary CPU cycles during re-renders. Additionally, lookups like `['hba1c', ...].includes(markerName)` were running linearly in the loop.
**Action:** Always wrap derived datasets using `useMemo` when working with potentially large arrays (like `keyLabs`) to ensure expensive filtering/transformations are only run when the dependencies change. Used a `Set` for array inclusion checks for better algorithmic performance.

## 2026-06-16 - Schwartzian transform for expensive sort keys
**Learning:** Discovered O(N log N) timestamp parsing in `Dashboard.tsx` and `ComparativeAnalysis.tsx`. Using complex parsing functions inside a `sort` callback causes redundant execution.
**Action:** Use a Schwartzian transform (map to objects with cached keys, sort, map back) to reduce expensive key parsing to strictly O(N).
## 2024-06-29 - O(N log N) Date Parsing Bottlenecks in Chart Rendering
**Learning:** Frontend charts that sort large arrays of lab results dynamically (e.g., `LabTrendChart`) can suffer significant main-thread blocking when parsing strings into Dates during the `.sort()` comparator function. A simple array map and sort triggered a redundant parser execution penalty of 125ms for 50k points in Node.js.
**Action:** Use a Schwartzian transform (decorate-sort-undecorate) to pre-calculate and cache the parsed timestamps, reducing the operation complexity from O(N log N) expensive parsing executions to just O(N).
