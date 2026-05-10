import { Appointment } from "../types/health";
import { HealthAlert } from "../types/alerts";
import { addDays, isBefore, startOfDay, endOfDay } from "date-fns";

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
