## 2024-07-06 - Schwartzian Transform for Expensive Sorting
**Learning:** Sorting arrays directly based on expensive computations like `parseSafeTimestamp` creates a massive O(N log N) performance bottleneck (executing the expensive function O(N log N) times).
**Action:** Use a Schwartzian transform (Decorate-Sort-Undecorate) to compute the expensive value once per element (O(N)), sort based on the cached value, and then unwrap. We verified an ~8-10x speedup doing this on arrays of size 1000.

## 2024-07-05 - Memoization of expensive array filters in component body
**Learning:** `LabReportsSection.tsx` had an inline `reports.filter(...)` operation that included nested iterations and `toLowerCase` string processing. This caused heavy and redundant computations on every component render, affecting UI responsiveness, especially when users interacted with input fields that triggered re-renders.
**Action:** Always wrap expensive, derived datasets (like filtered lists involving string manipulation or nested array checks) with `useMemo` in React components to prevent redundant computations and preserve referential equality on re-renders when dependencies have not changed.

## 2024-05-15 - Array Sorting Optimization via Schwartzian Transform & Reversal
**Learning:** Re-computing expensive date string parsing (like `new Date(...).getTime()`) inside a `.sort()` comparator results in O(N log N) redundant calculations, which degrades performance in list-heavy views like ReportHistory. Furthermore, sorting an array twice to get both ascending and descending order is computationally wasteful.
**Action:** Use a Schwartzian transform (Decorate-Sort-Undecorate) to precompute expensive comparator keys before sorting. When needing an inverse sort of an already sorted array, use `.reverse()` which is O(N) instead of performing a completely new sort.
