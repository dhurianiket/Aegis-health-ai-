import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";

if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

const { getAIMock, getPatientContextMock, trackEventMock, setDocMock } = vi.hoisted(() => ({
  getAIMock: vi.fn(),
  getPatientContextMock: vi.fn(),
  trackEventMock: vi.fn(),
  setDocMock: vi.fn(),
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "synthetic-user" }, authResolved: true }),
}));
vi.mock("../../../context/ProfileContext", () => ({
  useProfile: () => ({ activeProfile: { id: "synthetic-profile", name: "Test Patient" } }),
}));
vi.mock("../../../hooks/useClinicalContext", () => ({
  useClinicalContext: () => ({ contextString: "", labBiomarkers: [], drugLabContraindications: [] }),
}));
vi.mock("../../../lib/geminiClient", () => ({ default: getAIMock }));
vi.mock("../../../services/ai/contextService", () => ({
  getPatientContext: getPatientContextMock,
  formatContextForPrompt: () => "",
}));
vi.mock("../../../utils/analytics", () => ({ trackEvent: trackEventMock }));
vi.mock("../../../lib/firebase/config", () => ({ db: {} }));
vi.mock("../../../lib/firebase/firestore", () => ({
  getActiveReferrals: vi.fn().mockResolvedValue([]),
  saveActiveReferral: vi.fn().mockResolvedValue("ref-1"),
  updateReferralStatus: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
    setDoc: setDocMock.mockResolvedValue(undefined),
    serverTimestamp: vi.fn(),
  };
});

import SpecialistLounge from "../SpecialistLounge";

async function send(text: string) {
  const input = screen.getAllByLabelText(/^Message .*\(AI\)/)[0] as HTMLInputElement;
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
  });
  await act(async () => {
    fireEvent.submit(input.closest("form") as HTMLFormElement);
  });
}

describe("SpecialistLounge deterministic emergency triage", () => {
  beforeEach(() => {
    getAIMock.mockReset();
    getPatientContextMock.mockReset();
    trackEventMock.mockReset();
    getAIMock.mockImplementation(() => {
      throw new Error("model unavailable in test");
    });
    getPatientContextMock.mockResolvedValue({});
  });

  it.each([
    ["I can't breathe", "breathing", false],
    ["सीने में दर्द हो रहा है", "cardiac", false],
    ["mujhe marna chahta hu", "self_harm", true],
  ])("blocks %j before Gemini and shows the emergency card", async (text, category, mental) => {
    await act(async () => {
      render(<SpecialistLounge />);
    });
    await send(text);

    const card = screen.getAllByTestId("emergency-triage-card")[0];
    expect(card.getAttribute("role")).toBe("alert");
    const links = within(card).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links[0]).toBe("tel:112");
    expect(links[1]).toBe("tel:108");
    if (mental) {
      expect(links).toContain("tel:14416");
      expect(links).toContain("tel:18008914416");
    } else {
      expect(links).not.toContain("tel:14416");
    }
    expect(card.textContent?.toLowerCase()).not.toContain("kiran");

    expect(getAIMock).not.toHaveBeenCalled();
    expect(getPatientContextMock).not.toHaveBeenCalled();

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith("lounge_emergency_triage", "safety", category);
    // Message text must never reach analytics.
    expect(JSON.stringify(trackEventMock.mock.calls)).not.toContain(text);
  });

  it("lets a benign message through to the normal AI path", async () => {
    await act(async () => {
      render(<SpecialistLounge />);
    });
    await send("my heart rate is 72, is that fine?");
    expect(screen.queryByTestId("emergency-triage-card")).toBeNull();
    expect(getAIMock).toHaveBeenCalled();
    expect(trackEventMock).not.toHaveBeenCalled();
  });
});
