1. **Optimize filter usage in `src/components/Upload/UploadCenter.tsx`**:
   The `UploadCenter.tsx` file has multiple redundant array allocations with `.filter()` when calculating processing file counts inline during rendering. I'll use the `replace_with_git_merge_diff` tool to extract this logic into a single pass loop using `useMemo`.
   Search:
   ```tsx
          {isProcessing && (
            <div className="glass-card flex flex-col items-center justify-center py-24 px-6 text-center border-teal-500/30">
              <div className="w-full max-w-md bg-surface h-1 rounded-full mb-12 overflow-hidden">
                 <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (processingStep + 1) / EXTRACTION_STEPS.length }}
                    className="h-full bg-[var(--color-primary)] origin-left"
                 />
              </div>

              <div className="flex justify-center mb-8">
                 <Loader2 className="w-16 h-16 text-[var(--color-primary)] animate-spin opacity-80" strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-bold mb-2">Analyzing Health Intelligence</h3>
              <p className="text-sm text-muted">
                 Usually takes 15-30 seconds per file.
                 {fileQueue.length > 1 && fileQueue.filter(f => f.status === 'done' || f.status === 'error').length < fileQueue.length && (
                   <span className="block mt-1 text-[var(--color-primary)] font-semibold">
                     Processing {fileQueue.filter(f => f.status === 'done' || f.status === 'error').length + 1} of {fileQueue.length}...
                   </span>
                 )}
              </p>
   ```
   Replace:
   ```tsx
          {isProcessing && (() => {
            let processedCount = 0;
            for (const f of fileQueue) {
              if (f.status === 'done' || f.status === 'error') processedCount++;
            }
            return (
            <div className="glass-card flex flex-col items-center justify-center py-24 px-6 text-center border-teal-500/30">
              <div className="w-full max-w-md bg-surface h-1 rounded-full mb-12 overflow-hidden">
                 <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (processingStep + 1) / EXTRACTION_STEPS.length }}
                    className="h-full bg-[var(--color-primary)] origin-left"
                 />
              </div>

              <div className="flex justify-center mb-8">
                 <Loader2 className="w-16 h-16 text-[var(--color-primary)] animate-spin opacity-80" strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-bold mb-2">Analyzing Health Intelligence</h3>
              <p className="text-sm text-muted">
                 Usually takes 15-30 seconds per file.
                 {fileQueue.length > 1 && processedCount < fileQueue.length && (
                   <span className="block mt-1 text-[var(--color-primary)] font-semibold">
                     Processing {processedCount + 1} of {fileQueue.length}...
                   </span>
                 )}
              </p>
            );
          })()}
   ```
   *(I'll adjust this to use `replace_with_git_merge_diff` during implementation)*

2. **Optimize filter usage in `src/services/fhirService.ts`**:
   I'll change `issues.filter((i) => i.severity === 'error').length === 0` to use a standard `for` loop with early return to avoid creating an intermediate array and to short-circuit as soon as an error is found. I will use the `replace_with_git_merge_diff` tool.
   Search:
   ```typescript
  const isValid = issues.filter((i) => i.severity === 'error').length === 0;

  return {
    isValid,
   ```
   Replace:
   ```typescript
  let isValid = true;
  for (const i of issues) {
    if (i.severity === 'error') {
      isValid = false;
      break;
    }
  }

  return {
    isValid,
   ```

3. **Optimize filter usage in `src/services/abdmService.ts`**:
   There are two instances of `const activeCount = updatedList.filter((c) => c.status === 'linked').length;`. I'll replace them with a loop counter variable using `replace_with_git_merge_diff`.
   Search:
   ```typescript
  const updatedList = Array.isArray(careContexts) ? careContexts : [careContexts];
  const activeCount = updatedList.filter((c) => c.status === 'linked').length;
   ```
   Replace:
   ```typescript
  const updatedList = Array.isArray(careContexts) ? careContexts : [careContexts];
  let activeCount = 0;
  for (const c of updatedList) {
    if (c.status === 'linked') activeCount++;
  }
   ```
   And similar for the second instance.

4. **Optimize filter usage in `src/context/AlertsContext.tsx`**:
   ```typescript
   const unreadCount = alerts.filter((a) => !dismissedIds.has(a.id)).length;
   ```
   Change to a single loop to calculate `unreadCount` using `replace_with_git_merge_diff`.
   Search:
   ```typescript
  const unreadCount = alerts.filter((a) => !dismissedIds.has(a.id)).length;

  return (
   ```
   Replace:
   ```typescript
  let unreadCount = 0;
  for (const a of alerts) {
    if (!dismissedIds.has(a.id)) {
      unreadCount++;
    }
  }

  return (
   ```

5. **Run test suite**: Run tests using `run_in_bash_session` to execute `pnpm test` and `pnpm lint`.
6. **Pre-commit**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done using `pre_commit_instructions`.
7. **Submit PR**: Submit a pull request with the `submit` tool using the branch name `bolt-optimize-array-counts` and title "⚡ Bolt: Replace array `.filter().length` with single pass loops". The description will explicitly include the markdown fields '💡 What', '🎯 Why', '📊 Impact', and '🔬 Measurement'.
