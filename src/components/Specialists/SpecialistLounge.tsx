import { createPortal } from "react-dom";
import { generateSourceHash, getCachedReport, saveCachedReport } from "../../services/cacheService";
import { lookupRelevantGuidelines } from "../../services/sourceGroundedService";
import { renderCitationLink } from "../Common/CitationBadge";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { SpecialistId } from "../../types/ai";
import { getSpecialist, SPECIALISTS } from "../../services/ai/specialists/specialistFactory";
import { getPatientContext, formatContextForPrompt } from "../../services/ai/contextService";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useClinicalContext } from "../../hooks/useClinicalContext";
import getAI from "../../lib/geminiClient";
import { getFriendlyErrorMessage } from "../../utils/aiUtils";
import { db } from "../../lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { saveActiveReferral, getActiveReferrals, updateReferralStatus } from "../../lib/firebase/firestore";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Stethoscope, Droplets, Zap, ShieldCheck, ChevronRight, ChevronDown, TrendingUp, AlertCircle, Clock, ExternalLink, Brain, Loader2, CheckCircle2, SlidersHorizontal, Info, Square, ArrowUp, ChevronLeft, Search, X } from "lucide-react";
import { parseSafeTimestamp } from "../../utils/dateUtils";
import VirtualizedChatList, { ChatMessage } from "../Chat/VirtualizedChatList";
import { triageMessage, buildEmergencyTranscript, type TriageResult } from "../../services/ai/safety/triage";
import { buildLoungeGeminiHistory, type LoungeMessage } from "../../services/ai/specialists/loungeHistory";
import { parseReferralSuggestions, stripReferralTags, type ReferralSuggestion } from "../../services/ai/specialists/referrals";
import {
  LOUNGE_PROMPT_VERSION,
  buildLoungeSystemInstruction,
  buildPatientDataBlock,
} from "../../services/ai/specialists/loungePrompt";
import {
  LOUNGE_EDGE_FEATURE,
  TRUNCATION_NOTE,
  buildLoungeGenerationConfig,
  getLoungeModel,
  isAbortError,
  resolveModelUsed,
} from "../../services/ai/specialists/loungeModelConfig";
import type { GeminiGenerateResponse } from "../../lib/geminiClient";
import EmergencyTriageCard from "./EmergencyTriageCard";
import { trackEvent } from "../../utils/analytics";

interface LoungeReferral {
  id?: string;
  fromAgent?: string;
  toSpecialist: string;
  reason: string;
  status: string;
}

interface PendingReferralSuggestion extends ReferralSuggestion {
  fromSpecialist: SpecialistId;
  status: "idle" | "saving" | "saved" | "error";
}

interface StoredChatMessage {
  role?: unknown;
  content?: unknown;
  text?: unknown;
  createdAt?: unknown;
  kind?: unknown;
}

function parseStoredMessages(raw: unknown): LoungeMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is StoredChatMessage => !!m && typeof m === "object")
    .map((m) => {
      const role: LoungeMessage["role"] = m.role === "user" ? "user" : "assistant";
      const content = String(m.content ?? m.text ?? "");
      const created = typeof m.createdAt === "string" || typeof m.createdAt === "number" ? new Date(m.createdAt) : new Date();
      const msg: LoungeMessage = {
        role,
        // Legacy replies may still contain raw [REFERRAL: …] tags — never display them.
        content: role === "assistant" ? stripReferralTags(content) : content,
        timestamp: Number.isNaN(created.getTime()) ? new Date() : created,
      };
      if (m.kind === "triage") msg.kind = "triage";
      return msg;
    });
}

/**
 * Real-time text highlight component.
 * Escapes regex special characters and safely wraps matching query substrings in high-contrast <mark> tags.
 */
