## 2024-06-15 - Memoizing expensive array filters in render path
**Learning:** Found inline `keyLabs.filter(...)` operations in `Dashboard.tsx` executing on every render. Because these filters also performed string casing operations (`toLowerCase`, `trim`) on potentially large lab arrays, it was causing unnecessary CPU cycles during re-renders. Additionally, lookups like `['hba1c', ...].includes(markerName)` were running linearly in the loop.
**Action:** Always wrap derived datasets using `useMemo` when working with potentially large arrays (like `keyLabs`) to ensure expensive filtering/transformations are only run when the dependencies change. Used a `Set` for array inclusion checks for better algorithmic performance.

## 2026-06-16 - Schwartzian transform for expensive sort keys
**Learning:** Discovered O(N log N) timestamp parsing in `Dashboard.tsx` and `ComparativeAnalysis.tsx`. Using complex parsing functions inside a `sort` callback causes redundant execution.
**Action:** Use a Schwartzian transform (map to objects with cached keys, sort, map back) to reduce expensive key parsing to strictly O(N).

## 2024-07-03 - WeakMap for Safe Object Caching during Sorting
**Learning:** During array sorting optimizations, caching computed values directly on the input object elements (e.g. `doc._parsedDate = ...`) is a dangerous anti-pattern in React apps that pollutes data models or can trigger crashes on frozen state objects (like RTK Query).
**Action:** Always use a `WeakMap` external to the data object or a Schwartzian transform (map-sort-map) when safely caching values for `Array.prototype.sort()`.
