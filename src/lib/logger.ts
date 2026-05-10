/**
 * Basic error logging service.
 * In a production environment, this should be connected to a service
 * like Sentry, Datadog, or LogRocket.
 */
export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.info(`[INFO]: ${message}`, context || "");
  },
  warn: (message: string, context?: Record<string, any>) => {
    console.warn(`[WARN]: ${message}`, context || "");
  },
  error: (error: Error | string, context?: Record<string, any>) => {
    // Basic formatting for console
    if (error instanceof Error) {
      console.error(
        `[ERROR]: ${error.message}\nStack: ${error.stack}`,
        context || "",
      );
    } else {
      console.error(`[ERROR]: ${error}`, context || "");
    }

    // TODO: Send to remote observability platform
    // Example: Sentry.captureException(error, { extra: context })
  },
};
