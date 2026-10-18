## 2024-05-15 - [Correlation Matrix Optimization]
**Learning:** Found multiple O(N) array loops used to compute various sums for standard mathematical formulas (like Pearson correlation coefficient). The overhead of creating arrays, calling `.reduce()`, and iterating multiple times is significantly slower than doing it in one loop.
**Action:** Replaced sequential map/reduce aggregations over the same datasets with single pass `for` loops in math-heavy calculation functions to eliminate O(K*N) complexity and cut closure/array allocation overhead.