export function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) {
    return <>{text}</>;
  }

  const trimmedQuery = query.trim();
  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark
            key={i}
            data-testid="search-highlight"
            className="bg-amber-300/40 dark:bg-amber-400/35 text-amber-950 dark:text-amber-200 font-bold px-0.5 rounded shadow-sm"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export default function SpecialistLounge() {
  const [activeSpecialist, setActiveSpecialist] = useState<SpecialistId>('cardiologist');
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { supplementaryContext } = useClinicalContext();
  const [activeReferrals, setActiveReferrals] = useState<LoungeReferral[]>([]);
  const [referralSuggestions, setReferralSuggestions] = useState<PendingReferralSuggestion[]>([]);

  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [emergencyTriage, setEmergencyTriage] = useState<TriageResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user?.uid || !activeProfile?.id) return;
    getActiveReferrals(user.uid, activeProfile.id)
      .then((refs) => setActiveReferrals((refs ?? []) as LoungeReferral[]))
      .catch(console.error);
  }, [user?.uid, activeProfile?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedText, emergencyTriage]);

  const [initialLoading, setInitialLoading] = useState(false);

  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // When specialist changes, clear chat and load from firestore
  useEffect(() => {
    setMessages([]);
    setStreamedText("");
    setIsTyping(false);
    setEmergencyTriage(null);
    setReferralSuggestions([]);
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
          setMessages(parseStoredMessages(data?.messages));
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchChat();
  }, [activeSpecialist, user?.uid, activeProfile?.id]);

  // Stop: cancels the in-flight edge request (AbortController → fetch) and
  // resets the UI. The aborted reply is never displayed or saved.
  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    setStreamedText("");
  };

  const SPECIALIST_TABS = Object.values(SPECIALISTS);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const CATEGORIES = useMemo(() => {
    const unique = Array.from(new Set(SPECIALIST_TABS.map((s) => s.specialty)));
    return ["All", ...unique];
  }, [SPECIALIST_TABS]);

  const filteredSpecialists = useMemo(() => {
    return SPECIALIST_TABS.filter((s) => {
      // Category filter
      if (selectedCategory !== "All" && s.specialty !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (s.name.toLowerCase().includes(q)) return true;
        if (s.displayName.toLowerCase().includes(q)) return true;
        if (s.specialty.toLowerCase().includes(q)) return true;
        if (s.description.toLowerCase().includes(q)) return true;
        for (let i = 0; i < s.expertise.length; i++) {
          if (s.expertise[i].toLowerCase().includes(q)) return true;
        }
        for (let i = 0; i < s.guidelines.length; i++) {
          if (s.guidelines[i].toLowerCase().includes(q)) return true;
        }
        return false;
      }
      return true;
    });
  }, [SPECIALIST_TABS, selectedCategory, searchQuery]);

  const saveChatHistory = async (newMessages: LoungeMessage[]) => {
    if (!user?.uid || !activeProfile?.id) return;
    try {
      const chatRef = doc(db, "users", user.uid, "profiles", activeProfile.id, "specialistChats", activeSpecialist);
      const serializableMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.timestamp.toISOString(),
        // Firestore rejects `undefined` values, so only persist the flag when set.
        ...(m.kind ? { kind: m.kind } : {}),
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

    const userMsg: LoungeMessage = { role: "user", content: text, timestamp: new Date() };
    const newMsgs = [...messages, userMsg];
    setInputValue("");
    setStreamedText("");
    setReferralSuggestions([]);

    // Deterministic red-flag / crisis pre-check. On a match the message is
    // NEVER sent to Gemini; a fixed bilingual emergency card is shown instead.
    // Both turns are flagged `kind: "triage"` so they are never replayed to
    // the model as history either.
    const triage = triageMessage(text);
    if (triage.isEmergency) {
      setEmergencyTriage(triage);
      const flaggedUser: LoungeMessage = { ...userMsg, kind: "triage" };
      const safetyMsg: LoungeMessage = { role: "assistant", content: buildEmergencyTranscript(triage), timestamp: new Date(), kind: "triage" };
      const withSafety = [...messages, flaggedUser, safetyMsg];
      setMessages(withSafety);
      saveChatHistory(withSafety);
      // Category only — never the message text.
      trackEvent("lounge_emergency_triage", "safety", triage.primary ?? "unknown");
      return;
    }
    setEmergencyTriage(null);
    setMessages(newMsgs);
    saveChatHistory(newMsgs);
    setIsTyping(true);

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
      // Name withheld: the model does not need it (data minimisation).
      const context = formatContextForPrompt(patientData, { includeName: false });
      if (controller.signal.aborted) return;

      const specialist = getSpecialist(activeSpecialist);

      // Guideline lookup is keyword-based over static, trusted summaries.
      const relevantGuidelines = lookupRelevantGuidelines(`${text} ${context}`, activeSpecialist);

      // Check if there is an active pending referral targeting this guide
      const incomingReferral = activeReferrals.find(
        (r) => r.toSpecialist === activeSpecialist && r.status === "pending"
      );

      // Trusted, static instructions only — no record data in here.
      const systemPrompt = buildLoungeSystemInstruction({
        specialistId: activeSpecialist,
        isSummaryRequest,
        guidelines: relevantGuidelines,
      });

      // Untrusted record data travels as a delimited user-role part.
      const patientDataBlock = buildPatientDataBlock({
        patientContext: context,
        supplementaryContext,
        incomingReferral: incomingReferral ? { fromAgent: incomingReferral.fromAgent, reason: incomingReferral.reason } : null,
      });

      // Triage turns (crisis message + fixed card) are never sent to Gemini.
      const historyItems = buildLoungeGeminiHistory(messages);

      // Check Cache for Specialist Summaries
      let sourceHashForCache = "";
      if (isSummaryRequest && historyItems.length === 0) {
        sourceHashForCache = await generateSourceHash(systemPrompt + patientDataBlock + text);
        const cached = await getCachedReport(user.uid, activeProfile.id || "Myself", `SpecialistSummary_${activeSpecialist}`, sourceHashForCache, LOUNGE_PROMPT_VERSION, false);
        if (controller.signal.aborted) return;
        if (cached) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: stripReferralTags(cached), timestamp: new Date() }
          ]);
          setIsTyping(false);
          setStreamedText("");
          return;
        }
      }

      const turnInput = { message: text, contextParts: [patientDataBlock] };

      // Pinned stable model; geminiClient handles fallback and reports the model actually used.
      const requestedModel = getLoungeModel(isSummaryRequest);
      const chat = ai.chats.create({
        model: requestedModel,
        history: historyItems,
        config: buildLoungeGenerationConfig(systemPrompt, isSummaryRequest),
        signal: controller.signal,
        feature: LOUNGE_EDGE_FEATURE,
      });

      const stream = await chat.sendMessageStream(turnInput);

      let finalText = "";
      let lastChunk: GeminiGenerateResponse | undefined;
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        lastChunk = chunk;
        const chunkText = chunk.text || "";
        finalText += chunkText;
        // Never show raw referral tags, even mid-stream.
        setStreamedText(stripReferralTags(finalText));
      }

      // Aborted (Stop pressed or guide switched): discard silently, save nothing.
      if (controller.signal.aborted) return;

      const truncated = lastChunk?.finishReason === "MAX_TOKENS";
      if (finalText.trim().length === 0 && truncated) {
        finalText = "Sorry, I couldn't finish that answer within the length limit. Please try asking a shorter or more specific question.";
      }

      if (finalText.length > 0) {
        // Referral tags are parsed into suggestions only; nothing is saved
        // until the user taps "Save suggestion".
        const parsed = parseReferralSuggestions(finalText, activeSpecialist);
        const cleanText = truncated && parsed.cleanText ? parsed.cleanText + TRUNCATION_NOTE : parsed.cleanText;
        const { suggestions } = parsed;
        const modelUsed = resolveModelUsed(lastChunk, requestedModel);
        const assistantMsg: LoungeMessage = { role: "assistant", content: cleanText, timestamp: new Date() };
        const finalMsgs = [...newMsgs, assistantMsg];
        setMessages(finalMsgs);
        saveChatHistory(finalMsgs);
        setStreamedText("");
        setReferralSuggestions(
          suggestions.map((sug) => ({ ...sug, fromSpecialist: activeSpecialist, status: "idle" as const }))
        );

        // Mark incoming referral as reviewed
        if (incomingReferral && incomingReferral.id) {
          const reviewedId = incomingReferral.id;
          updateReferralStatus(user.uid, activeProfile.id, reviewedId, "reviewed").catch(console.error);
          setActiveReferrals((prev) =>
            prev.map((r) => (r.id === reviewedId ? { ...r, status: "reviewed" } : r))
          );
        }
        
        // Never cache a truncated summary.
        if (isSummaryRequest && historyItems.length === 0 && sourceHashForCache && !truncated) {
          await saveCachedReport(user.uid, {
            patientId: activeProfile.id || "Myself",
            reportType: `SpecialistSummary_${activeSpecialist}`,
            sourceHash: sourceHashForCache,
            content: cleanText,
            // Record the model that actually answered (after any fallback).
            modelUsed,
            promptVersion: LOUNGE_PROMPT_VERSION,
            status: "success"
          });
        }
      }
    } catch (err: unknown) {
      if (!isAbortError(err) && !controller.signal.aborted) {
        console.error("Specialist chat error:", err);
        const friendlyMsg = getFriendlyErrorMessage(err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: friendlyMsg, timestamp: new Date() }
        ]);
      }
    } finally {
      // Only the latest request may reset the typing state (an aborted older
      // request must not clobber a newer one).
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsTyping(false);
      }
    }
  };

  const handleSaveReferralSuggestion = async (index: number) => {
    const suggestion = referralSuggestions[index];
    if (!user?.uid || !activeProfile?.id || !suggestion || suggestion.status === "saving" || suggestion.status === "saved") return;
    const fromAgent = getSpecialist(suggestion.fromSpecialist).displayName;
    setReferralSuggestions((prev) => prev.map((r, i) => (i === index ? { ...r, status: "saving" } : r)));
    try {
      const id = await saveActiveReferral(user.uid, activeProfile.id, {
        fromAgent,
        toSpecialist: suggestion.toSpecialist,
        reason: suggestion.reason,
      });
      setReferralSuggestions((prev) => prev.map((r, i) => (i === index ? { ...r, status: id ? "saved" : "error" } : r)));
      if (id) {
        setActiveReferrals((prev) => [
          ...prev,
          { id, fromAgent, toSpecialist: suggestion.toSpecialist, reason: suggestion.reason, status: "pending" },
        ]);
      }
    } catch (err) {
      console.error("Failed to save referral suggestion", err);
      setReferralSuggestions((prev) => prev.map((r, i) => (i === index ? { ...r, status: "error" } : r)));
    }
  };

  const handleDismissReferralSuggestion = (index: number) => {
    setReferralSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDismissReferral = async (referralId: string) => {
    if (!user?.uid || !activeProfile?.id) return;
    await updateReferralStatus(user.uid, activeProfile.id, referralId, "dismissed");
    setActiveReferrals((prev) => prev.filter((r) => r.id !== referralId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const activeSpecProfile = getSpecialist(activeSpecialist);
  const currentReferral = activeReferrals.find(
    (r) => r.toSpecialist === activeSpecialist && r.status === "pending"
  );

  const chatAreaContent = (
    <>
      <div className="p-4 pt-[max(env(safe-area-inset-top),16px)] lg:pt-4 lg:p-6 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] flex items-center gap-4 shrink-0 transition-colors z-10">
        <button 
          aria-label="Back to guides"
          className="lg:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-slate-100 transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          onClick={() => setIsMobileChatOpen(false)}
        >
          <ChevronLeft className="w-6 h-6 shrink-0" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-base md:text-lg tracking-tight truncate">{activeSpecProfile.displayName}</div>
          <div className="text-[13px] text-slate-800 dark:text-slate-200 truncate font-semibold">AI health information guide · not a doctor · References: {activeSpecProfile.guidelines.join(', ')}</div>
        </div>
        <div className="shrink-0">
           <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1C1C1E] flex items-center justify-center">
             <Brain className="w-5 h-5 text-slate-600 dark:text-slate-300" />
           </div>
        </div>
      </div>

      {currentReferral && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">
              <strong>Suggested by {currentReferral.fromAgent || "another AI guide"}:</strong> {currentReferral.reason}
            </span>
          </div>
          <button
            onClick={() => { if (currentReferral.id) handleDismissReferral(currentReferral.id); }}
            className="underline hover:opacity-80 font-medium ml-3 shrink-0 text-amber-800 dark:text-amber-200"
          >
            Acknowledge
          </button>
        </div>
      )}
      
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
             <p className="text-[15px] text-slate-800 dark:text-slate-200 text-center font-semibold leading-relaxed max-w-sm">
               Ask the {activeSpecProfile.displayName} to explain your reports and help you prepare questions for your doctor.
             </p>
             <div className="flex gap-2 w-full max-w-[280px]">
                <button 
                  onClick={() => handleSendMessage(`Summarize my labs related to ${activeSpecProfile.specialty.toLowerCase()}`)} 
                  className="w-full bg-slate-900 border border-slate-900/10 dark:bg-[#1C1C1E] dark:border-[#2C2C2E] text-white hover:opacity-90 text-[15px] font-semibold px-4 py-3.5 rounded-[20px] transition-all active:scale-[0.98] shadow-sm"
                >
                  Summarize my labs
                </button>
             </div>
          </div>
        ) : (
          <div className="flex-1 w-full relative min-h-[450px] h-full flex flex-col">
            <VirtualizedChatList 
              messages={messages.map((m, i) => ({ id: String(i), role: m.role, text: m.content || "" }))} 
            />
          </div>
        )}
        
        {emergencyTriage && <EmergencyTriageCard result={emergencyTriage} />}

        {referralSuggestions.length > 0 && (
          <div data-testid="referral-suggestions" className="flex flex-col gap-2 pr-12">
            {referralSuggestions.map((sug, i) => {
              const target = SPECIALISTS[sug.toSpecialist];
              return (
                <div
                  key={`${sug.toSpecialist}-${i}`}
                  data-testid="referral-suggestion-chip"
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-[13px] text-slate-800 dark:text-slate-100"
                >
                  <span className="flex-1 min-w-0">
                    <strong>Suggested: talk to the {target.displayName}</strong>
                    <span className="block text-[12px] text-slate-600 dark:text-slate-300">{sug.reason}</span>
                  </span>
                  {sug.status === "saved" ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Saved
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveReferralSuggestion(i)}
                        disabled={sug.status === "saving"}
                        className="rounded-full bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {sug.status === "error" ? "Retry save" : "Save suggestion"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissReferralSuggestion(i)}
                        className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 hover:underline"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {streamedText && (
          <div className="flex justify-start pr-12 pb-2">
            <div className="max-w-[100%] rounded-[24px] rounded-bl-[8px] px-5 py-4 text-[16px] leading-[1.6] bg-slate-50 dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 relative pb-8 shadow-sm border border-slate-200 dark:border-[#2C2C2E]">
              <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-[1.6] prose-li:my-1 prose-headings:mb-4 prose-headings:mt-8 first:prose-headings:mt-0 font-medium marker:text-slate-300 dark:marker:text-slate-400 max-w-none">
                <ReactMarkdown components={{ a: renderCitationLink }}>{streamedText}</ReactMarkdown>
              </div>
              <span className="absolute bottom-5 left-6 w-2 h-2 bg-slate-500 dark:bg-slate-400 animate-pulse rounded-full" />
            </div>
          </div>
        )}
        
        {isTyping && !streamedText && (
          <div className="flex justify-start pr-12 pb-2">
             <div className="bg-slate-50 dark:bg-[#1C1C1E] rounded-[24px] rounded-bl-[8px] px-5 py-4 flex items-center gap-3 shadow-sm border border-slate-200 dark:border-[#2C2C2E]">
                <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-300 animate-spin" />
                <span className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 animate-pulse">Analyzing record...</span>
             </div>
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-6 lg:p-6 pb-[max(env(safe-area-inset-bottom),16px)] lg:pb-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] shrink-0 transition-colors z-10 w-full">
        {isTyping && (
          <div className="flex justify-center mb-3">
            <button
              onClick={handleAbort}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#1C1C1E] hover:bg-slate-200 dark:hover:bg-[#2C2C2E] text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 transition-colors active:scale-95"
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
            aria-label={`Message ${activeSpecProfile.displayName}`}
            className="w-full bg-slate-100 dark:bg-[#1C1C1E] border border-slate-300 dark:border-[#3C3C3E] rounded-full py-4 pl-6 pr-14 text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 dark:focus-visible:ring-white/20 transition-all disabled:opacity-50 shadow-sm"
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
          AI health information, not medical advice. Consult a registered medical practitioner. Emergency: call 112.
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
            Health Guides (AI)
          </h2>
          <p className="text-[var(--color-text-muted)] text-xs md:text-sm font-light">
            AI health information guides: understand your reports and prepare questions for your doctor. Not a doctor; does not diagnose or prescribe.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-[600px] lg:h-[max(calc(100vh-200px),600px)]">
        {/* Sidebar */}
        <div className={`lg:col-span-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-4 md:p-6 overflow-y-auto hidden-scrollbar block lg:block flex flex-col`}>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Select a Guide</h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {filteredSpecialists.length} available
            </span>
          </div>

          {/* Search Field */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, topics, symptoms..."
              aria-label="Search specialists"
              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 dark:focus-visible:ring-white/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pill-Style Category Filter */}
          <div
            role="tablist"
            aria-label="Specialist Categories"
            className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none no-scrollbar -mx-1 px-1"
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 select-none ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Specialist Cards List */}
          <div role="list" className="flex flex-col gap-2 flex-1">
            {filteredSpecialists.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-3 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/10 my-auto">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center mx-auto text-slate-500 dark:text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No guides match your criteria
                  </p>
                  {searchQuery && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] mx-auto">
                      Query: &ldquo;{searchQuery}&rdquo;
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-block pt-1"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredSpecialists.map((s) => {
                const q = searchQuery.toLowerCase().trim();
                const matchingExpertise = q
                  ? s.expertise.filter((e) => e.toLowerCase().includes(q))
                  : [];
                const displayedExpertise = matchingExpertise.length > 0
                  ? [matchingExpertise[0], ...s.expertise.filter((e) => e !== matchingExpertise[0])].slice(0, 2)
                  : s.expertise.slice(0, 2);

                return (
                  <div key={s.id} role="listitem" className="w-full">
                    <button
                      type="button"
                      aria-pressed={activeSpecialist === s.id}
                      onClick={() => { setActiveSpecialist(s.id); setIsMobileChatOpen(true); }}
                      className={`cursor-pointer w-full p-4 md:p-5 rounded-[24px] flex flex-col items-start gap-1 transition-all duration-300 relative overflow-hidden text-left ${
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
                          <div className="flex items-center justify-between w-full gap-1">
                            <div className={`font-semibold text-[15px] tracking-tight truncate ${activeSpecialist === s.id ? 'text-white' : 'text-[var(--color-text)] dark:text-slate-100'}`}>
                              <HighlightMatch text={s.displayName} query={searchQuery} />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                activeSpecialist === s.id 
                                  ? 'bg-white/15 text-white' 
                                  : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                              }`}>
                                <HighlightMatch text={s.specialty} query={searchQuery} />
                              </span>
                              {activeReferrals.some((r) => r.toSpecialist === s.id && r.status === "pending") && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                                  Referral
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`text-[12px] font-medium truncate mt-0.5 ${activeSpecialist === s.id ? 'text-slate-200' : 'text-[var(--color-text-muted)] dark:text-slate-300'}`}>
                            <HighlightMatch text={displayedExpertise.join(' • ')} query={searchQuery} />
                            {displayedExpertise.length < s.expertise.length && "..."}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })
            )}
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
