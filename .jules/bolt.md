## 2025-02-14 - Schwartzian Transforms for Main Thread Chart Optimization
**Learning:** Calling complex string manipulations (like regex or date parsing) inside array .sort() or nested .filter() methods blocks the main thread during React re-renders, creating severe CPU bottlenecks.
**Action:** Always pre-compute expensive calculations in an O(N) pass using the Schwartzian transform (Decorate-Sort-Undecorate) before executing O(N log N) sort algorithms in component useMemos.
## 2024-05-24 - Inline Array Iterations Lead to Performance Bottlenecks in Render
**Learning:** Performing multiple iterations of heavy logic (regex parsing, formatting dates) within a render function `.map()` block forces those expensive O(N) operations to re-run on every single render cycle, creating significant main-thread blocking bottlenecks in React components parsing large data arrays like `keyLabs`.
**Action:** Always extract inline filtering and formatting iterations on large collections out of the JSX render cycle and move them into `useMemo` hooks.
## 2025-03-09 - O(N log N) Computation Bottleneck in Arrays
**Learning:** Found multiple instances where the expensive `parseSafeTimestamp` utility was executed repetitively inside `.sort()` comparators (`src/components/Dashboard/ComparativeAnalysis.tsx`, `src/components/Dashboard/Dashboard.tsx`, and `src/services/ai/gemini.ts`), creating an O(N log N) bottleneck parsing the exact same dates over and over.
**Action:** When filtering or sorting data based on parsed output, use a Schwartzian transform (Decorate-Sort-Undecorate) to cache computed values (like parsed timestamps) to guarantee parsing happens exactly once per element in O(N) time before running the O(N log N) sort.
