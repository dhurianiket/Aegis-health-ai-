## 2024-06-15 - Memoizing expensive array filters in render path
**Learning:** Found inline `keyLabs.filter(...)` operations in `Dashboard.tsx` executing on every render. Because these filters also performed string casing operations (`toLowerCase`, `trim`) on potentially large lab arrays, it was causing unnecessary CPU cycles during re-renders. Additionally, lookups like `['hba1c', ...].includes(markerName)` were running linearly in the loop.
**Action:** Always wrap derived datasets using `useMemo` when working with potentially large arrays (like `keyLabs`) to ensure expensive filtering/transformations are only run when the dependencies change. Used a `Set` for array inclusion checks for better algorithmic performance.

## 2026-06-16 - Schwartzian transform for expensive sort keys
**Learning:** Discovered O(N log N) timestamp parsing in `Dashboard.tsx` and `ComparativeAnalysis.tsx`. Using complex parsing functions inside a `sort` callback causes redundant execution.
**Action:** Use a Schwartzian transform (map to objects with cached keys, sort, map back) to reduce expensive key parsing to strictly O(N).
## 2024-07-05 - Memoization of expensive array filters in component body
**Learning:** `LabReportsSection.tsx` had an inline `reports.filter(...)` operation that included nested iterations and `toLowerCase` string processing. This caused heavy and redundant computations on every component render, affecting UI responsiveness, especially when users interacted with input fields that triggered re-renders.
**Action:** Always wrap expensive, derived datasets (like filtered lists involving string manipulation or nested array checks) with `useMemo` in React components to prevent redundant computations and preserve referential equality on re-renders when dependencies have not changed.
