1. **Optimize `getPrecedingMarkerValue` in `src/components/Reports/ReportHistory.tsx`**
   - The current implementation of `getPrecedingMarkerValue` in `ReportHistory.tsx` is called for *every* marker in *every* report being rendered. Inside this function, it does a nested `findIndex` on `chronologicalReports`, then scans backward through the reports using a `for` loop, and for each report, it does *another* `.find()` with string allocations (`toLowerCase().trim()`) to find the matching observation.
   - This results in O(R * M * R * M) complexity in the worst case (where R is the number of reports and M is the number of markers), leading to performance issues and unnecessary UI blocking during renders when there are many reports.
   - We will implement a `useMemo` block that iterates through the `chronologicalReports` exactly once. We'll maintain a `lastSeen` map to track the latest value of each marker as we iterate. For each report and each observation, we'll assign the preceding value directly from the `lastSeen` map, and then update the `lastSeen` map with the current observation's value.
   - We will return a map/record mapping `reportId` -> `markerName` -> `precedingValueData`, allowing `getPrecedingMarkerValue` to simply do an O(1) dictionary lookup instead of full array scans, turning the overall complexity into O(R * M).

2. **Verify changes and complete pre commit steps**
   - Read the updated file to verify the changes.
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.

3. **Submit the PR**
   - We will submit the PR with the title "⚡ Bolt: [Performance] O(1) Preceding Marker Value Lookup in ReportHistory" to describe the optimization clearly.
