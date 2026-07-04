## 2024-06-15 - Memoizing expensive array filters in render path
**Learning:** Found inline `keyLabs.filter(...)` operations in `Dashboard.tsx` executing on every render. Because these filters also performed string casing operations (`toLowerCase`, `trim`) on potentially large lab arrays, it was causing unnecessary CPU cycles during re-renders. Additionally, lookups like `['hba1c', ...].includes(markerName)` were running linearly in the loop.
**Action:** Always wrap derived datasets using `useMemo` when working with potentially large arrays (like `keyLabs`) to ensure expensive filtering/transformations are only run when the dependencies change. Used a `Set` for array inclusion checks for better algorithmic performance.

## 2026-06-16 - Schwartzian transform for expensive sort keys
**Learning:** Discovered O(N log N) timestamp parsing in `Dashboard.tsx` and `ComparativeAnalysis.tsx`. Using complex parsing functions inside a `sort` callback causes redundant execution.
**Action:** Use a Schwartzian transform (map to objects with cached keys, sort, map back) to reduce expensive key parsing to strictly O(N).
## 2024-03-24 - Array Iteration Timestamp Parsing Optimization
**Learning:** `LabTrendChart.tsx` iteratively executed a heavy `parseSafeTimestamp` mapping function multiple times during filtering, sorting, and mapping in sequence, resulting in O(N log N) regex operations. This is a common pattern in the dashboard analytics views when handling complex medical data parsing natively in JS.
**Action:** Used the Schwartzian transform (Decorate-Sort-Undecorate) to pre-compute and cache the parsed timestamp and time value into an intermediate array of objects, running the regex parser strictly once per item.
