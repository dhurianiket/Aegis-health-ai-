## 2025-02-14 - Schwartzian Transforms for Main Thread Chart Optimization
**Learning:** Calling complex string manipulations (like regex or date parsing) inside array .sort() or nested .filter() methods blocks the main thread during React re-renders, creating severe CPU bottlenecks.
**Action:** Always pre-compute expensive calculations in an O(N) pass using the Schwartzian transform (Decorate-Sort-Undecorate) before executing O(N log N) sort algorithms in component useMemos.
## 2024-05-24 - Inline Array Iterations Lead to Performance Bottlenecks in Render
**Learning:** Performing multiple iterations of heavy logic (regex parsing, formatting dates) within a render function `.map()` block forces those expensive O(N) operations to re-run on every single render cycle, creating significant main-thread blocking bottlenecks in React components parsing large data arrays like `keyLabs`.
**Action:** Always extract inline filtering and formatting iterations on large collections out of the JSX render cycle and move them into `useMemo` hooks.
## 2025-03-09 - O(N log N) Computation Bottleneck in Arrays
**Learning:** Found multiple instances where the expensive `parseSafeTimestamp` utility was executed repetitively inside `.sort()` comparators (`src/components/Dashboard/ComparativeAnalysis.tsx`, `src/components/Dashboard/Dashboard.tsx`, and `src/services/ai/gemini.ts`), creating an O(N log N) bottleneck parsing the exact same dates over and over.
**Action:** When filtering or sorting data based on parsed output, use a Schwartzian transform (Decorate-Sort-Undecorate) to cache computed values (like parsed timestamps) to guarantee parsing happens exactly once per element in O(N) time before running the O(N log N) sort.

## 2025-03-09 - O(N log N) Date Parsing Bottleneck in Context Service
**Learning:** Calling `parseSafeTimestamp` directly inside a nested `.sort()` comparator for lab history in `contextService.ts` forced the expensive date-parsing logic to run `O(N log N)` times for every marker group being evaluated.
**Action:** Use a Schwartzian transform (`Decorate-Sort-Undecorate`) or `Map` caching mechanism to compute the parsed time once per lab in an O(N) pass prior to executing the sorting algorithm.

## 2025-03-09 - O(N^2) Backward Scanning Bottleneck in Render Cycle
**Learning:** Using backward-scanning loops (like nested `findIndex` or `for` loops backwards) inside the render cycle `.map()` (e.g., to find previous marker values in `ReportHistory.tsx`) forces O(N^2) operations on every render, severely blocking the main thread.
**Action:** Always pre-compute relative or preceding values using a single O(N) forward pass inside a `useMemo` hook, storing the results in a nested `Map` for O(1) lookups during the render phase.
## 2025-03-09 - O(N log N) Bottleneck in Dashboard\n**Learning:** ComparativeAnalysis recalculates latest labs per marker during each render using an expensive O(N log N) `sort` method. This creates main thread blocking when processing high-volume telemetry data.\n**Action:** Replaced `[...labs].sort()` with an O(N) single forward pass dict/map approach to find the latest value.

## 2025-03-09 - Avoid O(N log N) sorting just to find a single max/min value
**Learning:** Using `.sort((a, b) => ...)[0]` to find the most recent or largest item in an array is an O(N log N) operation, which introduces unnecessary overhead, especially inside React render loops or frequent hooks.
**Action:** Always use an O(N) single forward pass (like `.reduce` or a simple loop) when you only need to extract the maximum, minimum, or latest item from an array.
