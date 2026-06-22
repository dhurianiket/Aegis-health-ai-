## 2024-05-24 - Array Sorting with Expensive Operations
**Learning:** Calling functions like `parseSafeTimestamp` that rely on complex regex and object instantiations inside an `.sort()` comparator results in $O(N \log N)$ executions of the expensive operation, leading to measurable slowdowns on data-heavy charts (e.g., `LabTrendChart`).
**Action:** Use the Schwartzian transform approach (Decorate-Sort-Undecorate) when sorting by a computed value. First map the array to include the computed value (`{ item, value }`), sort based on the cached value, and finally map back to just the items.
