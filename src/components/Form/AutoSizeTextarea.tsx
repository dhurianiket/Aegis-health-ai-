import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { prepareText, measureHeight } from '../../lib/pretext';

export interface AutoSizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fontFam?: string; // Optional CSS font string override
  fontSize?: number; // Optional text size in px
  lineHeight?: number; // exact line height in pixels
  minLines?: number;
  maxLines?: number;
}

export const AutoSizeTextarea: React.FC<AutoSizeTextareaProps> = ({
  value,
  onChange,
  fontFam = 'Inter, sans-serif',
  fontSize = 16,
  lineHeight = 24,
  minLines = 1,
  maxLines,
  className = '',
  style,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [width, setWidth] = useState<number>(0);

  const fontString = `400 ${fontSize}px ${fontFam}`;

  // We need to know the true interior width of the textarea to measure correctly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Find padding values
        const styleObj = window.getComputedStyle(el);
        const pl = parseFloat(styleObj.paddingLeft) || 0;
        const pr = parseFloat(styleObj.paddingRight) || 0;
        // The measurement we care about is the content box ignoring padding
        const contentWidth = entry.contentRect.width; 
        if (contentWidth > 0 && Math.abs(contentWidth - width) > 1) { // Debounce minor floating point shifts
           setWidth(contentWidth);
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  // Calculate required height based on content
  const requiredHeight = useMemo(() => {
    if (width <= 0) return minLines * lineHeight;

    const textPayload = typeof value === 'string' ? value : String(value || '');
    // If the text ends with a newline, Pretext (and native textarea) needs space for that next line.
    // Pretext strips trailing empty space sometimes, so simulate by adding a char.
    const measurePayload = textPayload.endsWith('\n') ? textPayload + ' ' : textPayload;

    const prepared = prepareText(measurePayload, fontString);
    let h = measureHeight(prepared, width, lineHeight);

    // Apply min/max lines constraints
    const minH = minLines * lineHeight;
    if (h < minH) h = minH;

    if (maxLines !== undefined) {
      const maxH = maxLines * lineHeight;
      if (h > maxH) h = maxH;
    }

    return h;
  }, [value, width, fontString, lineHeight, minLines, maxLines]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={`resize-none overflow-y-auto block w-full outline-none ${className}`}
      style={{
        ...style,
        font: fontString,
        lineHeight: `${lineHeight}px`,
        // We add vertical padding to the height. Assuming standard px-3 py-2
        // We handle exact calculation by setting border-box, but need the content height 
        // We approximate vertical padding (e.g., 16px total) manually here if not using box-sizing content-box.
        // It's cleaner to use inline padding adjustments if required, but for a standalone input, we just apply the height.
        height: requiredHeight > 0 ? `${requiredHeight + 16}px` : 'auto', 
      }}
      {...props}
    />
  );
};

export default AutoSizeTextarea;
