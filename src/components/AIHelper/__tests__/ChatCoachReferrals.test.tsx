import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

const { saveActiveReferralMock, saveCoachChatMock, sendStreamMock, getActiveMedicationsMock, createMock } = vi.hoisted(() => ({
  saveActiveReferralMock: vi.fn(),
  saveCoachChatMock: vi.fn(),
  sendStreamMock: vi.fn(),
  getActiveMedicationsMock: vi.fn(),
  createMock: vi.fn(),
}));

// Stable references (the component keys effects on these objects).
const { AUTH, PROFILE_CTX } = vi.hoisted(() => {
  const child = { id: "synthetic-child", name: "Synthetic Child" };
  return {
    AUTH: { user: { uid: "synthetic-user" } },
    PROFILE_CTX: {
      activeProfile: child,
      profiles: [{ id: "synthetic-primary", name: "Myself", createdAt: 1 }, { ...child, createdAt: 2 }],
    },
  };
});
vi.mock("../../../context/AuthContext", () => ({ useAuth: () => AUTH }));
vi.mock("../../../context/ProfileContext", () => ({ useProfile: () => PROFILE_CTX }));
vi.mock("../../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({ contextString: "" }),
}));
vi.mock("../../../services/ai/voiceService", () => ({ VoiceService: vi.fn() }));
vi.mock("../../../services/ai/contextService", () => ({
  getPatientContext: vi.fn().mockResolvedValue({ medications: [], labHistory: [] }),
  formatContextForPrompt: () => "PATIENT PROFILE: synthetic",
}));
vi.mock("../../../lib/geminiClient", () => ({
  default: () => ({ chats: { create: createMock }, models: { generateContent: vi.fn() } }),
  isEdgeConfigured: () => true,
}));
vi.mock("../../../services/usageService", () => ({ trackUsage: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../../services/medicationService", () => ({ getActiveMedications: getActiveMedicationsMock }));
vi.mock("../../../services/reminderService", () => ({ getUpcomingReminders: vi.fn().mockResolvedValue([]) }));
vi.mock("../../../lib/firebase/firestore", () => ({
  saveCoachChat: saveCoachChatMock,
  getCoachChat: vi.fn().mockResolvedValue([]),
  saveActiveReferral: saveActiveReferralMock,
}));

import ChatCoach from "../ChatCoach";

const REPLY =
  "Thyroid numbers can be discussed with a registered medical practitioner. [REFERRAL: endocrinologist | Discuss synthetic TSH trend]";

async function sendMessage(text: string) {
  const input = screen.getByPlaceholderText(/Ask Aura AI/i);
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
  });
  await act(async () => {
    fireEvent.submit(input.closest("form") as HTMLFormElement);
  });
}

describe("ChatCoach — referral tags require explicit confirmation", () => {
  beforeEach(() => {
    saveActiveReferralMock.mockReset().mockResolvedValue("ref-1");
    saveCoachChatMock.mockReset().mockResolvedValue(undefined);
    getActiveMedicationsMock.mockReset().mockResolvedValue([
      { id: "m1", genericName: "ChildSyntheticMed", profileId: "synthetic-child", dosage: null },
      { id: "m2", genericName: "ParentSyntheticMed", profileId: "synthetic-primary", dosage: null },
      { id: "m3", genericName: "LegacyUntaggedMed", dosage: null },
    ]);
    sendStreamMock.mockReset().mockImplementation(async () => {
      async function* gen() {
        yield { text: REPLY };
      }
      return gen();
    });
    createMock.mockReset().mockImplementation(() => ({ sendMessageStream: sendStreamMock }));
  });

  it("never auto-saves, strips the raw tag, and saves only after the user taps the chip", async () => {
    await act(async () => {
      render(<ChatCoach externalOpen onClose={() => undefined} showTrigger={false} />);
    });
    await sendMessage("What does my thyroid result mean?");

    await waitFor(() => expect(screen.getByTestId("referral-suggestion-chip")).toBeTruthy());
    expect(saveActiveReferralMock).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("[REFERRAL");
    // Persisted transcript never contains the raw tag either.
    const savedMsgs = saveCoachChatMock.mock.calls[0][2] as Array<{ content: string }>;
    expect(savedMsgs.map((m) => m.content).join(" ")).not.toContain("[REFERRAL");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save suggestion" }));
    });
    expect(saveActiveReferralMock).toHaveBeenCalledTimes(1);
    expect(saveActiveReferralMock).toHaveBeenCalledWith("synthetic-user", "synthetic-child", {
      fromAgent: "Aura AI Health Coach",
      toSpecialist: "endocrinologist",
      reason: "Discuss synthetic TSH trend",
    });
    expect(await screen.findByText("Saved")).toBeTruthy();
  });

  it("dismissing a suggestion saves nothing", async () => {
    await act(async () => {
      render(<ChatCoach externalOpen onClose={() => undefined} showTrigger={false} />);
    });
    await sendMessage("Any thyroid concerns?");
    await waitFor(() => expect(screen.getByTestId("referral-suggestion-chip")).toBeTruthy());
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    });
    expect(screen.queryByTestId("referral-suggestion-chip")).toBeNull();
    expect(saveActiveReferralMock).not.toHaveBeenCalled();
  });

  it("only includes the active (secondary) profile's medications in the prompt", async () => {
    await act(async () => {
      render(<ChatCoach externalOpen onClose={() => undefined} showTrigger={false} />);
    });
    await sendMessage("What medicines am I on?");
    await waitFor(() => expect(createMock).toHaveBeenCalled());
    const sys = (createMock.mock.calls[0][0] as { config: { systemInstruction: string } }).config.systemInstruction;
    expect(sys).toContain("ChildSyntheticMed");
    expect(sys).not.toContain("ParentSyntheticMed");
    expect(sys).not.toContain("LegacyUntaggedMed");
    expect(sys).not.toMatch(/AI Doctor/i);
  });
});
