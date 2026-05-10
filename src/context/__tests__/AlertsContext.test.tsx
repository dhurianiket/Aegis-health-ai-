import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { AlertsProvider, useAlerts } from "../AlertsContext";
import * as authCtx from "../AuthContext";
import * as profileCtx from "../ProfileContext";

// Mock the context hooks to bypass the actual Context Provider logic in wrappers
vi.mock("../AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../ProfileContext", () => ({
  useProfile: vi.fn(),
}));

vi.mock("../../lib/firebase/firestore", () => ({
  getLabHistory: vi.fn().mockResolvedValue([]),
  getMedications: vi.fn().mockResolvedValue([]),
}));

describe("AlertsContext persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Default mocks
    (authCtx.useAuth as any).mockReturnValue({ user: { uid: "u1" } });
    (profileCtx.useProfile as any).mockReturnValue({
      activeProfile: { id: "p1" },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize dismissedIds from localStorage and persist changes", async () => {
    localStorage.setItem("dismissedAlerts", JSON.stringify(["id-1"]));

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return <AlertsProvider>{children}</AlertsProvider>;
    };

    let result: any;
    await act(async () => {
      const render = renderHook(() => useAlerts(), { wrapper });
      result = render.result;
    });

    expect(result.current.dismissedIds.has("id-1")).toBe(true);

    act(() => {
      result.current.dismissAlert("id-2");
    });

    expect(result.current.dismissedIds.has("id-2")).toBe(true);

    const stored = JSON.parse(localStorage.getItem("dismissedAlerts") || "[]");
    expect(stored).toContain("id-2");
    expect(stored).toContain("id-1");
  });
});
