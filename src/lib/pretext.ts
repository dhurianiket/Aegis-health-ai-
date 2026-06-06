import {
  prepareWithSegments,
  layout,
  measureLineStats,
  type PreparedTextWithSegments
} from '@chenglou/pretext';

export type PretextPrepared = PreparedTextWithSegments;

// Cache for prepared text to avoid re-measuring same string + font
const cache = new Map<string, PretextPrepared>();

/**
 * Prepares text for measurement using @chenglou/pretext.
 * Uses a Canvas-backed measurement that avoids DOM reflow.
 * 
 * @param text The text to prepare.
 * @param font CSS font string, e.g., "400 16px Inter, sans-serif".
 * @returns Prepared text object.
 */
export function prepareText(text: string, font: string): PretextPrepared {
  if (!text) return prepareWithSegments("", font);
  
  const key = `${font}|${text}`;
  let prepared = cache.get(key);
  if (!prepared) {
    prepared = prepareWithSegments(text, font);
    // Limit cache size to prevent memory leaks in long sessions
    if (cache.size > 5000) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, prepared);
  }
  return prepared;
}

/**
 * Measures the total height of the text wrapped to a given width.
 * 
 * @param prepared The prepared text object.
 * @param width The maximum width available.
 * @param lineHeight The line height in pixels.
 * @returns The total height in pixels.
 */
export function measureHeight(prepared: PretextPrepared, width: number, lineHeight: number): number {
  if (width <= 0) return 0;
  return layout(prepared, width, lineHeight).height;
}

/**
 * Measures the maximum width of the text lines, bounded by maxWidth.
 * 
 * @param prepared The prepared text object.
 * @param maxWidth The max width to wrap at.
 * @returns The width in pixels.
 */
export function measureWidth(prepared: PretextPrepared, maxWidth: number): number {
  if (maxWidth <= 0) return 0;
  return measureLineStats(prepared, maxWidth).maxLineWidth;
}

/**
 * Measures the total number of lines when wrapped to a given width.
 * 
 * @param prepared The prepared text object.
 * @param width The maximum width available.
 * @param lineHeight The line height in pixels (used for layout engine).
 * @returns The number of lines.
 */
export function measureLines(prepared: PretextPrepared, width: number, lineHeight: number): number {
  if (width <= 0) return 0;
  return layout(prepared, width, lineHeight).lineCount;
}
