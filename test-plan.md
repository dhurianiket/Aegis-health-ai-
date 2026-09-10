1. **Identify the Bottleneck**: In `src/components/LabReports/VisualLabReportCard.tsx`, within the `observations.map` loop (inside the render cycle), there's a nested loop iterating over the `historicalDataByMarker` map (which can have many entries), and then `.sort()` is called on the concatenated history array on every render!
2. **Optimize Historical Data Lookup**: Move the lookup and sorting of history into the `observations` `useMemo` block, or create a new `useMemo` specifically for mapping observations to their histories. Wait, `observations` doesn't need to be decorated with history if we just compute it once in a `useMemo`. We can create a `decoratedObservations` `useMemo` that maps each observation and attaches its sorted history. This prevents the O(N * M) lookup and O(K log K) sort inside the render function.
3. **Write the Plan**:
   - Create `decoratedObservations = useMemo(() => { ... }, [observations, historicalDataByMarker])`.
   - Update the render loop to use `decoratedObservations`.
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.
   - Submit PR with Bolt formatting.
