import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { X, ArrowUp, Square, Sparkles, Loader2, Mic, MicOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useClinicalContext } from "../../hooks/useClinicalContext";
import { VoiceService } from "../../services/ai/voiceService";
import { streamGenerate } from "../../lib/geminiUtils";
import {
  getPatientContext,
  formatContextForPrompt,
} from "../../services/ai/contextService";
import { COACH_SYSTEM_INSTRUCTION } from "../../services/ai/coachService";
import { ChatMessage } from "../../types/ai";
import { parseSafeTimestamp } from "../../utils/dateUtils";
import getAI from "../../lib/geminiClient";
import { safeJsonParse, getFriendlyErrorMessage } from "../../utils/aiUtils";
import { trackUsage } from "../../services/usageService";
import { getActiveMedications } from "../../services/medicationService";
import { getUpcomingReminders } from "../../services/reminderService";

interface ChatCoachProps {
  externalOpen?: boolean;
  onClose?: () => void;
  showTrigger?: boolean;
}

export default function ChatCoach({
  externalOpen,
  onClose,
  showTrigger = true,
}: ChatCoachProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const handleToggle = () => {
    if (externalOpen !== undefined) {
      if (isOpen && onClose) onClose();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  const [inputValue, setInputValue] = useState("");
  const [isAlAvailable, setIsAlAvailable] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const voiceServiceRef = useRef<any>(null);
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { contextString: globalClinicalContext } = useClinicalContext();

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const SpeechRecognitionImpl =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionImpl) {
          voiceServiceRef.current = new VoiceService({
            onResult: (text) => {
              if (text) {
                setInputValue((prev) => {
                  const prefix = prev.trim() ? prev.trim() + " " : "";
                  return prefix + text;
                });
              }
            },
            onEnd: () => {
              setIsListening(false);
            },
            onError: (err) => {
              console.warn("[Voice] Error:", err);
              setIsListening(false);
            },
            language: "en-US",
          });
        }
      } catch (e) {
        console.warn("[Voice] Web Speech API initialization skipped", e);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!voiceServiceRef.current) {
      console.warn("[Voice] Speech recognition not supported or not loaded.");
      return;
    }
    if (isListening) {
      voiceServiceRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceServiceRef.current.start();
    }
  };

  useEffect(() => {
    try {
      const ai = getAI();
      setIsAlAvailable(!!ai);
    } catch {
      setIsAlAvailable(false);
    }
  }, []);
  const [contextStats, setContextStats] = useState({ meds: 0, reports: 0 });
  useEffect(() => {
    if (isOpen && user && activeProfile) {
      getPatientContext(user.uid, activeProfile).then(ctx => {
        setContextStats({ meds: ctx.medications?.length || 0, reports: ctx.labHistory?.length || 0 });
      }).catch(console.error);
    }
  }, [isOpen, user, activeProfile]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamedText, setStreamedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [processingMessage, setProcessingMessage] = useState("Analyzing your request...");
  useEffect(() => {
    if (!isTyping) {
      setProcessingMessage("Analyzing your request...");
      return;
    }
    const messages = [
      "Analyzing your request...",
      "Reading clinical context...",
      "Identifying lab values...",
      "Checking reference ranges...",
      "Preparing your analysis...",
      "Almost done..."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setProcessingMessage(messages[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, streamedText]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onClose) onClose();
        setInternalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      setStreamedText("");
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user || !activeProfile || isTyping) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setStreamedText("");
    setError(null);
    setInputValue("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const ai = getAI();
      if (!ai) {
        throw new Error("AI features are temporarily unavailable (API key missing).");
      }

      const patientData = await getPatientContext(user.uid, activeProfile);
      const context = formatContextForPrompt(patientData);
      
      const activeMeds = await getActiveMedications(user.uid);
      const reminders = await getUpcomingReminders(user.uid, 30);
      
      const medsContext = activeMeds.length > 0 
        ? `\nPatient's Active Medications: ${activeMeds.map(m => `${(m as any).genericName || (m as any).name || (m as any).brandName || (m as any).medicationName || 'Unknown'} ${m.dosage || ''}`).join(', ')}` 
        : '\nPatient has no active medications logged.';
        
      const remindersContext = reminders.length > 0
        ? `\nPending Lab Reminders: ${reminders.map(r => `${r.testName} (Due: ${r.dueDate})`).join(', ')}`
        : '';

      const historyItems = JSON.parse(JSON.stringify(messages
        .filter((m) => m.role !== "system" && (m.role as string) !== "context_note")
        .map((m) => ({
          role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
          parts: [{ text: String(m.content || "") }],
        }))));

      const sysInstruction = `You are Aegis Health AI. Today's date is ${new Date().toISOString().split("T")[0]}. 
Clinical Context is provided below. 

STRICT RULES:
1. NEVER invent or guess medications, conditions, or lab results.
2. If data is missing or uncertain, state clearly: "I don't have that information in your profile."
3. Prefer manually entered medications over extracted ones.
4. If the user says a medication or result is "wrong", acknowledge it, do not repeat the incorrect data, and say: "I may be using outdated or incorrectly extracted data. Please update your records in the Medications/Profile section, or tell me the correct information and I will use that for our conversation."
5. Be concise, empathetic, and always add a disclaimer to consult a doctor.

GLOBAL CLINICAL CONTEXT:
${globalClinicalContext}

Clinical Context:
${context}
${medsContext}
${remindersContext}`;

      const isComplex = text.length > 150 || /analyze|summarize|explain in detail|sbaar|diagnosis|clinical/i.test(text);
      let targetModel = isComplex ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";

      let chat = ai.chats.create({
        model: targetModel,
        history: historyItems,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.2,
        }
      });

      let stream;
      try {
        stream = await chat.sendMessageStream({ message: text });
      } catch (proError: any) {
        if (targetModel === "gemini-3.1-pro-preview") {
          console.warn("Gemini Pro chat failed, falling back to Flash:", proError);
          chat = ai.chats.create({
            model: "gemini-3-flash-preview",
            history: historyItems,
            config: {
              systemInstruction: sysInstruction,
              temperature: 0.2,
            }
          });
          stream = await chat.sendMessageStream({ message: text });
        } else {
          throw proError;
        }
      }

      let finalText = "";
      let finalUsage: any = null;
      
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        const chunkText = chunk.text || "";
        finalText += chunkText;
        setStreamedText((prev) => prev + chunkText);
        if (chunk.usageMetadata) finalUsage = chunk.usageMetadata;
      }
      
      if (controller.signal.aborted) return;
      
      if (finalUsage && user?.uid) {
         trackUsage(user.uid, {
            promptTokens: finalUsage.promptTokenCount,
            responseTokens: finalUsage.candidatesTokenCount,
            totalTokens: finalUsage.totalTokenCount,
            feature: 'chat'
         }).catch(console.error);
      }

      // POST-RESPONSE GUARDRAIL
      const DIAGNOSTIC_TRIGGERS = [
        'you have ', 'you are diagnosed', 'this indicates ', 
        'this confirms ', 'you suffer from', 'diagnosis is',
        'you definitely', 'results show you'
      ];
      
      const needsGuardrail = DIAGNOSTIC_TRIGGERS.some(t => 
        finalText.toLowerCase().includes(t)
      );
      
      if (needsGuardrail) {
        try {
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (apiKey) {
            const filterRes = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: [{ role: "user", parts: [{ text: `Check if this medical AI response provides a definitive medical diagnosis rather than just general information or suggestions to see a doctor. Return JSON { "isDiagnosis": boolean, "safeText": "original text or hedged version" }\n\nResponse:\n${finalText}` }] }],
              config: { 
                temperature: 0.1, 
                responseMimeType: "application/json"
              }
            });
            const filterData = safeJsonParse<any>(filterRes.text, { isDiagnosis: false });
            if (filterData.isDiagnosis) {
               finalText = filterData.safeText || (finalText + "\n\n*(Note: Please consult a healthcare professional for a formal diagnosis.)*");
            }
          }
        } catch (e) {
           console.error("Guardrail check failed", e);
        }
      }
      
      const cleaned = finalText
        .replace(/Shield Failure[\s\S]*?System Reboot/gi, "")
        .replace(/Async Error[\s\S]*?\}/gi, "")
        .trim();

      const EMERGENCY_TRIGGERS = [
        'emergency', 'urgent', 'immediate medical', 'call 911', 'go to the hospital', 'critical'
      ];
      if (EMERGENCY_TRIGGERS.some(t => cleaned.toLowerCase().includes(t))) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]); // Vibrate, pause, vibrate
        }
      }

      if (cleaned.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: cleaned,
            timestamp: new Date(),
          },
        ]);
      }
      setStreamedText("");
    } catch (err: any) {
      if (err.name === "AbortError") {
        if (import.meta.env.DEV) console.log("Chat aborted silently");
        return;
      }
      console.error("Chat error:", err);
      const friendlyMsg = getFriendlyErrorMessage(err);
      setError(friendlyMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: friendlyMsg,
          timestamp: new Date(),
        },
      ]);
      setStreamedText("");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const suggestedQuestions = [
    "What are my abnormal values?",
    "Explain my cholesterol results",
    "What should I discuss with my doctor?",
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] pointer-events-auto"
            onClick={handleToggle}
          />
        )}
      </AnimatePresence>

      <div
        className={`fixed inset-y-0 right-0 z-[9999] flex ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%", pointerEvents: "none" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 z-[9999] w-full sm:w-[420px] max-w-full h-[100dvh] flex flex-col bg-[var(--color-bg)] border-l border-[var(--color-border)] sm:rounded-l-3xl pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0 pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-title"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
                <div>
                  <h3 id="chat-title" className="section-title">
                    Aura AI
                  </h3>
                  <div className="flex flex-col mt-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isAlAvailable ? 'bg-[var(--color-primary)] animate-pulse' : 'bg-red-500'}`} />
                      <span className="label-caps !text-xs">
                        {isAlAvailable ? 'Clinical Engine Active' : 'Neural Link Offline'}
                      </span>
                    </div>
                    {isAlAvailable && contextStats.reports > 0 && (
                      <span className="text-xs text-muted mt-1">
                        Aware of {contextStats.meds} meds, {contextStats.reports} recent data points
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  className="p-2 hover:bg-[var(--color-surface)] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                </button>
              </div>

              <div className="shrink-0 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 text-xs font-semibold p-2.5 text-center border-b border-amber-300 dark:border-amber-800/80">
                Aura AI is an educational assistant, not a clinical authority. Always consult a doctor for medical advice.
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 scroll-smooth">
                {messages.length === 0 && (
                  <div className="flex flex-col h-full justify-center space-y-8">
                    <div className="text-center space-y-2">
                      <Sparkles
                        className="w-12 h-12 text-[var(--color-primary)] mx-auto mb-4 opacity-80"
                        strokeWidth={1}
                      />
                      <p className="text-[1.125rem] font-bold text-slate-900 dark:text-slate-100">
                        Ask me anything about your health
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium px-4">
                        Upload a report to get started — I can then analyse your results and answer questions about your health
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {[
                        "What are my abnormal values?",
                        "Explain my cholesterol results",
                        "What should I discuss with my doctor?"
                      ].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(q)}
                          className="text-left px-4 py-3 rounded-[16px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[var(--color-primary)] text-white font-medium shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert text-slate-900 dark:text-slate-100 max-w-none font-medium">
                          <ReactMarkdown components={{
                            strong: ({node, ...props}) => <strong className="text-indigo-700 dark:text-indigo-300 font-bold" {...props} />
                          }}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                      )}
                      <div className={`text-xs mt-1.5 ${msg.role === "user" ? "text-right text-white/80" : "text-left text-slate-600 dark:text-slate-300 font-semibold"}`}>
                        {(() => {
                          const d = parseSafeTimestamp(msg.timestamp);
                          return d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                        })()}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Streaming Response Overlay */}
                {streamedText && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 pb-8 relative shadow-sm">
                      <div className="prose prose-sm dark:prose-invert text-slate-900 dark:text-slate-100 max-w-none font-medium">
                        <ReactMarkdown components={{
                            strong: ({node, ...props}) => <strong className="text-indigo-700 dark:text-indigo-300 font-bold" {...props} />
                          }}>{streamedText}</ReactMarkdown>
                      </div>
                      <span className="absolute bottom-4 left-4 w-2 h-4 bg-[var(--color-primary)] animate-pulse" />
                    </div>
                  </div>
                )}

                {isTyping && !streamedText && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 flex gap-3 items-center min-h-[52px]">
                      <Loader2 className="w-4 h-4 text-[var(--color-primary)] animate-spin" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 animate-pulse">
                         {processingMessage}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={scrollRef} className="h-1" />
              </div>

              {/* Input Area */}
              <div className="shrink-0 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
                {isTyping && (
                  <div className="flex justify-center mb-3">
                    <button
                      onClick={handleAbort}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-semibold tracking-wider uppercase text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <Square size={10} className="fill-current" /> Stop
                    </button>
                  </div>
                )}
                {messages.length > 0 && !isTyping && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none -mx-1 px-1">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(q)}
                        className="shrink-0 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors duration-200"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isAlAvailable ? (isListening ? "Listening..." : "Ask Aura AI...") : "Neural Link Offline"}
                    disabled={isTyping || !isAlAvailable}
                    className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-full py-3.5 pl-5 pr-24 text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${isTyping || !isAlAvailable ? "pointer-events-none opacity-50" : ""} ${isListening ? "ring-2 ring-indigo-500 bg-indigo-500/5 animate-pulse" : ""}`}
                  />
                  <div className="absolute right-1.5 top-1.5 bottom-1.5 flex gap-1.5">
                    {voiceServiceRef.current && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`aspect-square w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isListening
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                        title={isListening ? "Stop listening" : "Talk to Aura AI"}
                      >
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}
                    <button
                      type="submit"
                      aria-label="Send message"
                      disabled={!inputValue.trim() || isTyping || !isAlAvailable}
                      className="aspect-square w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      <ArrowUp size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </form>
                <div className="mt-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isAlAvailable ? "Generated by Aegis AI. Not a diagnosis." : "Please configure VITE_GEMINI_API_KEY to enable AI."}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showTrigger && !isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-[9900]"
          aria-label="Open AI Assistant"
        >
          <Sparkles size={24} />
        </button>
      )}
    </>
  );
}
