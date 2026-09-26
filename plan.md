1. **Optimize array filtering in `SpecialistLounge.tsx`**
   - The `filteredSpecialists` memoized array in `src/components/Specialists/SpecialistLounge.tsx` eagerly evaluates all boolean match conditions for filtering specialists before returning, which causes O(N*M) bottlenecks.
   - I will replace the eager evaluation with short-circuit early returns and replace `.some()` closures with `for` loops.
   - Exact code replacement:
     ```typescript
<<<<<<< SEARCH
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesDisplayName = s.displayName.toLowerCase().includes(q);
        const matchesSpecialty = s.specialty.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesExpertise = s.expertise.some((exp) => exp.toLowerCase().includes(q));
        const matchesGuidelines = s.guidelines.some((g) => g.toLowerCase().includes(q));
        return matchesName || matchesDisplayName || matchesSpecialty || matchesDesc || matchesExpertise || matchesGuidelines;
      }
      return true;
=======
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (s.name.toLowerCase().includes(q)) return true;
        if (s.displayName.toLowerCase().includes(q)) return true;
        if (s.specialty.toLowerCase().includes(q)) return true;
        if (s.description.toLowerCase().includes(q)) return true;
        for (let i = 0; i < s.expertise.length; i++) {
          if (s.expertise[i].toLowerCase().includes(q)) return true;
        }
        for (let i = 0; i < s.guidelines.length; i++) {
          if (s.guidelines[i].toLowerCase().includes(q)) return true;
        }
        return false;
      }
      return true;
>>>>>>> REPLACE
     ```

2. **Verify Changes**
   - I will verify the changes are correct and don't introduce regressions by running:
     - `pnpm lint`
     - `pnpm build`
     - `pnpm test`

3. **Complete Pre-commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

4. **Submit PR**
   - I will submit a pull request with the title `⚡ Bolt: [performance improvement]` and description format:
     - 💡 What: Implement short-circuit array filtering in `SpecialistLounge.tsx`
     - 🎯 Why: Eager evaluation of expensive string checks and nested loops creates O(N * M) render bottlenecks
     - 📊 Impact: Substantially reduces CPU usage and memory allocation during specialist search, preventing lag when typing
     - 🔬 Measurement: Verify search functionality in Specialist Lounge is responsive and correct.
