import React, { useMemo, useEffect, useState } from 'react';
import { prepareText, measureHeight } from '../../lib/pretext';

export interface FixedSizeTextProps {
  text: string;
  font: string; // CSS font string e.g., "400 16px Inter"
  width?: number; // width in pixels. If not provided, will await mount measurement
  lineHeight: number; // exact line height in pixels
  maxLines?: number;
  className?: string;
  onHeightReady?: (height: number) => void;
}

export const FixedSizeText: React.FC<FixedSizeTextProps> = ({
  text,
  font,
  width,
  lineHeight,
  maxLines,
  className = '',
  onHeightReady
}) => {
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(width);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // If width isn't passed, we measure the parent div first
  useEffect(() => {
    if (width !== undefined) {
      setMeasuredWidth(width);
      return;
    }
    if (!containerRef) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setMeasuredWidth(entry.contentRect.width);
        }
      }
    });
    
    observer.observe(containerRef);
    return () => observer.disconnect();
  }, [width, containerRef]);

  // We use useMemo to synchronously calculate the height if we know the width
  const prepared = useMemo(() => prepareText(text, font), [text, font]);
  
  const height = useMemo(() => {
    if (measuredWidth === undefined || measuredWidth === 0) return 0;
    
    let calcHeight = measureHeight(prepared, measuredWidth, lineHeight);
    if (maxLines !== undefined) {
      const maxHeight = maxLines * lineHeight;
      if (calcHeight > maxHeight) calcHeight = maxHeight;
    }
    return calcHeight;
  }, [prepared, measuredWidth, lineHeight, maxLines]);

  useEffect(() => {
    if (height > 0 && onHeightReady) {
      onHeightReady(height);
    }
  }, [height, onHeightReady]);

  // If we don't know the width yet, we render a placeholder to measure
  if (measuredWidth === undefined || measuredWidth === 0) {
    return <div ref={setContainerRef} className="w-full h-0" />;
  }

  const style: React.CSSProperties = {
    height: `${height}px`,
    lineHeight: `${lineHeight}px`,
    font: font,
    width: width !== undefined ? `${width}px` : 'auto',
    overflow: maxLines !== undefined ? 'hidden' : 'visible',
    display: maxLines !== undefined ? '-webkit-box' : 'block',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: maxLines !== undefined ? 'vertical' : undefined,
  };

  return (
    <div 
      className={`text-slate-900 dark:text-slate-100 ${className}`} 
      style={style}
    >
      {text}
    </div>
  );
};

export default FixedSizeText;
