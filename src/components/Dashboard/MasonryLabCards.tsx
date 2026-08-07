import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { prepareText, measureHeight } from '../../lib/pretext';

export interface LabCardData {
  id: string;
  title: string;
  value: string;
  note?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface MasonryLabCardsProps {
  cards: LabCardData[];
  cardWidth?: number; // Target optimal width
  cardGap?: number;
  className?: string;
}

const TITLE_FONT = '500 16px "Space Grotesk", sans-serif';
const VALUE_FONT = '700 24px "Space Grotesk", sans-serif';
const NOTE_FONT = '400 14px Inter, sans-serif';

const TITLE_LH = 24;
const VALUE_LH = 32;
const NOTE_LH = 20;

export const MasonryLabCards: React.FC<MasonryLabCardsProps> = ({
  cards,
  cardWidth = 300,
  cardGap = 16,
  className = ''
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Determine number of columns based on container width
  const columnsCount = Math.max(1, Math.floor((containerWidth + cardGap) / (cardWidth + cardGap)));
  
  // Calculate actual column width to fill the container perfectly
  const actualColWidth = columnsCount > 0 
    ? (containerWidth - (columnsCount - 1) * cardGap) / columnsCount
    : cardWidth;

  const masonColumns = useMemo(() => {
    if (!containerWidth || actualColWidth <= 0) return [];

    const cols: { currentHeight: number, items: (LabCardData & { height: number; index: number })[] }[] = 
      Array.from({ length: columnsCount }).map(() => ({ currentHeight: 0, items: [] }));

    cards.forEach((card, index) => {
      // 1. Measure title height
      const titlePrep = prepareText(card.title, TITLE_FONT);
      const titleHeight = measureHeight(titlePrep, actualColWidth - 32, TITLE_LH); // 32px padding (16 left/right)

      // 2. Measure value height
      const valuePrep = prepareText(card.value, VALUE_FONT);
      const valueHeight = measureHeight(valuePrep, actualColWidth - 32, VALUE_LH);

      // 3. Measure note height
      let noteHeight = 0;
      if (card.note) {
        const notePrep = prepareText(card.note, NOTE_FONT);
        noteHeight = measureHeight(notePrep, actualColWidth - 32, NOTE_LH) + 8; // +8px margin
      }

      // 4. Calculate total card dimension: inner spacing + outer padding
      // Padding: 16 top + 16 bottom = 32
      // Spacing between elements: ~8px
      const totalCardHeight = titleHeight + valueHeight + noteHeight + 32 + 16 + 24; // approx spacing offsets

      // 5. Find shortest column to place this card
      let shortestColIdx = 0;
      let minHeight = cols[0].currentHeight;
      for (let i = 1; i < columnsCount; i++) {
        if (cols[i].currentHeight < minHeight) {
          minHeight = cols[i].currentHeight;
          shortestColIdx = i;
        }
      }

      // 6. Push to shortest column
      cols[shortestColIdx].items.push({ ...card, height: totalCardHeight, index });
      cols[shortestColIdx].currentHeight += totalCardHeight + cardGap;
    });

    return cols;
  }, [cards, containerWidth, columnsCount, actualColWidth, cardGap]);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {containerWidth > 0 && (
        <div className="flex items-start" style={{ gap: `${cardGap}px` }}>
          {masonColumns.map((col, cIdx) => (
            <div 
              key={cIdx} 
              className="flex flex-col" 
              style={{ width: `${actualColWidth}px`, gap: `${cardGap}px` }}
            >
              {col.items.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: item.index * 0.05, ease: "easeOut" }}
                  className="bg-white dark:bg-[#121214] rounded-[20px] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 flex flex-col hover:-translate-y-1 hover:shadow-md hover:border-teal-500/30 transition-all duration-200 cursor-pointer group"
                  style={{ height: `${item.height}px` }}
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-slate-800 dark:text-slate-200 font-semibold m-0 tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" style={{ font: TITLE_FONT, lineHeight: `${TITLE_LH}px` }}>
                      {item.title}
                    </h3>
                    {item.trend && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                        item.trend === 'up' 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40' 
                          : item.trend === 'down' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                      }`}>
                        {item.trend === 'up' ? '↑ High' : item.trend === 'down' ? '↓ Low' : '→ Stable'}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-900 dark:text-white font-bold mb-2 tracking-tight" style={{ font: VALUE_FONT, lineHeight: `${VALUE_LH}px` }}>
                    {item.value}
                  </div>
                  {item.note && (
                    <div className="text-slate-800 dark:text-slate-200 font-semibold text-xs mt-auto pt-2 border-t border-slate-100 dark:border-white/10" style={{ font: NOTE_FONT, lineHeight: `${NOTE_LH}px` }}>
                      {item.note}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MasonryLabCards;
