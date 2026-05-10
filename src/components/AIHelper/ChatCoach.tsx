import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Bot, 
  User,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Mic,
  MicOff,
  Volume2,
  Square
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { VoiceService } from '../../services/ai/voiceService';
import { streamGenerate } from '../../lib/geminiClient';
import { getPatientContext, formatContextForPrompt } from '../../services/ai/contextService';
import { COACH_SYSTEM_INSTRUCTION } from '../../services/ai/coachService';
import { ChatMessage } from '../../types/ai';

interface ChatCoachProps {
  externalOpen?: boolean;
  onClose?: () => void;
  showTrigger?: boolean;
}

export default function ChatCoach({ externalOpen, onClose, showTrigger = true }: ChatCoachProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const handleToggle = () => {
    if (externalOpen !== undefined) {
      if (isOpen && onClose) onClose();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  // Local state for chat management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamedText, setStreamedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const voiceServiceRef = useRef<VoiceService | null>(null);
  
  useEffect(() => {
    voiceServiceRef.current = new VoiceService({
      onResult: (text) => {
        const lowerText = text.toLowerCase();
        
        // Voice Navigation Logic
        if (lowerText.includes('show my medications') || lowerText.includes('open meds')) {
          const btn = document.querySelector('[data-nav="medications"]') as HTMLButtonElement;
          btn?.click();
          setInputValue('Navigated to Pharmacy for you.');
        } else if (lowerText.includes('show my labs') || lowerText.includes('open labs') || lowerText.includes('history')) {
          const btn = document.querySelector('[data-nav="timeline"]') as HTMLButtonElement;
          btn?.click();
          setInputValue('Navigated to Medical History Analytics.');
        } else if (lowerText.includes('family') || lowerText.includes('vault')) {
          const btn = document.querySelector('[data-nav="family"]') as HTMLButtonElement;
          btn?.click();
        } else if (lowerText.includes('open upload') || lowerText.includes('upload report')) {
          const btn = document.querySelector('[data-nav="upload"]') as HTMLButtonElement;
          btn?.click();
        } else {
          setInputValue(text);
        }
        setIsListening(false);
      },
      onEnd: () => setIsListening(false),
      onError: (err) => {
        console.error("Voice error:", err);
        setIsListening(false);
      }
    });
  }, []);

  const toggleVoice = () => {
    if (isListening) {
      voiceServiceRef.current?.stop();
    } else {
      voiceServiceRef.current?.start();
    }
    setIsListening(!isListening);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, streamedText]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
        setInternalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      setStreamedText('');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user || !activeProfile || isTyping) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setStreamedText('');
    setError(null);
    setInputValue('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const patientData = await getPatientContext(user.uid, activeProfile);
      const context = formatContextForPrompt(patientData);
      const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ 
          role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model', 
          parts: [{ text: m.content }] 
        }));

      // In-line prompt construction for the stream
      const contents = [...history];
      contents.push({ role: 'user', parts: [{ text: `Clinical Context:\n${context}\n\nUser Question: ${text}` }] });

      await streamGenerate(
        {
          model: "gemini-3-flash-preview",
          contents,
          config: {
            systemInstruction: COACH_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          }
        },
        (chunk) => {
          setStreamedText(prev => prev + chunk);
        },
        (finalText) => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: finalText,
            timestamp: new Date()
          }]);
          setStreamedText('');
          setIsTyping(false);
        },
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Chat error:", err);
        const errorContent = "I encountered a connection issue. Please try again.";
        setError(errorContent);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: errorContent,
          timestamp: new Date()
        }]);
      }
      setStreamedText('');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const suggestedQuestions = [
    "How is my cholesterol looking?",
    "Explain my latest lab results",
    "Are there any drug interactions?",
    "What lifestyle changes should I consider?"
  ];

  return (
    <div className={`fixed inset-0 md:inset-auto md:bottom-24 md:right-8 z-[9999] flex flex-col items-end ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '72px' : 'min(calc(100vh - 120px), 640px)',
              width: 'min(calc(100vw - 32px), 440px)'
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`
              bg-slate-950/98 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col
              fixed md:relative
              ${isMinimized 
                ? 'bottom-40 right-4 h-[72px] w-[320px] rounded-[2rem]' 
                : 'top-20 bottom-40 left-4 right-4 md:top-auto md:bottom-2 md:left-auto md:right-0 rounded-[2rem]'
              }
              pointer-events-auto
            `}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-coach-title"
          >
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/5 bg-indigo-600/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 id="chat-coach-title" className="text-white font-bold text-sm">Aura AI Coach</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Intelligent Engine</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClose) onClose();
                    setInternalOpen(false);
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
                >
                  {messages.length === 0 && (
                    <div className="space-y-8 py-4">
                      <div className="text-center space-y-3">
                        <div className="relative inline-block">
                          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }} 
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full blur-[2px]" 
                          />
                        </div>
                        <h4 className="text-white font-bold text-xl tracking-tight">AI Analysis Ready</h4>
                        <p className="text-sm text-slate-400 px-4 leading-relaxed font-light">
                          I can analyze your health records, lab results, and medications in real-time. How can I help you today?
                        </p>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Suggested Protocols</span>
                        <div className="flex flex-col gap-2">
                          {suggestedQuestions.map((q, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSendMessage(q)}
                              className="text-left p-4 rounded-2xl bg-white/10 border border-white/20 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-sm text-slate-300 transition-all flex items-center justify-between group cursor-pointer active:scale-[0.98] pointer-events-auto"
                            >
                              <span className="font-medium pr-4 select-none">{q}</span>
                              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 transition-transform group-hover:translate-x-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-4 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-slate-800 border border-white/5'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed prose prose-invert prose-p:my-0 prose-slate ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="space-y-2">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                              <div className="pt-2 border-t border-white/10 mt-2">
                                <p className="text-[10px] text-slate-500 italic">For informational purposes only. Not medical advice.</p>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Streaming Response Overlay */}
                  {streamedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-4 max-w-[90%] md:max-w-[85%]">
                        <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-slate-800 border border-white/5">
                          <Bot className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="p-4 rounded-[1.5rem] text-sm leading-relaxed prose prose-invert prose-p:my-0 prose-slate bg-white/5 text-slate-200 border border-white/5 rounded-tl-none">
                          <div className="space-y-2">
                            <ReactMarkdown>{streamedText}</ReactMarkdown>
                            <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse align-middle">▋</span>
                            <div className="pt-2 border-t border-white/10 mt-2">
                              <p className="text-[10px] text-slate-500 italic">For informational purposes only. Not medical advice.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {isTyping && !streamedText && (
                    <div className="flex justify-start">
                      <div className="flex gap-4 max-w-[90%] md:max-w-[85%]">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-[1.5rem] rounded-tl-none">
                          <div className="flex gap-1.5 p-1">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                              className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                              className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                              className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 md:p-6 border-t border-white/5 bg-slate-950 flex flex-col gap-3">
                  {isTyping && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleAbort}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-wider"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        Stop Generating
                      </button>
                    </div>
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Query the medical engine..."}
                        disabled={isTyping}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-24 text-base md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isListening ? 'animate-pulse border-indigo-500/50' : ''} ${isTyping ? 'opacity-50' : ''}`}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={toggleVoice}
                          disabled={isTyping}
                          className={`p-2.5 rounded-xl transition-all ${
                            isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:text-indigo-400 hover:bg-white/5'
                          } ${isTyping ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button
                          type="submit"
                          disabled={!inputValue.trim() || isTyping}
                          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                        >
                          {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-1 overflow-hidden">
                    <motion.div 
                      animate={{ x: [-20, 20, -20] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="flex items-center gap-4 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3 h-3 text-slate-600" />
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                          Try "Show my medications" • "Explain my labs" • "Analyze my report"
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showTrigger && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all pointer-events-auto mr-24 mb-6 md:mr-0 md:mb-0 ${
            isOpen ? 'bg-slate-900 border border-white/10' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/40 shadow-lg'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageSquare className="w-6 h-6 text-white" />
          )}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-950" />
          )}
        </motion.button>
      )}
    </div>
  );
}

// Helper icons
function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
