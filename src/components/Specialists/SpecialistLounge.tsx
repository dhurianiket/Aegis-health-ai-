import React, { useState, useRef, useEffect } from "react";
import { SpecialistId } from "../../types/ai";
import { getSpecialist, SPECIALISTS } from "../../services/ai/specialists/specialistFactory";
import { getPatientContext, formatContextForPrompt } from "../../services/ai/contextService";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import getAI from "../../lib/geminiClient";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Stethoscope, Droplets, Zap, ShieldCheck, ChevronRight, ChevronDown, TrendingUp, AlertCircle, Clock, ExternalLink, Brain, Loader2, CheckCircle2, SlidersHorizontal, Info, Square, ArrowUp } from "lucide-react";

export default function SpecialistLounge() {
  const [activeSpecialist, setActiveSpecialist] = useState<SpecialistId>('cardiologist');
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedText]);

  // When specialist changes, clear chat
  useEffect(() => {
    setMessages([]);
    setStreamedText("");
    setIsTyping(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [activeSpecialist]);

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      setStreamedText("");
    }
  };

  const SPECIALIST_TABS = Object.values(SPECIALISTS);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user || !activeProfile || isTyping) return;

    const userMsg = { role: "user" as const, content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setStreamedText("");

    const SUMMARY_TRIGGER_PHRASES = [
      "how am i doing", "what's my health status", "summarize my labs", 
      "health summary", "what does this mean", "latest results"
    ];
    const isSummaryRequest = SUMMARY_TRIGGER_PHRASES.some(phrase => 
      text.toLowerCase().includes(phrase)
    );

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const ai = getAI();
      const patientData = await getPatientContext(user.uid, activeProfile);
      const context = formatContextForPrompt(patientData);

      const specialist = getSpecialist(activeSpecialist);
      let systemPrompt = specialist.systemPrompt;
      
      systemPrompt += `\n\n### PATIENT CONTEXT\n${context}`;

      if (isSummaryRequest) {
        systemPrompt += `
### HEALTH SUMMARY GENERATION RULES
When the user asks for a health status (e.g., "How am I doing?", "Summarize my labs") or asks what their new lab results mean:
1. ALWAYS generate a SBAAR-formatted health summary first (Subjective, Background, Assessment, Analysis, Recommendation).
2. Follow immediately with an "AI Doctor Summary" in plain, empathetic language.
3. Use EXACT \`display_value\` strings from the injected lab data (e.g., "< 0.1", not "0").
4. Show trends: Explicitly compare current values to historical values.
5. Flag critical values with emojis:
   - 🔴 CRITICAL: Life-threatening (e.g., HbA1c > 12)
   - ⚠️ WARNING: Needs attention (e.g., HbA1c > 7)
   - 🟡 NOTICE: Monitor closely (e.g., Vitamin D < 20)
6. ALWAYS include the mandatory medical disclaimer at the end.

### SBAAR FORMAT REQUIREMENTS
- **Subjective:** Symptoms user reported in the chat history.
- **Background:** Age, gender, conditions, medications (if known).
- **Assessment:** Markdown table with \`Marker | Your Value | Normal Range | Status\`.
- **Analysis:** Trend arrows (⬆️⬇️➡️) and chronological comparison.
- **Recommendation:** Numbered list grouped by Immediate, Lifestyle, and Follow-up.
`;
      }

      const historyItems = messages.map((m) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }],
      }));

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: historyItems,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
        }
      });

      const stream = await chat.sendMessageStream({ message: text });
      let finalText = "";
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        const chunkText = chunk.text || "";
        finalText += chunkText;
        setStreamedText((prev) => prev + chunkText);
      }

      if (!controller.signal.aborted && finalText.length > 0) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: finalText.trim(), timestamp: new Date() }
        ]);
        setStreamedText("");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I am temporarily unavailable.", timestamp: new Date() }
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const activeSpecProfile = getSpecialist(activeSpecialist);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 shrink-0">
          <Brain className="w-6 h-6 md:w-9 md:h-9" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white mb-1 uppercase tracking-widest">
            Specialist Consultations
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-light">
            Chat directly with specialized AI physicians acting on your longitudinal record.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px] max-h-[85vh]">
        {/* Sidebar */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-4 overflow-x-auto lg:overflow-y-auto hidden-scrollbar">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 px-2">Select Specialist</h3>
          <div className="flex flex-row lg:flex-col gap-2">
            {SPECIALIST_TABS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSpecialist(s.id)}
                className={`flex-shrink-0 w-48 lg:w-full p-4 rounded-2xl flex flex-col items-start gap-1 transition-all ${
                  activeSpecialist === s.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'hover:bg-white/10 text-slate-400'
                }`}
              >
                <div className="font-bold text-sm tracking-wide">{s.displayName}</div>
                <div className={`text-xs ${activeSpecialist === s.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {s.expertise.slice(0, 2).join(', ')}...
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col relative overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-4">
            <div>
              <div className="font-bold text-white text-lg">{activeSpecProfile.displayName}</div>
              <div className="text-xs text-indigo-300">Guidelines: {activeSpecProfile.guidelines.join(', ')}</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Brain className="text-slate-400 w-8 h-8"/>
                 </div>
                 <p className="text-sm text-slate-300 text-center uppercase tracking-widest max-w-sm">
                   Ask {activeSpecProfile.displayName} about your relevant labs, conditions, or symptoms.
                 </p>
                 <div className="flex gap-2">
                    <button onClick={() => handleSendMessage("What do my latest results mean for my " + activeSpecialist + " health?")} className="bg-white/10 hover:bg-white/20 text-xs px-3 py-1.5 rounded-full text-slate-300 transition-colors">"Summarize my labs"</button>
                 </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-200'
                }`}>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <div className={`text-[10px] opacity-60 mt-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {streamedText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed bg-white/10 text-slate-200 relative pb-8">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{streamedText}</ReactMarkdown>
                  </div>
                  <span className="absolute bottom-4 left-5 w-2 h-4 bg-indigo-500 animate-pulse" />
                </div>
              </div>
            )}
            
            {isTyping && !streamedText && (
              <div className="flex justify-start">
                 <div className="bg-white/5 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span className="text-sm text-slate-400 animate-pulse">Analyzing longitudinal record...</span>
                 </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-white/10 bg-black/20">
            {isTyping && (
              <div className="flex justify-center mb-3">
                <button
                  onClick={handleAbort}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium uppercase text-slate-300 transition-colors"
                >
                  <Square size={12} className="fill-current" /> Stop Generation
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="relative">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Message ${activeSpecProfile.displayName}...`}
                disabled={isTyping}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-700 transition-colors"
              >
                <ArrowUp size={20} strokeWidth={2.5} />
              </button>
            </form>
            <div className="mt-3 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
              <Info className="w-3 h-3 text-amber-500" />
              <strong>MEDICAL DISCLAIMER:</strong> Not a substitute for professional medical advice, diagnosis, or treatment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
