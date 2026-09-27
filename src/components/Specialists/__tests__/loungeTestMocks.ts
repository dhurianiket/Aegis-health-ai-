/**
 * Shared test doubles for the Lounge storage/consent modules. Use from a
 * vi.mock factory:
 *   vi.mock(".../services/lounge/loungeStorage", async () => (await import("./loungeTestMocks")).storageModule);
 *   vi.mock(".../services/lounge/loungeConsent", async (orig) => (await import("./loungeTestMocks")).consentModule(orig));
 */
import { vi } from "vitest";
import type { LoungeMessageInput } from "../../../services/lounge/loungeMessageModel";
import type { LoungeLoadResult } from "../../../services/lounge/loungeStorage";
import type * as ConsentModule from "../../../services/lounge/loungeConsent";

export const appendedBatches: LoungeMessageInput[][] = [];

export const storageModule = {
  appendLoungeMessages: vi.fn(async (_uid: string, _pid: string, _chat: string, msgs: readonly LoungeMessageInput[]) => {
    appendedBatches.push([...msgs]);
    return msgs.map((_m, i) => `id-${appendedBatches.length}-${i}`);
  }),
  loadLoungeMessages: vi.fn(async (): Promise<LoungeLoadResult> => ({ messages: [], source: "empty" })),
  deleteLoungeData: vi.fn(async () => ({ chats: 0, messages: 0, referrals: 0, cachedSummaries: 0 })),
};

/** All persisted messages, flattened in write order. */
export function allAppended(): LoungeMessageInput[] {
  return appendedBatches.flat();
}

export function resetStorageMocks(): void {
  appendedBatches.length = 0;
  storageModule.appendLoungeMessages.mockClear();
  storageModule.loadLoungeMessages.mockReset().mockResolvedValue({ messages: [], source: "empty" });
  storageModule.deleteLoungeData.mockReset().mockResolvedValue({ chats: 0, messages: 0, referrals: 0, cachedSummaries: 0 });
}

export const consentMocks = {
  getLoungeConsent: vi.fn(),
  saveLoungeConsent: vi.fn(),
};

export async function consentModule(importOriginal: () => Promise<unknown>) {
  const actual = (await importOriginal()) as typeof ConsentModule;
  consentMocks.getLoungeConsent.mockResolvedValue({
    purpose: actual.LOUNGE_CONSENT_PURPOSE,
    version: actual.LOUNGE_CONSENT_VERSION,
    accepted: true,
    isMinorProfile: false,
    guardianConfirmed: false,
  });
  return { ...actual, getLoungeConsent: consentMocks.getLoungeConsent, saveLoungeConsent: consentMocks.saveLoungeConsent };
}
