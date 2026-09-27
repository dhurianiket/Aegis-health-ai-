import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

interface SendArgs {
  message: string;
  contextParts?: string[];
}

const { createMock, sendMock, state } = vi.hoisted(() => {
  const adult = { id: "synthetic-profile", fullName: "Ramesh Kumar Sharma", name: "Ramesh Kumar Sharma", dob: "1974-01-01" };
  return {
    createMock: vi.fn(),
    sendMock: vi.fn(),
    state: { profileCtx: { activeProfile: adult as Record<string, unknown>, profiles: [adult] as Array<Record<string, unknown>> } },
  };
});

const AUTH = { user: { uid: "synthetic-user" }, authResolved: true };
const CLINICAL = { contextString: "", supplementaryContext: "", labBiomarkers: [], drugLabContraindications: [] };
vi.mock("../../../context/AuthContext", () => ({ useAuth: () => AUTH }));
vi.mock("../../../context/ProfileContext", () => ({ useProfile: () => state.profileCtx }));
vi.mock("../../../hooks/useClinicalContext", () => ({ useClinicalContext: () => CLINICAL }));
vi.mock("../../../lib/geminiClient", () => ({ default: () => ({ chats: { create: createMock } }) }));
vi.mock("../../../services/ai/contextService", () => ({
  getPatientContext: vi.fn().mockResolvedValue({}),
  // Synthetic OCR text with identifiers that must never reach the model.
  formatContextForPrompt: () =>
    "PATIENT PROFILE:\n- Name: (withheld)\nPAST SBAR SUMMARIES:\nPatient: Ramesh Kumar Sharma, Mobile: 9876543210, ramesh@example.com. HbA1c 7.9 %",
}));
vi.mock("../../../services/cacheService", () => ({
  generateSourceHash: vi.fn().mockResolvedValue("hash"),
  getCachedReport: vi.fn().mockResolvedValue(null),
  saveCachedReport: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../utils/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../../../lib/firebase/config", () => ({ db: {} }));
vi.mock("../../../lib/firebase/firestore", () => ({
  getActiveReferrals: vi.fn().mockResolvedValue([]),
  saveActiveReferral: vi.fn(),
  updateReferralStatus: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../services/lounge/loungeStorage", async () => (await import("./loungeTestMocks")).storageModule);
vi.mock("../../../services/lounge/loungeConsent", async (importOriginal) => (await import("./loungeTestMocks")).consentModule(importOriginal));

import SpecialistLounge from "../SpecialistLounge";
import { consentMocks, resetStorageMocks, storageModule } from "./loungeTestMocks";
import { normaliseLegacyMessages } from "../../../services/lounge/loungeMessageModel";

async function send(text: string) {
  const input = screen.getAllByLabelText(/^Message .*\(AI\)/)[0] as HTMLInputElement;
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
  });
  await act(async () => {
    fireEvent.submit(input.closest("form") as HTMLFormElement);
  });
}

async function renderLounge() {
  await act(async () => {
    render(<SpecialistLounge />);
  });
}

describe("SpecialistLounge — consent, delete data, pseudonymisation", () => {
  beforeEach(() => {
    resetStorageMocks();
    createMock.mockReset().mockImplementation(() => ({ sendMessageStream: sendMock }));
    sendMock.mockReset().mockImplementation(async () => {
      async function* gen() {
        yield { text: "General information only." };
      }
      return gen();
    });
    consentMocks.getLoungeConsent.mockReset().mockResolvedValue(null);
    consentMocks.saveLoungeConsent.mockReset().mockResolvedValue(undefined);
    const adult = { id: "synthetic-profile", fullName: "Ramesh Kumar Sharma", name: "Ramesh Kumar Sharma", dob: "1974-01-01" };
    state.profileCtx = { activeProfile: adult, profiles: [adult] };
  });

  it("shows a one-time consent sheet before first use and blocks sending until accepted", async () => {
    await renderLounge();
    const sheet = screen.getByTestId("lounge-consent-sheet");
    expect(sheet.textContent).toMatch(/Google \(Gemini/);
    expect(sheet.textContent).toMatch(/Cloudflare/);
    expect(sheet.textContent).toMatch(/outside India/);
    expect(sheet.textContent).toMatch(/112/);
    expect(sheet.textContent).toMatch(/108/);
    expect(sheet.textContent).not.toMatch(/Sharma/);
    expect(screen.queryByText(/parent or lawful guardian/)).toBeNull();

    await send("What is HbA1c?");
    expect(createMock).not.toHaveBeenCalled();

    const agree = screen.getByRole("button", { name: /Agree and continue/ });
    expect((agree as HTMLButtonElement).disabled).toBe(true);
    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox"));
    });
    await act(async () => {
      fireEvent.click(agree);
    });
    expect(consentMocks.saveLoungeConsent).toHaveBeenCalledWith("synthetic-user", "synthetic-profile", {
      isMinorProfile: false,
      guardianConfirmed: false,
    });
    expect(screen.queryByTestId("lounge-consent-sheet")).toBeNull();

    // After consent the message goes through, pseudonymised.
    await send("What is HbA1c?");
    expect(createMock).toHaveBeenCalledTimes(1);
    const sent = sendMock.mock.calls[0][0] as SendArgs;
    const block = sent.contextParts?.[0] ?? "";
    expect(block).not.toMatch(/Sharma/);
    expect(block).not.toContain("9876543210");
    expect(block).not.toContain("ramesh@example.com");
    expect(block).toContain("HbA1c 7.9 %");
  });

  it("requires parent/guardian confirmation for a child profile", async () => {
    const child = { id: "synthetic-child", fullName: "Aarav Sharma", name: "Aarav Sharma", dob: "2016-05-01" };
    state.profileCtx = { activeProfile: child, profiles: [child] };
    await renderLounge();
    const agree = screen.getByRole("button", { name: /Agree and continue/ }) as HTMLButtonElement;
    const [ack, guardian] = screen.getAllByRole("checkbox");
    expect(screen.getByText(/parent or lawful guardian/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(ack);
    });
    expect(agree.disabled).toBe(true);
    await act(async () => {
      fireEvent.click(guardian);
    });
    expect(agree.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(agree);
    });
    expect(consentMocks.saveLoungeConsent).toHaveBeenCalledWith("synthetic-user", "synthetic-child", {
      isMinorProfile: true,
      guardianConfirmed: true,
    });
  });

  it("does not show the sheet when a current consent exists", async () => {
    consentMocks.getLoungeConsent.mockResolvedValue({
      purpose: "specialist_lounge_ai",
      version: (await import("../../../services/lounge/loungeConsent")).LOUNGE_CONSENT_VERSION,
      accepted: true,
      isMinorProfile: false,
      guardianConfirmed: false,
    });
    await renderLounge();
    expect(screen.queryByTestId("lounge-consent-sheet")).toBeNull();
  });

  it("'Delete Lounge data' asks for confirmation, then deletes this profile's Lounge data", async () => {
    consentMocks.getLoungeConsent.mockResolvedValue({
      purpose: "specialist_lounge_ai",
      version: (await import("../../../services/lounge/loungeConsent")).LOUNGE_CONSENT_VERSION,
      accepted: true,
      isMinorProfile: false,
      guardianConfirmed: false,
    });
    storageModule.loadLoungeMessages.mockResolvedValueOnce({
      source: "messages",
      messages: normaliseLegacyMessages([{ role: "user", content: "Old synthetic question", createdAt: "2026-09-01T10:00:00Z" }]),
    });
    await renderLounge();
    // Messages render in a virtualised list (no layout in jsdom); the empty
    // state is shown only when there are no messages.
    const emptyState = /Ask the .* to explain your reports/;
    expect(document.body.textContent).not.toMatch(emptyState);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Delete Lounge data/ }));
    });
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });
    expect(storageModule.deleteLoungeData).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Delete Lounge data/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Delete permanently/ }));
    });
    expect(storageModule.deleteLoungeData).toHaveBeenCalledWith("synthetic-user", "synthetic-profile");
    expect(document.body.textContent).toMatch(emptyState);
    expect(screen.getByRole("status").textContent).toMatch(/deleted/);
  });
});
