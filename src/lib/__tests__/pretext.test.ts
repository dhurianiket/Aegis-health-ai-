import { describe, it, expect, beforeAll, vi } from 'vitest';
import { prepareText, measureHeight, measureWidth, measureLines } from '../pretext';

describe('pretext utilities', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      font: '',
      measureText: (text: string) => ({
        width: text.length * 8,
      }),
    }) as any;
  });

  it('should prepare text without throwing', () => {
    const prepared = prepareText('Hello world', '400 16px Inter, sans-serif');
    expect(prepared).toBeDefined();
  });

  it('should measure height correctly', () => {
    const font = '400 16px Inter, sans-serif';
    const prepared = prepareText('Hello world.\nThis is a test of the pretext library measuring height.', font);
    const height = measureHeight(prepared, 200, 24); // Assuming 24px line height
    expect(height).toBeGreaterThan(0);
    // Rough estimate: at least 2 lines, so 48px height.
    expect(height).toBeGreaterThanOrEqual(48);
  });

  it('should measure width correctly', () => {
    const font = '400 16px Inter, sans-serif';
    const prepared = prepareText('Short text', font);
    const width = measureWidth(prepared, 500);
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThan(500);
  });

  it('should count lines correctly', () => {
    const font = '400 16px Inter, sans-serif';
    const longText = 'This is a very long text that should wrap into multiple lines when constrained to a small width. Let us see how many lines it takes.';
    const prepared = prepareText(longText, font);
    const lines = measureLines(prepared, 100, 24);
    expect(lines).toBeGreaterThan(2);
  });
});
