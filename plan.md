Let's review `src/components/Dashboard/Dashboard.tsx`
```typescript
     let trend = 'stable';
     if (previous && !isNaN(parseFloat(String(latest.value || latest.display_value).replace(/[^0-9.-]/g, ''))) && !isNaN(parseFloat(String(previous.value || previous.display_value).replace(/[^0-9.-]/g, '')))) {
        const latestNum = parseFloat(String(latest.value || latest.display_value).replace(/[^0-9.-]/g, ''));
        const previousNum = parseFloat(String(previous.value || previous.display_value).replace(/[^0-9.-]/g, ''));
        const diff = latestNum - previousNum;
        if (diff > 0) trend = 'up';
        else if (diff < 0) trend = 'down';
     }
```

Wait, `parseFloat(String(x).replace(...))` inside an if condition is executed, then repeated inside the true block. By saving it to variables first, we cut the evaluations strictly by half. And since this is iterating over arrays of lab map, avoiding duplicate allocations in a hot path fits the goal.
I will formulate the plan around this.

Plan:
1. Open `src/components/Dashboard/Dashboard.tsx`.
2. Locate the `aggregateLabs` function where the trend calculation performs redundant `parseFloat` and `.replace` operations inside the `if` condition and again inside the block.
3. Replace the `if` condition and block to calculate `latestNum` and `previousNum` first.
4. Use `!isNaN(latestNum)` and `!isNaN(previousNum)` in a nested `if` condition to assign `trend = 'up'` or `trend = 'down'`.
5. Run tests.
6. Commit.
