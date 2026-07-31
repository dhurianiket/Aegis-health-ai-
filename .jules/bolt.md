## 2024-05-18 - Prevent O(N) array filtering in React Render Cycle
**Learning:** In `Dashboard.tsx`, array filtering on datasets like `keyLabs` was performed inline within the JSX render block (e.g., `keyLabs.filter(...)`). Because arrays in JavaScript are reference types and `.filter()` returns a new array on every execution, this caused redundant O(N) recalculations on every component re-render, forcing child components to re-render needlessly.
**Action:** Extract expensive inline filtering operations (like those mapping or reducing large lists) into `useMemo` hooks (e.g., `attentionLabs = useMemo(...)`), using the source array (`keyLabs`) as the dependency. This caches the result between renders, preventing bottlenecks and maintaining reference stability.

## 2024-05-24 - Optimize repetitive operations in sort comparators
**Learning:** In `Dashboard.tsx`, calling `parseSafeTimestamp` multiple times in a sort comparator for large datasets creates significant main-thread CPU bottlenecks.
**Action:** Use a Schwartzian transform (Decorate-Sort-Undecorate) to perform expensive operations once per item before sorting.

## 2024-05-24 - Optimize O(N log N) sorting for finding maximums
**Learning:** In `ComparativeAnalysis.tsx`, arrays were sorted O(N log N) just to find the latest (maximum) date for each marker.
**Action:** Use a single O(N) forward pass storing the maximum in a dictionary instead of globally sorting the entire array, reducing redundant CPU usage.
