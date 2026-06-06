## 2025-05-31 - Memoizing expensive string operations in Lab Reports Filter
**Learning:** React performance can degrade significantly when using array `.filter()` containing multiple string manipulations (like `toLowerCase()` and `.includes()`) directly within the render cycle, especially as the number of reports/entries grows. This is a common performance pitfall in components displaying large lists.
**Action:** Always wrap heavy list filtering/sorting logic in `useMemo` when they depend on specific state changes rather than recalculating on every re-render.
## 2024-06-01 - Dashboard Component Memoization
**Learning:** The Dashboard component renders multiple heavy child components inside a map loop (like HeroMetric). These components re-render unnecessarily when the Dashboard's state updates, even if their props haven't changed. Memoizing them is a crucial optimization.
**Action:** Use React.memo() on frequently rendered child components like HeroMetric and ConditionTile to prevent unnecessary re-renders.
## 2024-08-01 - Avoid duplicate inline filtering
**Learning:** `Dashboard.tsx` suffered from duplicated array operations directly in the render cycle. O(N) `.filter()` logic for `abnormalLabs` was executing multiple times, and an array `includes` lookup inside another filter was scaling poorly.
**Action:** Extract expensive inline filters into `useMemo` hooks. Use `Set` instead of `Array.includes` for constant-time complexity lookup inside iteration logic.
## 2024-06-06 - Missing useMemo on repeated array operations in React Renders
**Learning:** Found multiple components (`Timeline`, `NotificationCenter`, `NotificationDropdown`) that run array `.filter()` during every single render. This causes unnecessary recalculations and GC pressure, particularly when handling document or notification lists where state updates (like closing a modal or typing) trigger frequent re-renders.
**Action:** Use `useMemo` to memoize filtered lists based on their source arrays and filter criteria, avoiding redundant O(n) computations per render cycle, and extract static configurations (like category maps) out of the component function so they are not recreated on every render.
