import React, { useMemo, useRef, useEffect, useState } from 'react';
import { List, ListImperativeAPI } from 'react-window';
import { prepareText, measureHeight } from '../../lib/pretext';

export interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'ai';
}

export interface VirtualizedChatListProps {
  messages: ChatMessage[];
  messageWidth?: number; // optionally provide fixed width
  lineHeight?: number; 
  className?: string;
  fontFamliy?: string;
}

const USER_FONT = '400 15px Inter, sans-serif';
const AI_FONT = '400 15px Inter, sans-serif';
const DEFAULT_LINE_HEIGHT = 24;
const MSG_PADDING = 32; // Vertical padding sum (16px top + 16px bottom)

export const VirtualizedChatList: React.FC<VirtualizedChatListProps> = ({
  messages,
  messageWidth,
  lineHeight = DEFAULT_LINE_HEIGHT,
  className = '',
}) => {
  const [containerWidth, setContainerWidth] = useState<number>(messageWidth || 0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<ListImperativeAPI>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!messageWidth && entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
        if (entry.contentRect.height > 0) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [messageWidth]);

  // Pre-calculate heights synchronously
  const messageHeights = useMemo(() => {
    if (!containerWidth) return [];
    
    return messages.map((msg) => {
      const font = msg.role === 'user' ? USER_FONT : AI_FONT;
      const prepared = prepareText(msg.text, font);
      // Let's assume message bubbles take 80% of width maximum
      const bubbleWidth = containerWidth * 0.8 - 48; // minus padding
      const textHeight = measureHeight(prepared, bubbleWidth, lineHeight);
      return textHeight + MSG_PADDING;
    });
  }, [messages, containerWidth, lineHeight]);

  // Use the listRef if needed for scrolling later
  // Note: v2 dynamically manages rowHeights through the itemSize or rowHeight functions natively
  
  const getItemSize = (index: number) => {
    return messageHeights[index] || 50; // default safe fallback
  };

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const msg = messages[index];
    const isUser = msg.role === 'user';
    const font = isUser ? USER_FONT : AI_FONT;
    
    return (
      <div style={{ ...style, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div 
          className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}
        >
          <div 
            className={`max-w-[80%] px-6 py-4 rounded-2xl ${
              isUser 
                ? 'bg-blue-600 text-white dark:bg-blue-500' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
            }`}
            style={{ font: font, lineHeight: `${lineHeight}px` }}
          >
            {msg.text}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`w-full h-full flex flex-col ${className}`}>
      {containerWidth > 0 && containerHeight > 0 && (
        <List
          listRef={listRef}
          style={{ width: containerWidth, height: containerHeight }}
          rowCount={messages.length}
          rowHeight={getItemSize}
          rowComponent={Row as any}
          rowProps={{}}
        />
      )}
    </div>
  );
};

export default VirtualizedChatList;
