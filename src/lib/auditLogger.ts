import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/config";

/**
 * Logs an audit event to Firestore.
 * This function is designed to be "fire and forget" and will never throw errors to the caller.
 */
export async function logAuditEvent(
  userId: string,
  action: string,
  resourceId: string,
): Promise<void> {
  try {
    const auditLogsRef = collection(db, "users", userId, "auditLogs");
    await addDoc(auditLogsRef, {
      action,
      resourceId,
      timestamp: serverTimestamp(),
      actor: userId,
    });
  } catch (error) {
    // Audit logging should never crash the application
    console.warn("[AuditLog] Failed to log event:", error);
  }
}
