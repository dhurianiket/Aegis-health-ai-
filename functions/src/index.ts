import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp();

// Export secondary autonomous orchestrator integrations
export { handleGitHubWebhook } from "./julesWebhook";
export { PaperclipJulesCoordinator } from "./paperclipJulesCoordinator";

interface RecaptchaSiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

interface VerifyRecaptchaRequestData {
  token?: string;
}

/** Redact secrets/tokens for logs — never echo full reCAPTCHA tokens. */
export function redactToken(token: string): string {
  if (!token) return "[empty]";
  if (token.length <= 10) return "[redacted]";
  return `${token.slice(0, 4)}…${token.slice(-4)} (len=${token.length})`;
}

export const verifyRecaptchaToken = async (
  token: string,
  secretKey: string | undefined,
): Promise<boolean> => {
  if (!secretKey) {
    console.error("Missing RECAPTCHA_SECRET_KEY in environment variables.");
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      // Security: use encodeURIComponent to prevent HTTP Parameter Pollution (HPP) via the token parameter
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    const result = (await response.json()) as RecaptchaSiteVerifyResponse;

    console.log(
      "reCAPTCHA siteverify:",
      JSON.stringify({
        success: result.success,
        score: result.score,
        action: result.action,
        errorCodes: result["error-codes"] ?? [],
        token: redactToken(token),
      }),
    );

    // Require an anti-bot risk score threshold >= 0.5
    if (result.success && (result.score ?? 0) >= 0.5) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("reCAPTCHA Verification Exception Error:", error);
    return false;
  }
};

// Cloud Function Entrypoint
export const verifyRecaptcha = onCall(
  { secrets: ["RECAPTCHA_SECRET_KEY"] },
  async (request: CallableRequest<VerifyRecaptchaRequestData>) => {
    const token = request.data?.token;

    if (!token || typeof token !== "string") {
      throw new HttpsError("invalid-argument", "Missing reCAPTCHA validation token.");
    }

    const isHuman = await verifyRecaptchaToken(token, process.env.RECAPTCHA_SECRET_KEY);

    if (!isHuman) {
      throw new HttpsError("permission-denied", "Automated traffic/bot verification failed.");
    }

    return { verified: true as const };
  },
);


/**
 * Cloud Function to bind the founder's verified mobile phone number (+91 99693 30257)
 * to dhurianiket@gmail.com, handling orphan UID reclamation if phone OTP was previously tested.
 */
export const linkFounderPhoneNumber = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required to link phone number.");
  }

  const userEmail = request.auth.token?.email?.toLowerCase();
  if (userEmail !== "dhurianiket@gmail.com") {
    throw new HttpsError(
      "permission-denied",
      "Only the primary account holder (dhurianiket@gmail.com) can invoke founder phone synchronization."
    );
  }

  const founderUid = request.auth.uid;
  const founderPhone = "+919969330257";
  const authAdmin = getAuth();

  try {
    // 1. Check if the phone number is already registered under an orphaned UID
    let existingPhoneUser = null;
    try {
      existingPhoneUser = await authAdmin.getUserByPhoneNumber(founderPhone);
    } catch (err: any) {
      if (err.code !== "auth/user-not-found") {
        throw err;
      }
    }

    if (existingPhoneUser && existingPhoneUser.uid !== founderUid) {
      console.log(
        `[AccountLinking] Reclaiming founder phone ${founderPhone} from orphaned UID: ${existingPhoneUser.uid}`
      );
      await authAdmin.deleteUser(existingPhoneUser.uid);
    }

    // 2. Attach phone number directly to founder UID
    await authAdmin.updateUser(founderUid, {
      phoneNumber: founderPhone,
    });

    console.log(`[AccountLinking] Successfully linked ${founderPhone} to UID ${founderUid} (${userEmail})`);
    return {
      success: true,
      phoneNumber: founderPhone,
      email: userEmail,
      message: `Phone number ${founderPhone} successfully linked to ${userEmail}.`,
    };
  } catch (error: any) {
    console.error("[AccountLinking] Failed to link founder phone number:", error);
    throw new HttpsError("internal", error.message || "Failed to link founder phone number.");
  }
});
