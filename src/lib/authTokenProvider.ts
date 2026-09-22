export type TokenProvider = () => Promise<string | null>;

let activeTokenProvider: TokenProvider | null = null;

export function setAuthTokenProvider(provider: TokenProvider | null): void {
  activeTokenProvider = provider;
}

export function hasAuthTokenProvider(): boolean {
  return activeTokenProvider !== null;
}

export async function getAuthToken(): Promise<string | null> {
  if (!activeTokenProvider) return null;
  try {
    return await activeTokenProvider();
  } catch {
    return null;
  }
}
