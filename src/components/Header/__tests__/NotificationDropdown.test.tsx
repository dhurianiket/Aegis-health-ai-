import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NotificationDropdown from "../NotificationDropdown";
import * as alertsCtx from "../../../context/AlertsContext";
import { HealthAlert } from "../../../types/alerts";

vi.mock("../../../context/AlertsContext", () => ({
  useAlerts: vi.fn(),
}));

describe("NotificationDropdown Accessibility & Focus Rings", () => {
  const mockMarkAllAsRead = vi.fn();
  const mockDismissAlert = vi.fn();
  const mockOnClose = vi.fn();

  const mockAlerts: HealthAlert[] = [
    {
      id: "alert-1",
      title: "Medication Reminder",
      description: "Take Metformin 500mg with lunch",
      severity: "high",
      type: "medication",
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: "https://example.com/meds",
    },
    {
      id: "alert-2",
      title: "Lab Value Update",
      description: "HbA1c results uploaded",
      severity: "medium",
      type: "lab_value",
      read: true,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (alertsCtx.useAlerts as any).mockReturnValue({
      alerts: mockAlerts,
      markAllAsRead: mockMarkAllAsRead,
      dismissAlert: mockDismissAlert,
      unreadCount: 1,
    });
  });

  it("renders notification items and displays focus rings on interactive elements", () => {
    render(<NotificationDropdown onClose={mockOnClose} />);

    // 1. Mark all read button
    const markAllBtn = screen.getByRole("button", { name: /mark all read/i });
    expect(markAllBtn).toBeDefined();
    expect(markAllBtn.className).toContain("focus-visible:ring-2");
    expect(markAllBtn.className).toContain("focus-visible:ring-indigo-500");

    fireEvent.click(markAllBtn);
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);

    // 2. Close button
    const closeBtn = screen.getByRole("button", { name: /close notifications/i });
    expect(closeBtn).toBeDefined();
    expect(closeBtn.className).toContain("focus-visible:ring-2");

    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("ensures View Details and Dismiss buttons have focus rings and visible focus-within styling", () => {
    render(<NotificationDropdown onClose={mockOnClose} />);

    // View Details buttons
    const viewDetailsBtns = screen.getAllByRole("button", { name: /view details/i });
    expect(viewDetailsBtns.length).toBeGreaterThan(0);
    const viewDetailsBtn = viewDetailsBtns[0];
    expect(viewDetailsBtn.className).toContain("focus-visible:ring-2");
    expect(viewDetailsBtn.className).toContain("focus-visible:ring-indigo-500");

    // Dismiss buttons
    const dismissBtns = screen.getAllByRole("button", { name: /dismiss/i });
    expect(dismissBtns.length).toBeGreaterThan(0);
    const dismissBtn = dismissBtns[0];
    expect(dismissBtn.className).toContain("focus-visible:ring-2");
    expect(dismissBtn.className).toContain("focus-visible:ring-red-500");

    // Parent container opacity-0 group-focus-within:opacity-100 check
    const actionContainer = dismissBtn.parentElement;
    expect(actionContainer?.className).toContain("group-focus-within:opacity-100");
    expect(actionContainer?.className).toContain("focus-within:opacity-100");

    fireEvent.click(dismissBtn);
    expect(mockDismissAlert).toHaveBeenCalledWith("alert-1");
  });

  it("provides focus ring styling on category filter buttons and footer button", () => {
    render(<NotificationDropdown onClose={mockOnClose} />);

    const allCategoryBtn = screen.getByRole("button", { name: /^all$/i });
    expect(allCategoryBtn.className).toContain("focus-visible:ring-2");
    expect(allCategoryBtn.className).toContain("focus-visible:ring-indigo-500");

    const criticalCategoryBtn = screen.getByRole("button", { name: /^critical$/i });
    expect(criticalCategoryBtn.className).toContain("focus-visible:ring-2");

    const viewAllBtn = screen.getByRole("button", { name: /view all activity/i });
    expect(viewAllBtn.className).toContain("focus-visible:ring-2");
    expect(viewAllBtn.className).toContain("focus-visible:ring-indigo-500");

    fireEvent.click(viewAllBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles category filtering and empty state gracefully", () => {
    (alertsCtx.useAlerts as any).mockReturnValue({
      alerts: [],
      markAllAsRead: mockMarkAllAsRead,
      dismissAlert: mockDismissAlert,
      unreadCount: 0,
    });

    render(<NotificationDropdown onClose={mockOnClose} />);
    expect(screen.getByText(/all clear!/i)).toBeDefined();
    expect(screen.getByText(/no notifications in this category/i)).toBeDefined();
  });
});
