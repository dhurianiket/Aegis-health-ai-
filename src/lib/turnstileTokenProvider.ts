/**
 * Provider for Cloudflare Turnstile bot verification tokens.
 * Decouples the client-side widget / hook lifecycle from low-level fetch clients.
 */

export type TurnstileTokenProvider = () => Promise<string | null>;

let activeTurnstileProvider: TurnstileTokenProvider | null = null;
let lastTurnstileToken: string | null = null;

export function setTurnstileTokenProvider(provider: TurnstileTokenProvider | null): void {
  activeTurnstileProvider = provider;
}

export function setCachedTurnstileToken(token: string | null): void {
  lastTurnstileToken = token;
}

export function hasTurnstileTokenProvider(): boolean {
  return activeTurnstileProvider !== null;
}

/**
 * Retrieves the latest Turnstile token from the registered provider,
 * falling back to any cached token.
 */
export async function getTurnstileToken(): Promise<string | null> {
  if (activeTurnstileProvider) {
    try {
      const token = await activeTurnstileProvider();
      if (token) return token;
    } catch (e) {
      console.warn("[Turnstile] Provider threw an error:", e);
    }
  }
  return lastTurnstileToken;
}
