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
import { Heart, Stethoscope, Droplets, Zap, ShieldCheck, ChevronRight, ChevronDown, TrendingUp, AlertCircle, Clock, ExternalLink, Brain, Loader2, CheckCircle2, SlidersHorizontal, Info, Square, ArrowUp } from "lucide-react";
import { parseSafeTimestamp } from "../../utils/dateUtils";

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
            const parsed = data.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt)
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Sidebar */}
        <div className="lg:col-span-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-4 overflow-x-auto lg:overflow-y-auto hidden-scrollbar">
          <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider mb-4 px-2">Select Specialist</h3>
          <div className="flex flex-row lg:flex-col gap-2">
            {SPECIALIST_TABS.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSpecialist(s.id); } }}
                onClick={() => setActiveSpecialist(s.id)}
                className={`cursor-pointer flex-shrink-0 w-48 lg:w-full p-4 rounded-2xl flex flex-col items-start gap-1 transition-all ${
                  activeSpecialist === s.id 
                  ? 'bg-[var(--color-primary)] text-teal-950 shadow-lg' 
                  : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="font-bold text-sm tracking-wide">{s.displayName}</div>
                <div className={`text-xs ${activeSpecialist === s.id ? 'text-teal-900' : 'text-slate-600 dark:text-slate-300'}`}>
                  {s.expertise.slice(0, 2).join(', ')}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl flex flex-col relative overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-[var(--color-border)] bg-slate-50 dark:bg-black/20 flex items-center gap-4">
            <div>
              <div className="font-bold text-[var(--color-text)] text-lg">{activeSpecProfile.displayName}</div>
              <div className="text-xs text-indigo-500 dark:text-indigo-300">Guidelines: {activeSpecProfile.guidelines.join(', ')}</div>
            </div>
          </div>
          
          <div className="flex-1 p-4 space-y-4" ref={scrollRef}>
            {initialLoading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                 <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
                 <p className="text-sm text-[var(--color-text-muted)] tracking-widest">LOADING CONVERSATION...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                 <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    <Brain className="text-[var(--color-text-muted)] w-8 h-8"/>
                 </div>
                 <p className="text-sm text-[var(--color-text-muted)] text-center uppercase tracking-widest max-w-sm">
                   Ask {activeSpecProfile.displayName} about your relevant labs, conditions, or symptoms.
                 </p>
                 <div className="flex gap-2">
                    <button onClick={() => handleSendMessage("What do my latest results mean for my " + activeSpecialist + " health?")} className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-xs px-3 py-1.5 rounded-full text-[var(--color-text-muted)] transition-colors">"Summarize my labs"</button>
                 </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200'
                    }`}>
                      <div className={`prose prose-sm max-w-none ${msg.role === 'user' || document.documentElement.classList.contains('dark') ? 'prose-invert' : ''}`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <div className={`text-[10px] opacity-60 mt-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                        {(() => {
                          const d = parseSafeTimestamp(msg.timestamp);
                          return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {streamedText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 relative pb-8 shadow-sm">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{streamedText}</ReactMarkdown>
                  </div>
                  <span className="absolute bottom-4 left-5 w-2 h-4 bg-indigo-500 animate-pulse" />
                </div>
              </div>
            )}
            
            {isTyping && !streamedText && (
              <div className="flex justify-start">
                 <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span className="text-sm text-slate-400 animate-pulse">Analyzing longitudinal record...</span>
                 </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-[var(--color-border)] bg-slate-50 dark:bg-black/20">
            {isTyping && (
              <div className="flex justify-center mb-3">
                <button
                  onClick={handleAbort}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-xs font-medium uppercase text-slate-600 dark:text-slate-300 transition-colors"
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
                className="w-full bg-white dark:bg-white/5 border border-[var(--color-border)] rounded-full py-4 pl-6 pr-14 text-sm text-[var(--color-text)] focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                aria-label="Send Message"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
              >
                <ArrowUp size={20} strokeWidth={2.5} />
              </button>
            </form>
            <div className="mt-3 text-center text-[10px] text-gray-800 dark:text-slate-300 flex items-center justify-center gap-2">
              <Info className="w-3 h-3 text-amber-500" />
              <strong>MEDICAL DISCLAIMER:</strong> Not a substitute for professional medical advice, diagnosis, or treatment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
