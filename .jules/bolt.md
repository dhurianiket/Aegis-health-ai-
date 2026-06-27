## 2025-02-13 - Schwartzian Transform for Array Sort Algorithms
**Learning:** Nested sorts or computationally expensive parsing functions (like `parseSafeTimestamp`) inside array sort comparators cause severe O(N^2 log N) performance bottlenecks, especially in complex components like `contextService` which process many arrays recursively.
**Action:** Always precompute and map valid values and timestamps before sorting using the Schwartzian Transform pattern (O(N) mapping, then sorting mapped references) rather than repeatedly computing inside the `Array.sort()` comparator method.
