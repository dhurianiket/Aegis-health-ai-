import React, { useEffect, useState } from 'react';
import { LabReminder } from '../../types/health';
import { getUpcomingReminders, updateReminderStatus } from '../../services/reminderService';
import { CalendarClock, Check, Clock } from 'lucide-react';
import { differenceInDays, isBefore, startOfDay, addDays } from 'date-fns';

interface RemindersWidgetProps {
  userId: string;
}

export default function RemindersWidget({ userId }: RemindersWidgetProps) {
  const [reminders, setReminders] = useState<LabReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const data = await getUpcomingReminders(userId, 60);
      setReminders(data);
    } catch (e) {
      console.error("Failed to load reminders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [userId]);

  const handleComplete = async (id: string) => {
    await updateReminderStatus(userId, id, 'completed');
    fetchReminders();
  };

  const handleSnooze = async (id: string) => {
    const snoozedUntil = addDays(new Date(), 14).toISOString();
    await updateReminderStatus(userId, id, 'snoozed', snoozedUntil);
    fetchReminders();
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm animate-pulse">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Lab Reminders</h3>
        <div className="space-y-4">
          <div className="h-16 bg-[var(--color-border)] rounded-xl"></div>
          <div className="h-16 bg-[var(--color-border)] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-surface border border-border text-center text-sm text-muted">No upcoming lab reminders. Upload a new lab report to generate follow-ups.</div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-5 h-5 text-[var(--color-primary)]" />
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Lab Reminders</h3>
      </div>
      
      <div className="space-y-3">
        {reminders.map((reminder) => {
          const due = new Date(reminder.dueDate);
          const today = startOfDay(new Date());
          const daysDiff = differenceInDays(due, today);
          
          let alertStateStr = "Due today";
          let borderClass = "border-l-amber-500 bg-amber-50/10"; // Using standard amber
          
          if (daysDiff < 0) {
            alertStateStr = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`;
            borderClass = "border-l-amber-500 bg-amber-50/10";
          } else if (daysDiff === 0) {
            alertStateStr = "Due today";
            borderClass = "border-l-indigo-500 bg-indigo-50/10";
          } else if (daysDiff <= 7) {
            alertStateStr = `Due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;
            borderClass = "border-l-indigo-500 bg-indigo-50/10";
          } else {
            alertStateStr = `Due in ${daysDiff} days`;
            borderClass = "border-l-slate-400 bg-slate-50/5";
          }

          return (
            <div key={reminder.id} className={`p-4 rounded-xl border border-[var(--color-border)] border-l-4 ${borderClass} transition-all hover:bg-[var(--color-bg)]`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-[var(--color-text)]">{reminder.testName}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                      {alertStateStr}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {reminder.reason}
                  </p>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleSnooze(reminder.id)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    title="Snooze for 14 days"
                    aria-label="Snooze reminder for 14 days"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleComplete(reminder.id)}
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    title="Mark as completed"
                    aria-label="Mark reminder as completed"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
