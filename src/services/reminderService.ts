import { Appointment } from "../types/health";
import { HealthAlert } from "../types/alerts";
import { addDays, isBefore, startOfDay, endOfDay } from "date-fns";
import { db } from "../lib/firebase/config";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { LabReminder } from "../types/health";

export const checkAppointmentsForReminders = (
  appointments: Appointment[],
): HealthAlert[] => {
  const alerts: HealthAlert[] = [];
  const today = new Date();

  appointments.forEach((appt) => {
    const apptDate = new Date(appt.date);
    const threeDaysFromNow = addDays(today, 3);
    const oneDayFromNow = addDays(today, 1);

    // If appointment is tomorrow
    if (
      isBefore(apptDate, endOfDay(oneDayFromNow)) &&
      isBefore(startOfDay(oneDayFromNow), apptDate)
    ) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: "high",
        type: "appointment",
        title: `Upcoming Appointment Tomorrow`,
        description: `You have an appointment with ${appt.doctorName || "your doctor"} tomorrow at ${apptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    // If appointment is in 3 days
    else if (
      isBefore(apptDate, endOfDay(threeDaysFromNow)) &&
      isBefore(startOfDay(threeDaysFromNow), apptDate)
    ) {
      alerts.push({
        id: crypto.randomUUID(),
        severity: "moderate",
        type: "appointment",
        title: `Upcoming Appointment in 3 Days`,
        description: `Reminder: Appointment with ${appt.doctorName || "your doctor"} is coming up on ${apptDate.toLocaleDateString()}.`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  });

  return alerts;
};

export async function createReminder(userId: string, reminder: Omit<LabReminder, 'id' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'users', userId, 'reminders');
  const docRef = await addDoc(colRef, {
    ...reminder,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getUpcomingReminders(userId: string, daysAhead: number = 30): Promise<LabReminder[]> {
  const colRef = collection(db, 'users', userId, 'reminders');
  const q = query(colRef, where('status', '==', 'pending'));
  const snap = await getDocs(q);
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  const limitDateStr = targetDate.toISOString().split('T')[0];

  const reminders: LabReminder[] = [];
  snap.forEach(d => {
    const data = d.data() as LabReminder;
    if (data.dueDate <= limitDateStr) {
      reminders.push({ ...data, id: d.id });
    }
  });

  return reminders.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function updateReminderStatus(userId: string, reminderId: string, status: LabReminder['status'], snoozedUntil?: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'reminders', reminderId);
  const updates: any = { status };
  if (snoozedUntil !== undefined) {
    updates.snoozedUntil = snoozedUntil;
  }
  await updateDoc(docRef, updates);
}

export function generateRemindersFromAlerts(alerts: any[], existingReminders: LabReminder[]): Omit<LabReminder, 'id' | 'createdAt'>[] {
  const newReminders: Omit<LabReminder, 'id' | 'createdAt'>[] = [];
  const existingTests = existingReminders.map(r => r.testName.toLowerCase());

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 90);
  const dueDate = targetDate.toISOString().split('T')[0];

  for (const alert of alerts) {
    if (alert.severity === 'high' || alert.severity === 'critical') {
      // alert.title typically is like "Critical High Glucose" or "Elevated HbA1c"
      let testName = 'Biomarker';
      let flag = alert.severity === 'critical' ? 'CRITICAL' : 'HIGH';
      
      if (alert.title) {
        const parts = alert.title.split(' ');
        if (parts.length > 1) {
          testName = parts[parts.length - 1]; // last word is usually the biomarker
        }
        if (alert.title.toLowerCase().includes('low')) {
          flag = 'LOW';
        }
      }

      if (!existingTests.includes(testName.toLowerCase())) {
        newReminders.push({
          userId: '',
          testName,
          dueDate,
          reason: `${testName} was ${flag}. Your doctor may recommend rechecking in 90 days.`,
          status: 'pending',
          sourceReportId: null,
          snoozedUntil: null
        });
        existingTests.push(testName.toLowerCase());
      }
    }
  }

  return newReminders;
}
