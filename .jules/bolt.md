## 2025-02-14 - Schwartzian Transforms for Main Thread Chart Optimization
**Learning:** Calling complex string manipulations (like regex or date parsing) inside array .sort() or nested .filter() methods blocks the main thread during React re-renders, creating severe CPU bottlenecks.
**Action:** Always pre-compute expensive calculations in an O(N) pass using the Schwartzian transform (Decorate-Sort-Undecorate) before executing O(N log N) sort algorithms in component useMemos.
## 2024-05-24 - Inline Array Iterations Lead to Performance Bottlenecks in Render
**Learning:** Performing multiple iterations of heavy logic (regex parsing, formatting dates) within a render function `.map()` block forces those expensive O(N) operations to re-run on every single render cycle, creating significant main-thread blocking bottlenecks in React components parsing large data arrays like `keyLabs`.
**Action:** Always extract inline filtering and formatting iterations on large collections out of the JSX render cycle and move them into `useMemo` hooks.
