import { createPortal } from "react-dom";
import { generateSourceHash, getCachedReport, saveCachedReport } from "../../services/cacheService";
import React, { useState, useRef, useEffect } from "react";
import { SpecialistId } from "../../types/ai";
import { getSpecialist, SPECIALISTS } from "../../services/ai/specialists/specialistFactory";
import { getPatientContext, formatContextForPrompt } from "../../services/ai/contextService";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useClinicalContext } from "../../hooks/useClinicalContext";
import getAI from "../../lib/geminiClient";
import { db } from "../../lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Stethoscope, Droplets, Zap, ShieldCheck, ChevronRight, ChevronDown, TrendingUp, AlertCircle, Clock, ExternalLink, Brain, Loader2, CheckCircle2, SlidersHorizontal, Info, Square, ArrowUp, ChevronLeft } from "lucide-react";
import { parseSafeTimestamp } from "../../utils/dateUtils";
import VirtualizedChatList, { ChatMessage } from "../Chat/VirtualizedChatList";

const PROMPT_VERSION = "v1.0";

export default function SpecialistLounge() {
  const [activeSpecialist, setActiveSpecialist] = useState<SpecialistId>('cardiologist');
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { contextString: globalClinicalContext } = useClinicalContext();
  
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

  const [initialLoading, setInitialLoading] = useState(false);

  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // When specialist changes, clear chat and load from firestore
  useEffect(() => {
    setMessages([]);
    setStreamedText("");
    setIsTyping(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    async function fetchChat() {
      if (!user?.uid || !activeProfile?.id) return;
      setInitialLoading(true);
      try {
        const chatDoc = await getDoc(doc(db, "users", user.uid, "profiles", activeProfile.id, "specialistChats", activeSpecialist));
        if (chatDoc.exists()) {
          const data = chatDoc.data();
          if (data.messages && Array.isArray(data.messages)) {
            const parsed = data.messages
              .filter((m: any) => m && typeof m === 'object')
              .map((m: any) => ({
                role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: (m.content || m.text || '').toString(),
                timestamp: m.createdAt ? new Date(m.createdAt) : new Date()
              }));
            setMessages(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchChat();
  }, [activeSpecialist, user?.uid, activeProfile?.id]);

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      setStreamedText("");
    }
  };

  const SPECIALIST_TABS = Object.values(SPECIALISTS);

  const saveChatHistory = async (newMessages: { role: string, content: string, timestamp: Date }[]) => {
    if (!user?.uid || !activeProfile?.id) return;
    try {
      const chatRef = doc(db, "users", user.uid, "profiles", activeProfile.id, "specialistChats", activeSpecialist);
      const serializableMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.timestamp.toISOString()
      }));
      
      await setDoc(chatRef, {
        specialistId: activeSpecialist,
        profileId: activeProfile.id,
        userId: user.uid,
        messages: serializableMessages,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save chat history", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user || !activeProfile || isTyping) return;

    const userMsg = { role: "user" as const, content: text, timestamp: new Date() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    saveChatHistory(newMsgs);
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
      
      if (globalClinicalContext) {
        systemPrompt += `\n\n### GLOBAL CLINICAL CONTEXT\n${globalClinicalContext}`;
      }
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

      const historyItems = JSON.parse(JSON.stringify(messages.map((m) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: String(m.content || "") }],
      }))));

      // Check Cache for Specialist Summaries
      let sourceHashForCache = "";
      if (isSummaryRequest && historyItems.length === 0) {
        sourceHashForCache = await generateSourceHash(systemPrompt + text);
        const cached = await getCachedReport(user.uid, activeProfile.id || "Myself", `SpecialistSummary_${activeSpecialist}`, sourceHashForCache, PROMPT_VERSION, false);
        if (cached) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: cached, timestamp: new Date() }
          ]);
          setIsTyping(false);
          setStreamedText("");
          return;
        }
      }

      let chat = ai.chats.create({
        model: isSummaryRequest ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
        history: historyItems,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
        }
      });

      let stream;
      try {
        stream = await chat.sendMessageStream({ message: text });
      } catch (proError: any) {
        if (isSummaryRequest) {
          console.warn("Gemini Pro stream failed, falling back to Flash:", proError);
          chat = ai.chats.create({
            model: "gemini-3-flash-preview",
            history: historyItems,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.1,
            }
          });
          stream = await chat.sendMessageStream({ message: text });
        } else {
          throw proError;
        }
      }

      let finalText = "";
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        const chunkText = chunk.text || "";
        finalText += chunkText;
        setStreamedText((prev) => prev + chunkText);
      }

      if (!controller.signal.aborted && finalText.length > 0) {
        const assistantMsg = { role: "assistant" as const, content: finalText.trim(), timestamp: new Date() };
        const finalMsgs = [...newMsgs, assistantMsg];
        setMessages(finalMsgs);
        saveChatHistory(finalMsgs);
        setStreamedText("");
        
        if (isSummaryRequest && historyItems.length === 0 && sourceHashForCache) {
          await saveCachedReport(user.uid, {
            patientId: activeProfile.id || "Myself",
            reportType: `SpecialistSummary_${activeSpecialist}`,
            sourceHash: sourceHashForCache,
            content: finalText.trim(),
            modelUsed: "gemini-3.1-pro-preview",
            promptVersion: PROMPT_VERSION,
            status: "success"
          });
        }
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

  const chatAreaContent = (
    <>
      <div className="p-4 pt-[max(env(safe-area-inset-top),16px)] lg:pt-4 lg:p-6 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] flex items-center gap-4 shrink-0 transition-colors z-10">
        <button 
          className="lg:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-slate-100 transition-colors active:scale-95"
          onClick={() => setIsMobileChatOpen(false)}
        >
          <ChevronLeft className="w-6 h-6 shrink-0" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-base md:text-lg tracking-tight truncate">{activeSpecProfile.displayName}</div>
          <div className="text-[13px] text-slate-800 dark:text-slate-200 truncate font-semibold">Guidelines: {activeSpecProfile.guidelines.join(', ')}</div>
        </div>
        <div className="shrink-0">
           <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1C1C1E] flex items-center justify-center">
             <Brain className="w-5 h-5 text-slate-600 dark:text-slate-300" />
           </div>
        </div>
      </div>
      
      <div 
        className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto min-h-0 bg-white dark:bg-[#0A0A0A]" 
        ref={scrollRef}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {initialLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-8 h-8 text-slate-600 dark:text-slate-300 animate-spin" />
             <p className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-widest uppercase">Loading Conversation</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-90 space-y-6 px-6">
             <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#1C1C1E] flex items-center justify-center mb-2 shadow-inner border border-slate-200 dark:border-white/10">
                <Stethoscope className="text-slate-600 dark:text-slate-300 w-10 h-10"/>
             </div>
             <p className="text-[15px] text-slate-700 dark:text-slate-300 text-center font-medium leading-relaxed max-w-sm">
               Ask {activeSpecProfile.displayName} about your relevant labs, conditions, or symptoms.
             </p>
             <div className="flex gap-2 w-full max-w-[280px]">
                <button 
                  onClick={() => handleSendMessage("What do my latest results mean for my " + activeSpecialist + " health?")} 
                  className="w-full bg-slate-900 border border-slate-900/10 dark:bg-[#1C1C1E] dark:border-[#2C2C2E] text-white hover:opacity-90 text-[15px] font-semibold px-4 py-3.5 rounded-[20px] transition-all active:scale-[0.98] shadow-sm"
                >
                  Summarize my labs
                </button>
             </div>
          </div>
        ) : (
          <div className="flex-1 w-full relative min-h-[450px] h-full flex flex-col">
            <VirtualizedChatList 
              messages={messages.map((m: any, i) => ({ id: String(i), role: m.role, text: m.content || "" }))} 
            />
          </div>
        )}
        
        {streamedText && (
          <div className="flex justify-start pr-12 pb-2">
            <div className="max-w-[100%] rounded-[24px] rounded-bl-[8px] px-5 py-4 text-[16px] leading-[1.6] bg-slate-50 dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 relative pb-8 shadow-sm border border-slate-200 dark:border-[#2C2C2E]">
              <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-[1.6] prose-li:my-1 prose-headings:mb-4 prose-headings:mt-8 first:prose-headings:mt-0 font-medium marker:text-slate-300 dark:marker:text-slate-400 max-w-none">
                <ReactMarkdown>{streamedText}</ReactMarkdown>
              </div>
              <span className="absolute bottom-5 left-6 w-2 h-2 bg-slate-500 dark:bg-slate-400 animate-pulse rounded-full" />
            </div>
          </div>
        )}
        
        {isTyping && !streamedText && (
          <div className="flex justify-start pr-12 pb-2">
             <div className="bg-slate-50 dark:bg-[#1C1C1E] rounded-[24px] rounded-bl-[8px] px-5 py-4 flex items-center gap-3 shadow-sm border border-slate-200 dark:border-[#2C2C2E]">
                <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-300 animate-spin" />
                <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300 animate-pulse">Analyzing record...</span>
             </div>
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-6 lg:p-6 pb-[max(env(safe-area-inset-bottom),16px)] lg:pb-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] shrink-0 transition-colors z-10 w-full">
        {isTyping && (
          <div className="flex justify-center mb-3">
            <button
              onClick={handleAbort}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#1C1C1E] hover:bg-slate-200 dark:hover:bg-[#2C2C2E] text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 transition-colors active:scale-95"
            >
              <Square size={10} className="fill-current" /> Stop
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative w-full">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${activeSpecProfile.displayName}...`}
            className="w-full bg-slate-100 dark:bg-[#1C1C1E] border border-slate-300 dark:border-[#3C3C3E] rounded-full py-4 pl-6 pr-14 text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20 transition-all disabled:opacity-50 shadow-sm"
          />
          <button
            type="submit"
            aria-label="Send Message"
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2.5 top-2.5 bottom-2.5 aspect-square bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-[#2C2C2E] transition-colors active:scale-95"
          >
            <ArrowUp size={20} className="stroke-[3px]" />
          </button>
        </form>
        <div className="mt-3 md:mt-4 text-center text-[12px] font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 w-full">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Not a substitute for professional medical advice.
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 shrink-0">
          <Brain className="w-6 h-6 md:w-9 md:h-9" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-bold tracking-tight text-[var(--color-text)] mb-1 uppercase tracking-widest">
            Specialist Consultations
          </h2>
          <p className="text-[var(--color-text-muted)] text-xs md:text-sm font-light">
            Chat directly with specialized AI physicians acting on your longitudinal record.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-[600px] lg:h-[max(calc(100vh-200px),600px)]">
        {/* Sidebar */}
        <div className={`lg:col-span-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-4 md:p-6 overflow-y-auto hidden-scrollbar block lg:block`}>
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-3 mb-5">Select Specialist</h3>
          <div className="flex flex-col gap-2">
            {SPECIALIST_TABS.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                aria-selected={activeSpecialist === s.id}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSpecialist(s.id); setIsMobileChatOpen(true); } }}
                onClick={() => { setActiveSpecialist(s.id); setIsMobileChatOpen(true); }}
                className={`cursor-pointer w-full p-4 md:p-5 rounded-[24px] flex flex-col items-start gap-1 transition-all duration-300 relative overflow-hidden ${
                  activeSpecialist === s.id 
                  ? 'bg-slate-900 border border-slate-900/10 dark:bg-[#1C1C1E] dark:border-[#2C2C2E] shadow-xl shadow-slate-900/10 dark:shadow-none text-white' 
                  : 'bg-transparent border border-transparent hover:bg-slate-50 dark:hover:bg-[#1C1C1E]/50'
                }`}
              >
                {activeSpecialist === s.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                )}
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeSpecialist === s.id ? 'bg-white/10' : 'bg-slate-200 dark:bg-[#2C2C2E]'}`}>
                    <Brain className={`w-5 h-5 ${activeSpecialist === s.id ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-[15px] tracking-tight truncate ${activeSpecialist === s.id ? 'text-white' : 'text-[var(--color-text)] dark:text-slate-100'}`}>{s.displayName}</div>
                    <div className={`text-[12px] font-medium truncate ${activeSpecialist === s.id ? 'text-slate-200' : 'text-[var(--color-text-muted)] dark:text-slate-300'}`}>
                      {s.expertise.slice(0, 2).join(' • ')}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Chat Area */}
        <div className={`hidden lg:flex lg:col-span-8 lg:rounded-[32px] lg:flex-col lg:relative lg:overflow-hidden lg:shadow-2xl lg:border lg:border-[var(--color-border)] lg:bg-[var(--color-surface)] lg:h-auto`}>
          {chatAreaContent}
        </div>
      </div>

      {/* Mobile Chat Portal */}
      <AnimatePresence>
        {isMobileChatOpen && (
          <React.Fragment>
            {/* Create portal manually to attach it to document.body, outside app shell */}
            {typeof window !== 'undefined' && document.body && 
              createPortal(
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 z-[200] flex flex-col h-[100dvh] w-full bg-white dark:bg-[#0A0A0A] m-0 rounded-none border-none pointer-events-auto lg:hidden"
                >
                  {chatAreaContent}
                </motion.div>,
                document.body
              )
            }
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
