## 2024-06-01 - Dashboard Component Memoization
**Learning:** The Dashboard component renders multiple heavy child components inside a map loop (like HeroMetric). These components re-render unnecessarily when the Dashboard's state updates, even if their props haven't changed. Memoizing them is a crucial optimization.
**Action:** Use React.memo() on frequently rendered child components like HeroMetric and ConditionTile to prevent unnecessary re-renders.
## 2024-08-01 - Avoid duplicate inline filtering
**Learning:** `Dashboard.tsx` suffered from duplicated array operations directly in the render cycle. O(N) `.filter()` logic for `abnormalLabs` was executing multiple times, and an array `includes` lookup inside another filter was scaling poorly.
**Action:** Extract expensive inline filters into `useMemo` hooks. Use `Set` instead of `Array.includes` for constant-time complexity lookup inside iteration logic.
