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

interface CreateArgs {
  model?: string;
  config?: { maxOutputTokens?: number; thinkingConfig?: { thinkingLevel?: string }; temperature?: number };
  signal?: AbortSignal;
  feature?: string;
}
interface Chunk {
  text: string;
  modelUsed?: string;
  modelVersion?: string;
  finishReason?: string;
}

const { createMock, sendMock, setDocMock, saveCachedReportMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  sendMock: vi.fn(),
  setDocMock: vi.fn(),
  saveCachedReportMock: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "synthetic-user" }, authResolved: true }),
}));
vi.mock("../../../context/ProfileContext", () => ({
  useProfile: () => ({ activeProfile: { id: "synthetic-profile", name: "Synthetic Patient" } }),
}));
vi.mock("../../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({ contextString: "", supplementaryContext: "", labBiomarkers: [], drugLabContraindications: [] }),
}));
vi.mock("../../../lib/geminiClient", () => ({
  default: () => ({ chats: { create: createMock } }),
}));
vi.mock("../../../services/ai/contextService", () => ({
  getPatientContext: vi.fn().mockResolvedValue({}),
  formatContextForPrompt: () => "PATIENT PROFILE:\n- Name: (withheld)",
}));
vi.mock("../../../services/cacheService", () => ({
  generateSourceHash: vi.fn().mockResolvedValue("hash"),
  getCachedReport: vi.fn().mockResolvedValue(null),
  saveCachedReport: saveCachedReportMock,
}));
vi.mock("../../../utils/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../../../lib/firebase/config", () => ({ db: {} }));
vi.mock("../../../lib/firebase/firestore", () => ({
  getActiveReferrals: vi.fn().mockResolvedValue([]),
  saveActiveReferral: vi.fn().mockResolvedValue("ref"),
  updateReferralStatus: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
    setDoc: setDocMock,
    serverTimestamp: vi.fn(),
  };
});

import SpecialistLounge from "../SpecialistLounge";

function replyWith(chunk: Chunk) {
  sendMock.mockImplementation(async () => {
    async function* gen() {
      yield chunk;
    }
    return gen();
  });
}

async function send(text: string) {
  const input = screen.getAllByLabelText(/^Message .*\(AI\)/)[0] as HTMLInputElement;
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
  });
  await act(async () => {
    fireEvent.submit(input.closest("form") as HTMLFormElement);
  });
}

const lastCreate = (): CreateArgs => createMock.mock.calls[createMock.mock.calls.length - 1][0] as CreateArgs;
const savedMessages = (): Array<{ role: string; content: string }> => {
  const last = setDocMock.mock.calls[setDocMock.mock.calls.length - 1][1] as { messages: Array<{ role: string; content: string }> };
  return last.messages;
};

describe("SpecialistLounge — token caps, model pin, Stop", () => {
  beforeEach(() => {
    createMock.mockReset().mockImplementation(() => ({ sendMessageStream: sendMock }));
    sendMock.mockReset();
    setDocMock.mockReset().mockResolvedValue(undefined);
    saveCachedReportMock.mockReset().mockResolvedValue(undefined);
    replyWith({ text: "General info.", modelUsed: "gemini-3.8-flash" });
  });

  it("chat turns use the pinned stable Flash model with a 1536-token cap, low thinking, abort signal and Lounge feature flag", async () => {
    await act(async () => {
      render(<SpecialistLounge />);
    });
    await send("What is LDL?");
    const args = lastCreate();
    expect(args.model).toBe("gemini-3.8-flash");
    expect(args.model).not.toMatch(/preview/);
    expect(args.config?.maxOutputTokens).toBe(1536);
    expect(args.config?.thinkingConfig?.thinkingLevel).toBe("low");
    expect(args.signal).toBeInstanceOf(AbortSignal);
    expect(args.feature).toBe("specialist");
  });

  it("summary requests get a 3072-token cap and cache the model that actually answered", async () => {
    replyWith({ text: "Summary.", modelUsed: "gemini-3.6-flash" });
    await act(async () => {
      render(<SpecialistLounge />);
    });
    await send("Summarize my labs");
    const args = lastCreate();
    expect(args.model).toBe("gemini-3.8-flash");
    expect(args.config?.maxOutputTokens).toBe(3072);
    expect(saveCachedReportMock).toHaveBeenCalledTimes(1);
    expect(saveCachedReportMock.mock.calls[0][1]).toMatchObject({ modelUsed: "gemini-3.6-flash", promptVersion: "v2.0-safe-guides" });
  });

  it("prefers Gemini's reported modelVersion for the cache label", async () => {
    replyWith({ text: "Summary.", modelUsed: "gemini-3.8-flash", modelVersion: "gemini-3.8-flash-001" });
    await act(async () => {
      render(<SpecialistLounge />);
    });
    await send("Summarize my labs");
    expect(saveCachedReportMock.mock.calls[0][1]).toMatchObject({ modelUsed: "gemini-3.8-flash-001" });
  });

  it("marks truncated replies and never caches a truncated summary", async () => {
    replyWith({ text: "Partial summary", modelUsed: "gemini-3.8-flash", finishReason: "MAX_TOKENS" });
    await act(async () => {
      render(<SpecialistLounge />);
    });
    await send("Summarize my labs");
    expect(saveCachedReportMock).not.toHaveBeenCalled();
    expect(savedMessages()[1].content).toContain("cut short");
  });

  it("Stop aborts the request, resets the UI and saves no partial reply", async () => {
    let capturedSignal: AbortSignal | undefined;
    createMock.mockImplementation((args: CreateArgs) => {
      capturedSignal = args.signal;
      return {
        sendMessageStream: async () =>
          (async function* gen(): AsyncGenerator<Chunk> {
            await new Promise<void>((_resolve, reject) => {
              args.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
            });
            yield { text: "should never appear" };
          })(),
      };
    });

    await act(async () => {
      render(<SpecialistLounge />);
    });
    await send("Explain my thyroid report");
    expect(screen.getAllByText("Analyzing record...").length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /Stop/i })[0]);
    });

    expect(capturedSignal?.aborted).toBe(true);
    expect(screen.queryByText("Analyzing record...")).toBeNull();
    expect(screen.queryByRole("button", { name: /Stop/i })).toBeNull();
    expect(document.body.textContent).not.toContain("should never appear");
    // No error bubble for a user cancel.
    expect(document.body.textContent).not.toMatch(/error|went wrong/i);
    // Only the user's message was ever persisted.
    for (const call of setDocMock.mock.calls) {
      const msgs = (call[1] as { messages: Array<{ role: string }> }).messages;
      expect(msgs.every((m) => m.role === "user")).toBe(true);
    }

    // The input is usable again: a new message goes through normally.
    createMock.mockImplementation(() => ({ sendMessageStream: sendMock }));
    replyWith({ text: "Fresh answer.", modelUsed: "gemini-3.8-flash" });
    await send("What is TSH?");
    expect(savedMessages().map((m) => m.content)).toEqual(["Explain my thyroid report", "What is TSH?", "Fresh answer."]);
  });
});
