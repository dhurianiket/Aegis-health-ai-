## 2024-05-18 - Memoize inline array filtering
**Learning:** Performing inline `.filter()` operations on large document/report arrays (especially when involving nested loops like `.some()` or `.toLowerCase()` regex matching) during the React render cycle creates O(N^2) bottlenecks that block the main thread and severely degrade typing responsiveness in search inputs.
**Action:** Always wrap expensive, data-heavy filtering operations in `useMemo` hooks (e.g. `const filteredDocs = useMemo(() => docs.filter(...), [docs, query])`) to prevent redundant execution on every re-render and maintain 60FPS UI interactions.

## 2026-08-02 - Optimize Sort Comparators with Schwartzian Transform
**Learning:** Executing expensive operations (such as `parseSafeTimestamp`, regex matching, or `findIndex`) inside React `useMemo` array `.sort()` comparators causes redundant O(N log N) executions, creating significant CPU bottlenecks during re-renders.
**Action:** Use a Schwartzian transform (Decorate-Sort-Undecorate) to pre-compute and cache expensive values in a single O(N) forward pass before sorting.

## 2026-08-04 - Precompute Repeated Backwards Scanning
**Learning:** Using `findIndex` combined with a backward `for` loop inside a render function to locate preceding marker values across a list of medical reports created a severe O(N^2 * M^2) time complexity bottleneck. This caused significant lag during rendering as the number of reports grew.
**Action:** Replace nested array scanning inside render with a single O(N) forward pass inside a `useMemo` hook to precompute mapping values (e.g. using a Map of Maps). This reduces the per-item lookup time complexity to O(1) during the actual render.

## 2024-05-19 - Replace .sort()[0] with single forward pass
**Learning:** Using `.sort((a, b) => b - a)[0]` just to find the maximum or latest value incurs an unnecessary O(N log N) computational cost, which is particularly severe if nested within other sorts or rendering cycles.
**Action:** Replace `.sort()[0]` with a single O(N) forward pass using `.reduce()` (e.g. `arr.reduce((max, curr) => curr > max ? curr : max)`) to pre-compute maximum values and avoid unnecessary full-array sorts.

## 2024-05-20 - Redundant Sorting of Already Sorted Data
**Learning:** Re-sorting an array that is already strictly sorted in the exact opposite order (e.g., to create a chronological view from a reverse-chronological list) using `.sort()` is an unnecessary O(N log N) operation that severely degrades render performance, particularly when the sort comparator parses Dates.
**Action:** When needing an inverse order of an already sorted array, use `[...array].reverse()` (O(N)) rather than running a second `.sort()` (O(N log N)) to prevent redundant computational overhead.

## 2024-05-21 - Extract Expensive Mapping from Render
**Learning:** Performing expensive parsing (like regex matching and date parsing) directly inside `array.map()` during a React render cycle can cause severe performance bottlenecks on every re-render.
**Action:** Extract expensive inline computations inside render `.map()` loops into `useMemo` hooks by pre-computing the values on the dataset array itself, reducing the render function to simple O(1) property reads.

## 2024-05-22 - Extract Static Objects from Sort Comparators
**Learning:** Defining static mapping objects (like dictionaries for severity mapping) inside array `.sort()` comparator functions causes the object to be redundantly allocated in memory on every single array comparison step (O(N log N) allocations), resulting in significant garbage collection overhead and slower render times.
**Action:** When mapping values in a sort comparator, always define the mapping object or dictionary *outside* the `.sort()` function callback (or entirely outside the React component) to ensure it is only allocated once.

## $(date +%Y-%m-%d) - Schwartzian Transform for Expensive Sorting Comparators
**Learning:** Performing expensive computations (like string parsing, regular expressions, or date parsing via `parseSafeTimestamp`) directly inside an array `.sort()` comparator creates an O(N log N) performance bottleneck, as the computation is executed redundantly on every comparison. This is especially impactful when processing large medical datasets like `labHistory`.
**Action:** When sorting arrays based on computed properties, always extract the computation using a Schwartzian transform (Decorate-Sort-Undecorate) to execute the expensive operation exactly once per item (O(N)), cache the result in a mapped object, perform the sort on the cached value, and finally map back to the original objects.

## 2026-08-17 - O(N log N) Date Parsing Bottleneck
**Learning:** Parsing dates inside inline `Array.sort()` comparators (like `new Date(str).getTime()`) creates a hidden O(N log N) bottleneck, particularly blocking the main thread during component re-renders. This occurs because `new Date()` is expensive and the comparator parses the exact same date strings multiple times during the sort process.
**Action:** Use a Schwartzian transform (decorate-sort-undecorate) to parse and cache dates during a single O(N) forward pass before sorting. Replace `new Date()` with `parseSafeTimestamp(date)?.getTime() || 0` to improve robustness against invalid values.
