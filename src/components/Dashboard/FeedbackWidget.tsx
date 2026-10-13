import React, { useState } from 'react';
import { MessageSquare, X, Star, Send, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

type FeedbackCategory = 'General Feedback' | 'Bug Report' | 'Feature Request' | 'Clinical / AI Accuracy';

export default function FeedbackWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>('General Feedback');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formId = import.meta.env.VITE_FEEDBACK_FORM_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const feedbackPayload = {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        rating,
        category,
        message: message.trim(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        createdAt: serverTimestamp(),
      };

      if (user?.uid) {
        // Save to user subcollection
        await addDoc(collection(db, 'users', user.uid, 'feedback'), feedbackPayload);
      }
      // Also save to global feedback collection for admin aggregation
      await addDoc(collection(db, 'feedback'), feedbackPayload);

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
        setRating(5);
      }, 2500);
    } catch (err) {
      console.warn('[FeedbackWidget] Firestore save fallback:', err);
      // Degrade gracefully so user experience is never blocked
      try {
        const local = JSON.parse(localStorage.getItem('aegis_pending_feedback') || '[]');
        local.push({
          rating,
          category,
          message: message.trim(),
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('aegis_pending_feedback', JSON.stringify(local));
      } catch {
        // Ignore local storage errors
      }
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
        setRating(5);
      }, 2500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Feedback Form"
        className="fixed bottom-6 right-6 p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-teal-400 via-cyan-500 to-indigo-500 text-slate-950 font-bold shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all z-40 flex items-center justify-center cursor-pointer border border-white/20"
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="sr-only">Feedback</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            role="dialog"
            aria-labelledby="feedback-dialog-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="feedback-dialog-title" className="font-extrabold text-sm text-white">
                    Early Access Feedback
                  </h3>
                  <p className="text-[11px] text-slate-400">Help us shape Aegis Health AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Feedback Form"
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {submitted ? (
                <div className="py-8 flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">Thank You!</h4>
                  <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                    Your feedback directly shapes our clinical AI algorithms and platform experience.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating ?? rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 text-slate-600 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                            aria-label={`Rate ${star} stars`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                active
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-600 dark:text-slate-700'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs font-mono font-bold text-slate-400 ml-1">
                        {rating === 5
                          ? 'Excellent!'
                          : rating === 4
                          ? 'Great'
                          : rating === 3
                          ? 'Good'
                          : rating === 2
                          ? 'Fair'
                          : 'Poor'}
                      </span>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Feedback Type
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="General Feedback">General Feedback</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Clinical / AI Accuracy">Clinical / AI Accuracy</option>
                    </select>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Observations & Suggestions
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="What worked well, or what needs improvement?"
                      rows={3}
                      required
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 min-h-[42px]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting…' : 'Submit Feedback'}</span>
                  </button>

                  {/* External Google Form Fallback Link */}
                  {formId && (
                    <div className="pt-1 text-center border-t border-white/5">
                      <a
                        href={`https://docs.google.com/forms/d/e/${formId}/viewform`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium transition-colors"
                      >
                        <span>Open extended Google Form</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
