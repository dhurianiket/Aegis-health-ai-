## 2024-06-01 - Dashboard Component Memoization
**Learning:** The Dashboard component renders multiple heavy child components inside a map loop (like HeroMetric). These components re-render unnecessarily when the Dashboard's state updates, even if their props haven't changed. Memoizing them is a crucial optimization.
**Action:** Use React.memo() on frequently rendered child components like HeroMetric and ConditionTile to prevent unnecessary re-renders.
