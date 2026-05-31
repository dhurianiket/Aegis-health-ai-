## 2025-05-31 - Memoizing expensive string operations in Lab Reports Filter
**Learning:** React performance can degrade significantly when using array `.filter()` containing multiple string manipulations (like `toLowerCase()` and `.includes()`) directly within the render cycle, especially as the number of reports/entries grows. This is a common performance pitfall in components displaying large lists.
**Action:** Always wrap heavy list filtering/sorting logic in `useMemo` when they depend on specific state changes rather than recalculating on every re-render.
