import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { beforeUserCreated, HttpsError as AuthBlockingError } from "firebase-functions/v2/identity";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { hasForbiddenKeys, isPlainObject } from "./validation";

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
    const rawData = request.data as unknown;
    if (!isPlainObject(rawData) || hasForbiddenKeys(rawData)) {
      throw new HttpsError("invalid-argument", "Invalid or unsafe reCAPTCHA request payload.");
    }
    const token = rawData.token;

    if (!token || typeof token !== "string" || token.length > 4096) {
      throw new HttpsError("invalid-argument", "Missing or invalid reCAPTCHA validation token.");
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

  const userEmail = request.auth.token?.email?.normalize("NFKC").trim().toLowerCase();
  const isEmailVerified = request.auth.token?.email_verified === true;
  if (userEmail !== "dhurianiket@gmail.com" || !isEmailVerified) {
    throw new HttpsError(
      "permission-denied",
      "Only the verified primary account holder (dhurianiket@gmail.com) can invoke founder phone synchronization."
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


/**
 * OWASP A07:2025 Remediation - Auth Blocking Function
 * Prevents automated bots, disposable burner domains, and RFC 2606 scanner domains (.invalid, .test)
 * from registering spam accounts via Identity Toolkit REST APIs, while fully allowing
 * legitimate public email registrations (Gmail, Yahoo, Outlook, custom domains, etc.).
 */
export const beforeCreate = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) return {};

  // Check if sign-up uses email/password provider
  const hasPasswordProvider = user.providerData?.some((p) => p.providerId === "password");
  const isEmailOnly = (!user.providerData || user.providerData.length === 0) && !!user.email && !user.phoneNumber;

  if (hasPasswordProvider || isEmailOnly) {
    const rawEmail = (user.email || "").normalize("NFKC").trim().toLowerCase();
    const parts = rawEmail.split("@");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      console.warn(`[SecurityAudit] Blocked malformed email registration attempt: ${rawEmail}`);
      throw new AuthBlockingError("invalid-argument", "Invalid email address format.");
    }

    let domain: string;
    try {
      domain = new URL(`https://${parts[1]}`).hostname.toLowerCase();
    } catch {
      console.warn(`[SecurityAudit] Blocked malformed email domain: ${rawEmail}`);
      throw new AuthBlockingError("invalid-argument", "Invalid email address format.");
    }

    // 1. Block RFC 2606 and RFC 6761 reserved test/scanner domains (e.g. pentest-probe@test.invalid)
    const blockedTlds = [".invalid", ".test", ".example", ".localhost"];
    if (blockedTlds.some((tld) => domain.endsWith(tld) || domain === tld.slice(1))) {
      console.warn(`[SecurityAudit] Blocked automated scanner/test email: ${rawEmail}`);
      throw new AuthBlockingError(
        "invalid-argument",
        "Registration with test or invalid domain names is prohibited."
      );
    }

    // 2. Block known disposable/burner email domains
    const disposableDomains = new Set([
      "mailinator.com",
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
      "guerrillamail.net",
      "guerrillamail.org",
      "sharklasers.com",
      "yopmail.com",
      "throwawaymail.com",
      "trashmail.com",
      "getairmail.com",
      "dispostable.com",
      "temp-mail.org",
      "fakeinbox.com",
      "crazymailing.com",
      "generator.email",
    ]);

    if (disposableDomains.has(domain)) {
      console.warn(`[SecurityAudit] Blocked disposable email registration: ${rawEmail}`);
      throw new AuthBlockingError(
        "invalid-argument",
        "Disposable or temporary email addresses are not permitted. Please use a valid personal or medical email."
      );
    }
  }

  return {};
});

// Resend Email Dispatch Integration
export * from "./emailService";

export const sendClinicalEmail = onCall(
  { secrets: ["RESEND_API_KEY"] },
  async (request: CallableRequest<{
    to?: string;
    subject?: string;
    text?: string;
    html?: unknown;
  }>) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required to trigger clinical email dispatch.");
    }
    if (request.auth.token?.admin !== true) {
      throw new HttpsError("permission-denied", "Admin privileges required to trigger clinical email dispatch.");
    }

    const rawData = request.data as unknown;
    if (!isPlainObject(rawData) || hasForbiddenKeys(rawData)) {
      throw new HttpsError("invalid-argument", "Request payload must be a safe JSON object.");
    }

    const dataObj = rawData;
    if ("html" in dataObj && dataObj.html !== undefined) {
      throw new HttpsError("invalid-argument", "Raw HTML payloads are not permitted; pass plain 'text' instead.");
    }

    const to = typeof dataObj.to === "string" ? dataObj.to.trim() : "";
    const subject = typeof dataObj.subject === "string" ? dataObj.subject.trim() : "";
    const text = typeof dataObj.text === "string" ? dataObj.text.trim() : "";

    if (!to || to.length > 254 || /[\r\n]/.test(to) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new HttpsError("invalid-argument", "Invalid recipient email address.");
    }
    if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
      throw new HttpsError("invalid-argument", "Subject is required (max 200 single-line characters).");
    }
    if (!text || text.length > 10000) {
      throw new HttpsError("invalid-argument", "Plain text body is required (max 10000 characters).");
    }

    const { escapeHtml, renderEmailLayout, sendTransactionalEmail } = await import("./emailService");
    const safeHtml = renderEmailLayout({
      preheader: subject,
      title: subject,
      contentHtml: `<p style="white-space: pre-wrap;">${escapeHtml(text)}</p>`,
    });

    const result = await sendTransactionalEmail({ to, subject, html: safeHtml, text });
    if (!result.success) {
      throw new HttpsError("internal", result.error || "Failed to send email via Resend.");
    }

    return { success: true, emailId: result.id };
  }
);

export const notifyLogin = onCall(
  { secrets: ["RESEND_API_KEY"] },
  async (request: CallableRequest<{
    deviceType?: string;
    userAgent?: string;
  }>) => {
    if (!request.auth || !request.auth.token?.email) {
      throw new HttpsError("unauthenticated", "Authentication required to send login notification.");
    }

    const userEmail = request.auth.token.email;
    const displayName = request.auth.token.name || userEmail.split("@")[0];
    const rawNotify = (request.data ?? {}) as unknown;
    if (!isPlainObject(rawNotify) || hasForbiddenKeys(rawNotify)) {
      throw new HttpsError("invalid-argument", "Invalid or unsafe notification payload.");
    }
    const deviceType =
      typeof rawNotify.deviceType === "string" ? rawNotify.deviceType.slice(0, 64) : undefined;
    const userAgent =
      typeof rawNotify.userAgent === "string" ? rawNotify.userAgent.slice(0, 512) : undefined;

    const { sendLoginNotificationEmail } = await import("./emailService");
    const result = await sendLoginNotificationEmail({
      userEmail,
      displayName,
      deviceType,
      userAgent,
      authMethod: request.auth.token.firebase?.sign_in_provider || "Google Identity",
    });

    return { success: result.success, emailId: result.id };
  }
);
