import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendLoginSecurityAlert } from "../emailNotificationService";

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(),
}));

vi.mock("../../lib/firebase/config", () => ({
  functions: {},
}));

describe("emailNotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully invokes notifyLogin callable and returns true", async () => {
    const { httpsCallable } = await import("firebase/functions");
    const mockCallable = vi.fn().mockResolvedValue({ data: { success: true, emailId: "test-id-123" } });
    (httpsCallable as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

    const result = await sendLoginSecurityAlert();
    expect(result).toBe(true);
    expect(mockCallable).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceType: expect.any(String),
        userAgent: expect.any(String),
      })
    );
  });

  it("gracefully catches errors without throwing and returns false", async () => {
    const { httpsCallable } = await import("firebase/functions");
    const mockCallable = vi.fn().mockRejectedValue(new Error("Network unauthenticated"));
    (httpsCallable as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

    const result = await sendLoginSecurityAlert();
    expect(result).toBe(false);
  });
});
