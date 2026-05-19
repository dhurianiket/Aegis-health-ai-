export const getRecaptchaToken = async (action: string): Promise<string | null> => {
  try {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error("[RECAPTCHA]: VITE_RECAPTCHA_SITE_KEY is missing.");
      return null;
    }

    if (!window.grecaptcha) {
      console.error("[RECAPTCHA]: Library not initialized.");
      return null;
    }
    const token = await window.grecaptcha.execute(
      siteKey,
      { action }
    );
    return token;
  } catch (err) {
    console.error("[RECAPTCHA ERROR]:", err);
    return null;
  }
};
