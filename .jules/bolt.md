## 2025-02-14 - Schwartzian Transforms for Main Thread Chart Optimization
**Learning:** Calling complex string manipulations (like regex or date parsing) inside array .sort() or nested .filter() methods blocks the main thread during React re-renders, creating severe CPU bottlenecks.
**Action:** Always pre-compute expensive calculations in an O(N) pass using the Schwartzian transform (Decorate-Sort-Undecorate) before executing O(N log N) sort algorithms in component useMemos.
