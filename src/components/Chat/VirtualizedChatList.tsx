import React, { useMemo, useRef, useEffect, useState } from 'react';
import { List, ListImperativeAPI } from 'react-window';
import { prepareText, measureHeight } from '../../lib/pretext';
import ReactMarkdown from 'react-markdown';
import { renderCitationLink } from '../Common/CitationBadge';

export interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'ai' | 'assistant';
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
  const listRef = useRef<any>(null);

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

  // Pre-calculate heights synchronously with accurate Markdown line-break awareness
  const messageHeights = useMemo(() => {
    if (!containerWidth || !Array.isArray(messages)) return [];
    
    return messages.map((msg) => {
      if (!msg) return 60;
      const isUser = msg.role === 'user';
      const text = (msg.text || '').toString();
      const bubbleWidth = Math.max(containerWidth * 0.8 - 48, 180);
      
      if (isUser) {
        const prepared = prepareText(text, USER_FONT);
        const textHeight = measureHeight(prepared, bubbleWidth, lineHeight);
        return Math.max(textHeight + MSG_PADDING + 16, 60);
      } else {
        // AI / Specialist message with multi-line Markdown formatting
        const rawLines = text.split('\n');
        let totalContentHeight = 0;
        
        rawLines.forEach((line) => {
          const trimmed = (line || '').trim();
          if (!trimmed) {
            totalContentHeight += 12; // Paragraph spacing
            return;
          }
          
          const isHeader = trimmed.startsWith('#');
          const isListItem = trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
          
          const font = isHeader ? '700 16px Inter, sans-serif' : AI_FONT;
          const lineLh = isHeader ? 28 : lineHeight;
          const prepared = prepareText(trimmed, font);
          const lineH = measureHeight(prepared, bubbleWidth, lineLh);
          
          // Account for citation badge pill heights in line height calculations
          const citationCount = (trimmed.match(/cite:[a-z0-9_]+/gi) || trimmed.match(/\[(ACC\/AHA|ADA|KDIGO|ESC)[^\]]*\]/gi) || []).length;
          const citationHeight = citationCount * 16;

          totalContentHeight += lineH + (isHeader ? 16 : isListItem ? 6 : 4) + citationHeight;
        });
        
        return Math.max(totalContentHeight + MSG_PADDING + 48, 80);
      }
    });
  }, [messages, containerWidth, lineHeight]);

  const getItemSize = (index: number) => {
    return messageHeights[index] || 80; // safe default fallback
  };

  // Scroll to bottom whenever messages are retrieved or updated
  useEffect(() => {
    if (listRef.current && Array.isArray(messages) && messages.length > 0) {
      try {
        listRef.current.scrollToItem(messages.length - 1, 'end');
      } catch (e) {
        // Ignore scroll bounds exception if list is re-indexing
      }
    }
  }, [messages, messageHeights]);

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const msg = messages[index];
    if (!msg) return <div style={style} />;

    const isUser = msg.role === 'user';
    const text = (msg.text || '').toString();
    
    return (
      <div 
        role="listitem"
        style={{ ...style, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '8px', paddingBottom: '8px' }}
      >
        <div 
          className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} px-2 md:px-4`}
        >
          <div 
            className={`max-w-[88%] md:max-w-[80%] px-5 py-4 rounded-2xl shadow-sm border ${
              isUser 
                ? 'bg-blue-600 dark:bg-blue-500 text-white border-transparent' 
                : 'bg-slate-50 dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 border-slate-200 dark:border-[#2C2C2E]'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-[15px] font-medium leading-[1.6]">{text}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-900 dark:text-slate-100 font-medium leading-[1.6]">
                <ReactMarkdown 
                  components={{
                    a: renderCitationLink,
                    strong: ({node, ...props}) => <strong className="text-indigo-600 dark:text-indigo-400 font-semibold" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 last:mb-0 text-slate-900 dark:text-slate-100 leading-[1.6]" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-900 dark:text-slate-100 my-1" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-2 mt-4 first:mt-0" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-slate-900 dark:text-slate-100 font-bold text-base mb-2 mt-3 first:mt-0" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-slate-900 dark:text-slate-100 font-bold text-sm mb-1 mt-3 first:mt-0" {...props} />
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`w-full h-full min-h-[300px] flex flex-col ${className}`}>
      {containerWidth > 0 && containerHeight > 0 && Array.isArray(messages) && messages.length > 0 && (
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
