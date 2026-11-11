import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase/config";

/**
 * Dispatches an automated, non-blocking branded security notice to the user's
 * registered email when a new session is established.
 */
export async function sendLoginSecurityAlert(): Promise<boolean> {
  try {
    const notifyLoginFn = httpsCallable<
      { deviceType?: string; userAgent?: string },
      { success: boolean; emailId?: string }
    >(functions, "notifyLogin");

    const deviceType = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
      ? "Mobile Device"
      : "Desktop Workstation";

    const response = await notifyLoginFn({
      deviceType,
      userAgent: navigator.userAgent,
    });

    return response.data?.success ?? false;
  } catch (err) {
    // Non-blocking fail-safe: never disrupt user session or throw uncaught exceptions
    if (import.meta.env.DEV) {
      console.warn("[EmailNotificationService] Failed to send login notice (graceful fallback):", err);
    }
    return false;
  }
}
