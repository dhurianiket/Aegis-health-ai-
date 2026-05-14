import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
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
  it("should render the dashboard layout with user signed in", async () => {
    (authCtx.useAuth as any).mockReturnValue({
      user: { uid: "u1", email: "test@example.com" },
      signIn: vi.fn(),
      logOut: vi.fn(),
      authResolved: true,
      loading: false,
    });

    (profileCtx.useProfile as any).mockReturnValue({
      profiles: [{ id: "p1", name: "John Doe" }],
      activeProfile: { id: "p1", name: "John Doe" },
      setActiveProfile: vi.fn(),
    });

    const { getAllByText } = render(<App />);
    
    await waitFor(() => {
      expect(getAllByText(/Secure Storage/i).length).toBeGreaterThan(0);
    }, { timeout: 4000 });
  }, 10000);
});
