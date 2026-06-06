export const getRecaptchaToken = async (action: string): Promise<string | null> => {
  try {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6Lfln_EsAAAAABlOtBKP5ngFr3f8lXzX59Oujq6A";
    if (!siteKey) {
      console.error("[RECAPTCHA]: VITE_RECAPTCHA_SITE_KEY is missing.");
      return null;
    }

    if (!(window as any).grecaptcha) {
      await new Promise<void>((resolve, reject) => {
        const id = "recaptcha-lazy-script";
        if (document.getElementById(id)) {
          const checkExist = setInterval(() => {
            if ((window as any).grecaptcha) {
              clearInterval(checkExist);
              resolve();
            }
          }, 100);
          return;
        }
        const script = document.createElement("script");
        script.id = id;
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if ((window as any).grecaptcha) {
            (window as any).grecaptcha.ready(() => resolve());
          } else {
            resolve();
          }
        };
        script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
        document.head.appendChild(script);
      });
    }

    if (!(window as any).grecaptcha) {
      console.error("[RECAPTCHA]: Library not initialized.");
      return null;
    }

    return new Promise<string | null>((resolve) => {
      (window as any).grecaptcha.ready(async () => {
        try {
          const token = await (window as any).grecaptcha.execute(
            siteKey,
            { action }
          );
          resolve(token);
        } catch (execError) {
          console.error("[RECAPTCHA EXECUTING ERROR]:", execError);
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.error("[RECAPTCHA ERROR]:", err);
    return null;
  }
};
