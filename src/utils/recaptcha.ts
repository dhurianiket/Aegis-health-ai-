export const getRecaptchaToken = async (action: string): Promise<string | null> => {
  try {
    if (!window.grecaptcha) {
      console.error("[RECAPTCHA]: Library not initialized.");
      return null;
    }
    const token = await window.grecaptcha.execute(
      import.meta.env.VITE_RECAPTCHA_SITE_KEY,
      { action }
    );
    return token;
  } catch (err) {
    console.error("[RECAPTCHA ERROR]:", err);
    return null;
  }
};
