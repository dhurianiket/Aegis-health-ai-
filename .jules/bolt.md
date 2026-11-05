## $(date +%Y-%m-%d) - Array Reductions O(N) Iteration Replacement
**Learning:** Checking the `.length` of an intermediate `.filter()` result (e.g. `arr.filter(a => ...).length`) creates temporary arrays that stress the garbage collector and causes O(N) memory allocations, particularly when done inline inside React render functions.
**Action:** Replace array `.filter(...).length` statements with single-pass `for` loops and counter variables to eliminate intermediate array creation.
