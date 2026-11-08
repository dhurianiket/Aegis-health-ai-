import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isStandalone, isIOS, isAndroid } from "../lib/pwa";

describe("PWA Utilities & Mobile Environment Detection", () => {
  const originalUserAgent = window.navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: originalUserAgent,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe("isStandalone", () => {
    it("returns false in normal browser window", () => {
      expect(isStandalone()).toBe(false);
    });

    it("returns true when matchMedia returns display-mode: standalone", () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(isStandalone()).toBe(true);
    });

    it("returns true when window.navigator.standalone is true (iOS PWA)", () => {
      Object.defineProperty(window.navigator, "standalone", {
        value: true,
        configurable: true,
      });

      expect(isStandalone()).toBe(true);
    });
  });

  describe("Platform Detection", () => {
    it("correctly identifies iOS user agents", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        configurable: true,
      });

      expect(isIOS()).toBe(true);
      expect(isAndroid()).toBe(false);
    });

    it("correctly identifies Android user agents", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        configurable: true,
      });

      expect(isAndroid()).toBe(true);
      expect(isIOS()).toBe(false);
    });

    it("returns false for generic desktop user agents", () => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        configurable: true,
      });

      expect(isIOS()).toBe(false);
      expect(isAndroid()).toBe(false);
    });
  });
});
