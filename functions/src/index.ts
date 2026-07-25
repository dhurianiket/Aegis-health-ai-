import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";

initializeApp();

// Export secondary autonomous orchestrator integrations
export { handleGitHubWebhook } from "./julesWebhook";
export { PaperclipJulesCoordinator } from "./paperclipJulesCoordinator";

export const verifyRecaptchaToken = async (token: string, secretKey: string | undefined): Promise<boolean> => {
  if (!secretKey) {
    console.error("Missing RECAPTCHA_SECRET_KEY in environment variables.");
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secretKey || "")}&response=${encodeURIComponent(token || "")}`,
    });

    const result = await response.json() as {
      success: boolean;
      score: number;
      action: string;
      "error-codes"?: string[];
    };

    console.log("reCAPTCHA raw response:", JSON.stringify(result));

    // Require an anti-bot risk score threshold >= 0.5
    if (result.success && result.score >= 0.5) {
      return true;
    } else {
      console.log(`reCAPTCHA validation failed. Success: ${result.success}, Score: ${result.score}, Token: ${token}`);
      return false;
    }
  } catch (error) {
    console.error("reCAPTCHA Verification Exception Error:", error);
    return false;
  }
};

// Cloud Function Entrypoint
export const verifyRecaptcha = onCall(
  { secrets: ["RECAPTCHA_SECRET_KEY"] },
  async (request: any) => {
    const token = request.data?.token;

    if (!token) {
      throw new HttpsError("invalid-argument", "Missing reCAPTCHA validation token.");
    }

    const isHuman = await verifyRecaptchaToken(token, process.env.RECAPTCHA_SECRET_KEY);

    if (!isHuman) {
      throw new HttpsError("permission-denied", "Automated traffic/bot verification failed.");
    }

    return { verified: true };
  }
);
