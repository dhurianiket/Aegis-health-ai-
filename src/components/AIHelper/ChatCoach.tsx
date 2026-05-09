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
  Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useCoach } from '../../hooks/useCoach';
import { VoiceService } from '../../services/ai/voiceService';

export default function ChatCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { messages, sendMessage, isTyping, error } = useCoach(user?.uid || '', activeProfile);
  const voiceServiceRef = useRef<VoiceService | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

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
      setIsListening(false);
    } else {
      voiceServiceRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const suggestedQuestions = [
    "How is my cholesterol looking?",
    "Explain my latest lab results",
    "Are there any drug interactions?",
    "What lifestyle changes should I consider?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '80px' : '600px',
              width: '400px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-indigo-600/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Aegis AI Coach</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Clinical Logic Engine</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
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
                  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
                >
                  {messages.length === 0 && (
                    <div className="space-y-6 py-4">
                      <div className="text-center space-y-2">
                        <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                        <h4 className="text-white font-semibold">How can I help you today?</h4>
                        <p className="text-sm text-slate-400 px-8">
                          I can analyze your telehealth data, explain lab trends, and check for medication interactions.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {suggestedQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(q)}
                            className="text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-sm text-slate-300 transition-all flex items-center justify-between group"
                          >
                            {q}
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-2 rounded-lg h-fit ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-sm leading-relaxed prose prose-invert prose-p:my-0 prose-slate ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[85%]">
                        <div className="p-2 rounded-lg h-fit bg-slate-800">
                          <Bot className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-slate-900">
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Ask AECIS about your health..."}
                        disabled={isTyping}
                        className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${isListening ? 'animate-pulse border-indigo-500/50' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={toggleVoice}
                        className={`absolute right-12 top-1.5 p-2 rounded-lg transition-colors ${
                          isListening ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-indigo-400'
                        }`}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Volume2 className="w-3 h-3 text-slate-600" />
                    <p className="text-[10px] text-slate-500 text-center">
                      Try "Show my medications" or "Explain my labs"
                    </p>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          isOpen ? 'bg-slate-900 border border-white/10' : 'bg-indigo-600 hover:bg-indigo-500'
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
    </div>
  );
}
