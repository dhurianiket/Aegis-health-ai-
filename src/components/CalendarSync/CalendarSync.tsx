import React, { useEffect, useState } from "react";
import { getAccessToken, useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarCheck,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export default function CalendarSync() {
  const { user, signIn, logOut } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load token on mount & auth state change
  useEffect(() => {
    const activeToken = getAccessToken();
    if (activeToken) {
      setToken(activeToken);
    }
  }, [user]);

  // Fetch upcoming calendar events
  const fetchUpcomingEvents = async (accessToken: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const now = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=15&orderBy=startTime&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.status === 401) {
        throw new Error("unauthorized");
      }
      if (res.status === 403) {
        throw new Error("forbidden_scopes");
      }
      if (!res.ok) {
        throw new Error("failed_to_fetch");
      }

      const data = await res.json();
      setEvents(data.items || []);
    } catch (err: any) {
      console.error("[Calendar] Fetch events failed:", err);
      if (err.message === "unauthorized") {
        setErrorMsg("Your Google Auth session has expired. Please re-authenticate below to sync.");
        setToken(null);
      } else if (err.message === "forbidden_scopes") {
        setErrorMsg("Google Calendar permissions are required. Please re-authenticate and ensure the Calendar permission checkbox is selected.");
      } else {
        setErrorMsg("Failed to synchronize with your Google Calendar account. Verify connection attributes.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUpcomingEvents(token);
    }
  }, [token]);

  // Authenticate & acquire fresh permissions
  const handleAuth = async () => {
    try {
      await signIn();
      const activeToken = getAccessToken();
      if (activeToken) {
        setToken(activeToken);
        fetchUpcomingEvents(activeToken);
      }
    } catch (err) {
      console.error("[Calendar] Authentication initiation error:", err);
    }
  };

  // Add event helper
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title || !date || !time) return;

    // Explicit User Confirmation Dialog (MANDATORY under Workspace Guidelines)
    const confirmed = window.confirm(
      `Confirm Calendar Appointment addition:\n\nTitle: ${title}\nDate: ${date} at ${time}\nLocation: ${location || "N/A"}\n\nDo you authorize Aegis Health to append this event to your Google Calendar?`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${date}T${time}`).toISOString();
      const endDateTime = new Date(new Date(`${date}T${time}`).getTime() + 60 * 60 * 1000).toISOString(); // Default 1 hour

      const eventPayload = {
        summary: title,
        location: location,
        description: `Source: Aegis Health AI Clinical Portal\nNotes: ${notes}`,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        }
      );

      if (!res.ok) {
        throw new Error("Addition failed");
      }

      // Reset form on success
      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      setNotes("");
      setShowAddForm(false);
      
      // Refresh list
      fetchUpcomingEvents(token);
    } catch (err) {
      console.error("[Calendar] Failed to add event:", err);
      alert("Failed to insert event into Google Calendar. Check connection scopes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete event helper (MANDATORY User Confirmation)
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Confirm Event Removal:\n\nAre you sure you want to delete "${eventTitle}" from your Google Calendar? This action is permanent and cannot be undone.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Deletion failed");
      }

      // Refresh list
      fetchUpcomingEvents(token);
    } catch (err) {
      console.error("[Calendar] Failed to remove event:", err);
      alert("Failed to delete event from Google Calendar.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to highlight health events
  const isHealthEvent = (summary: string = "", desc: string = "") => {
    const text = (summary + " " + desc).toLowerCase();
    const keywords = ["doctor", "medic", "pharma", "clinical", "medication", "pill", "aegis", "checkup", "blood", "lab", "appointment", "routine"];
    return keywords.some(k => text.includes(k));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Context Card */}
      <div className="bg-surface backdrop-blur-xl border border-surface p-6 md:p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-xs">
              <Shield className="w-4 h-4 text-indigo-400" />
              Secure Encrypted Portal
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Google Calendar Synchronization
            </h3>
            <p className="text-muted text-sm max-w-2xl font-light leading-relaxed">
              Consolidate your healthcare routine. Schedule clinical sessions, doctor follow-ups, and daily medicine intakes directly to your Google Calendar.
            </p>
          </div>

          {!token ? (
            <button
              onClick={handleAuth}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white rounded-[16px] text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shadow-lg shadow-indigo-600/20 max-w-fit pointer-events-auto"
            >
              <CalendarCheck className="w-4 h-4" />
              Connect Google Calendar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synced to Account
              </span>
              <button
                onClick={() => fetchUpcomingEvents(token)}
                className="p-2 bg-black/10 hover:bg-black/20 text-faint hover:text-theme rounded-xl transition-all pointer-events-auto"
                title="Refresh Calendar Feed"
              >
                <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {!token ? (
        <div className="p-8 border border-dashed border-white/5 bg-black/10 rounded-[32px] text-center text-xs text-muted leading-relaxed max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-8 h-8 text-slate-300 opacity-25 mx-auto" />
          <p>
            You are currently signed out of Google Calendar synchronization. Authenticate with your clinical Google Account to see, add, and organize your medical care routines natively.
          </p>
          <button
            onClick={handleAuth}
            className="text-xs text-indigo-400 underline font-semibold hover:text-indigo-300 pointer-events-auto"
          >
            Authenticate now and accept Calendar permissions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar Event List (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Upcoming Medical & Routine Events
              </h4>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/10 text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-600 hover:text-white transition-all pointer-events-auto"
              >
                <Plus className="w-4 h-4" />
                {showAddForm ? "Close Form" : "Add Appt"}
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-3 text-xs text-red-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-xs text-muted flex flex-col items-center justify-center gap-2 bg-surface rounded-[28px] border border-surface">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                Loading Google Calendar events...
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted bg-surface rounded-[28px] border border-surface">
                No upcoming events detected. Schedule your next routine clinic appointment.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const startTime = event.start.dateTime || event.start.date || "";
                  const formattedTime = startTime
                    ? new Date(startTime).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "All Day";

                  const isHealth = isHealthEvent(event.summary, event.description);

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all relative ${
                        isHealth
                          ? "bg-indigo-500/5 border-indigo-500/25 shadow-sm shadow-indigo-500/5"
                          : "bg-surface border-surface"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                            {event.summary}
                          </h5>
                          {isHealth && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                              Health Appt
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {formattedTime}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1 max-w-[200px] truncate">
                              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                              {event.location}
                            </span>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-xs text-faint leading-relaxed font-light mt-1 max-w-xl">
                            {event.description.replace(/Source: Aegis Health AI Clinical Portal/i, "")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 md:pt-0">
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.summary)}
                          className="p-2 hover:bg-red-500/10 hover:text-red-400 text-faint rounded-xl transition-all pointer-events-auto"
                          title="Delete from Calendar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side Panel: Form (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-surface border border-surface rounded-[28px] p-6 shadow-xl space-y-4 overflow-hidden"
                >
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-indigo-500" />
                    New Healthcare Event
                  </h4>

                  <form onSubmit={handleAddEvent} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-widest font-bold text-muted">
                        Event Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Blood Sample Extraction"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full bg-[var(--color-bg)] text-theme border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-widest font-bold text-muted">
                          Date
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                          className="w-full bg-[var(--color-bg)] text-theme border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs uppercase tracking-widest font-bold text-muted">
                          Time
                        </label>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          required
                          className="w-full bg-[var(--color-bg)] text-theme border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-widest font-bold text-muted">
                        Location / Clinic
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Mount Sinai Diagnostics Dept"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-[var(--color-bg)] text-theme border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs uppercase tracking-widest font-bold text-muted">
                        Clinical Notes / Context
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Specify intake schedules, fasting directions, or clinical reminders..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-[var(--color-bg)] text-theme border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/10 pointer-events-auto"
                    >
                      {isSubmitting ? "Adding event..." : "Authorize & Create Event"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sync Tips Card */}
            <div className="bg-surface border border-surface rounded-[28px] p-5 space-y-3.5">
              <h5 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                Clinical Reminders Sync Tips
              </h5>
              <p className="text-xs text-muted font-light leading-relaxed">
                When you ingest physical lab PDF reports or receive follow-up notices via the Specialist Lounge AI chat, you can seamlessly add those specific medical triggers to your calendar.
              </p>
              <div className="text-xs text-faint flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                Data interactions follow strict sandbox limits.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
