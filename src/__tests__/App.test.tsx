import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import App from "../App";
import * as authCtx from "../context/AuthContext";
import * as profileCtx from "../context/ProfileContext";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("../context/ProfileContext", () => ({
  useProfile: vi.fn(),
  ProfileProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("../context/AlertsContext", () => ({
  useAlerts: vi.fn().mockReturnValue({
    alerts: [],
    dismissedIds: new Set(),
    dismissAlert: vi.fn(),
    unreadCount: 0,
  }),
  AlertsProvider: ({ children }: any) => <div>{children}</div>,
}));

describe("App Critical Flow (Smoke)", () => {
  it("should render the dashboard layout with user signed in", () => {
    (authCtx.useAuth as any).mockReturnValue({
      user: { uid: "u1", email: "test@example.com" },
      signIn: vi.fn(),
      logOut: vi.fn(),
    });

    (profileCtx.useProfile as any).mockReturnValue({
      profiles: [{ id: "p1", name: "John Doe" }],
      activeProfile: { id: "p1", name: "John Doe" },
      setActiveProfile: vi.fn(),
    });

    const { getAllByText } = render(<App />);
    expect(getAllByText("John Doe").length).toBeGreaterThan(0);
  });
});
