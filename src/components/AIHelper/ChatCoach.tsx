import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { X, ArrowUp, Square, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { VoiceService } from "../../services/ai/voiceService";
import { streamGenerate } from "../../lib/geminiClient";
import {
  getPatientContext,
  formatContextForPrompt,
} from "../../services/ai/contextService";
import { COACH_SYSTEM_INSTRUCTION } from "../../services/ai/coachService";
import { ChatMessage } from "../../types/ai";

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
  const { user } = useAuth();

  useEffect(() => {
    import("../../lib/geminiClient").then(({ GoogleGenAI }) => {
      const ai = new GoogleGenAI();
      setIsAlAvailable(ai.isAvailable);
    });
  }, []);
  const { activeProfile } = useProfile();

  // Local state for chat management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamedText, setStreamedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const { GoogleGenAI } = await import("../../lib/geminiClient");
      const tempAi = new GoogleGenAI();
      if (!tempAi.isAvailable) {
        throw new Error("AI features are temporarily unavailable (API key missing).");
      }

      const patientData = await getPatientContext(user.uid, activeProfile);
      const context = formatContextForPrompt(patientData);
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
          parts: [{ text: m.content }],
        }));

      const contents = [...history];
      contents.push({
        role: "user",
        parts: [
          { text: `Clinical Context:\n${context}\n\nUser Question: ${text}` },
        ],
      });

      await streamGenerate(
        {
          model: "gemini-2.0-flash",
          contents,
          config: {
            systemInstruction: COACH_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        },
        (chunk) => {
          setStreamedText((prev) => prev + chunk);
        },
        (finalText) => {
          // POST-RESPONSE GUARDRAIL
          (async () => {
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
                const { GoogleGenAI } = await import("../../lib/geminiClient");
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (apiKey) {
                  const ai = new GoogleGenAI({ apiKey });
                  const filterRes = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: [{ role: "user", parts: [{ text: `Check if this medical AI response provides a definitive medical diagnosis rather than just general information or suggestions to see a doctor. Return JSON { "isDiagnosis": boolean, "safeText": "original text or hedged version" }\n\nResponse:\n${finalText}` }] }],
                    config: { 
                      temperature: 0, 
                      responseMimeType: "application/json"
                    }
                  });
                  const { safeJsonParse } = await import("../../utils/aiUtils");
                  const filterData = safeJsonParse<any>(filterRes.text, { isDiagnosis: false });
                  if (filterData.isDiagnosis) {
                     finalText = filterData.safeText || (finalText + "\n\n*(Note: Please consult a healthcare professional for a formal diagnosis.)*");
                  }
                }
              } catch (e) {
                 console.error("Guardrail check failed", e);
              }
            }
            
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: finalText,
                timestamp: new Date(),
              },
            ]);
            setStreamedText("");
            setIsTyping(false);
          })();
        },
        controller.signal,
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Chat error:", err);
        const errorContent =
          "I encountered a connection issue. Please try again.";
        setError(errorContent);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorContent,
            timestamp: new Date(),
          },
        ]);
      }
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
    "How is my cholesterol looking?",
    "Explain my latest lab results",
    "Are there any drug interactions?",
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAlAvailable ? 'bg-[var(--color-primary)] animate-pulse' : 'bg-red-500'}`} />
                    <span className="label-caps !text-[10px]">
                      {isAlAvailable ? 'Clinical Engine Active' : 'Neural Link Offline'}
                    </span>
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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 scroll-smooth">
                {messages.length === 0 && (
                  <div className="flex flex-col h-full justify-center space-y-8">
                    <div className="text-center space-y-2">
                      <Sparkles
                        className="w-12 h-12 text-[var(--color-primary)] mx-auto mb-4 opacity-80"
                        strokeWidth={1}
                      />
                      <p className="text-[1.125rem] font-medium">
                        How can I help you understand your health today?
                      </p>
                      <p className="text-sm text-muted px-4">
                        I can analyze your uploaded lab reports or answer
                        general medical questions.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(q)}
                          className="text-left px-4 py-3 rounded-[16px] bg-surface/50 hover:bg-surface border border-surface text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-surface/50 text-theme"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Streaming Response Overlay */}
                {streamedText && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed bg-surface/50 text-theme pb-8 relative">
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{streamedText}</ReactMarkdown>
                      </div>
                      <span className="absolute bottom-4 left-4 w-2 h-4 bg-[var(--color-primary)] animate-pulse" />
                    </div>
                  </div>
                )}

                {isTyping && !streamedText && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--color-surface)] rounded-2xl px-4 py-3 flex gap-1.5 items-center h-[52px]">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          delay: 0.2,
                        }}
                        className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          delay: 0.4,
                        }}
                        className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"
                      />
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80 text-[11px] font-medium tracking-wider uppercase text-[var(--color-text-muted)] transition-colors"
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
                        className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] whitespace-nowrap hover:border-teal-400/50 hover:text-teal-400 transition-colors duration-200"
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
                    placeholder={isAlAvailable ? "Ask Aura AI..." : "Neural Link Offline"}
                    disabled={isTyping || !isAlAvailable}
                    className={`w-full bg-[var(--color-surface)] border border-transparent rounded-full py-3.5 pl-5 pr-12 text-[15px] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${isTyping || !isAlAvailable ? "pointer-events-none opacity-50" : ""}`}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping || !isAlAvailable}
                    className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <ArrowUp size={18} strokeWidth={2.5} />
                  </button>
                </form>
                <div className="mt-2 text-center text-[10px] text-[var(--color-text-faint)]">
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
