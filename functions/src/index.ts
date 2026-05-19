import { onCall, HttpsError } from "firebase-functions/v2/https";

export const verifyRecaptchaToken = async (token: string, secretKey: string | undefined): Promise<boolean> => {
  if (!secretKey) {
    console.error("Missing RECAPTCHA_SECRET_KEY in environment variables.");
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    });

    const result = await response.json() as {
      success: boolean;
      score: number;
      action: string;
    };

    // Require an anti-bot risk score threshold >= 0.5
    return !!(result.success && result.score >= 0.5);
  } catch (error) {
    console.error("reCAPTCHA Verification Exception Error:", error);
    return false;
  }
};

// Cloud Function Entrypoint
export const verifyRecaptcha = onCall(
  { secrets: ["RECAPTCHA_SECRET_KEY"] },
  async (request) => {
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
