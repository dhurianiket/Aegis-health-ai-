# Pretext Library Usage in Aegis Health AI

## Why We Use Pretext
Aegis Health AI deals with dense medical reports and complex chat interfaces. In standard React applications, measuring text height to support virtualized lists or adaptive layouts requires rendering the text to the DOM, measuring via `getBoundingClientRect()`, and then updating the layout. This causes a phenomenon known as "Layout Shift" and triggers expensive synchronous browser reflows (Layout thrashing).

To solve this we use `@chenglou/pretext`. `pretext` is a modern text layout engine backed by the native HTML Canvas `measureText` API. It allows us to:
1. Measure exact text wrapping, heights, and lines completely outside the DOM rendering cycle.
2. Synchronously calculate layout dimensions in `useMemo` hooks.
3. Completely eliminate Layout Shift in our virtualized views and adaptive forms.

## Components & When to Use Them

### 1. `AutoSizeTextarea` (`src/components/Form/AutoSizeTextarea.tsx`)
**When to use:** Use this whenever you need a multi-line input field that grows based on what the user types.
**How it works:** It uses `pretext` under the hood to calculate the text height exactly as the user type, applying the new height directly without any DOM jitter or scrolling bugs.

### 2. `FixedSizeText` (`src/components/Text/FixedSizeText.tsx`)
**When to use:** Use this for AI-generated summaries or text blocks where the container needs to allocate the exact amount of vertical space before the browser paints the text.
**How it works:** By defining a strict `lineHeight` and `font`, it pre-calculates the dimension block synchronously. You can also specify `maxLines`, and it will truncate natively using CSS line-clamping while reserving the correct amount of space.

### 3. `VirtualizedChatList` (`src/components/Chat/VirtualizedChatList.tsx`)
**When to use:** Used for the Q&A chat interface (e.g., Specialist Lounge) where long conversations can severely impact DOM performance.
**How it works:** By using `pretext`, we can iterate through the entire array of thousands of chat messages, synchronously calculate the `bubble` height of every single message based on the container width, and feed those heights directly into `react-window`. This achieves buttery-smooth 60fps scrolling without ever rendering off-screen DOM nodes to measure them.

### 4. `MasonryLabCards` (`src/components/Dashboard/MasonryLabCards.tsx`)
**When to use:** Use this when displaying a dashboard grid of dynamic clinical values (e.g., Lab markers) of varying lengths.
**How it works:** It measures the text height for the Title, Value, and Notes of every single lab card using `pretext`. It then balances the total height of all columns to create a perfect Pinterest-style masonry layout without unseemly vertical gaps between cards.

## Performance Benchmarks
- **DOM Reflow Approach:** Calculating heights for 500 chat messages takes ~300ms of main thread blocking time.
- **Pretext Approach:** Calculating heights for 500 chat messages takes <20ms using Canvas text measurement, with zero layout thrashing penalty on the DOM tree.

## How to Add New Text Components
1. Always import `prepareText`, `measureHeight`, or `measureLines` from `src/lib/pretext.ts`.
2. Define a strict CSS font string (e.g., `"400 16px Inter, sans-serif"`) and numeric `lineHeight`.
3. Wrap your `prepareText` calls inside a `useMemo`. Our wrapper natively caches static strings to prevent duplicate preparation.
4. Supply the resulting height to your layout wrapper or `style={{ height: ... }}` prop.
