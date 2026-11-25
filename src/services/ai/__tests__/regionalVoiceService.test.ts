import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setAuthTokenProvider } from "../../../lib/authTokenProvider";
import { regionalVoiceService } from "../regionalVoiceService";

describe("regionalVoiceService", () => {
  beforeEach(() => {
    setAuthTokenProvider(async () => "fake-firebase-id-token");
  });

  afterEach(() => {
    regionalVoiceService.stop();
    setAuthTokenProvider(null);
    vi.restoreAllMocks();
  });

  it("synthesizes Cloud HD audio via /api/audio/synthesize when signed in", async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.example.test/api/audio/synthesize");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer fake-firebase-id-token");
      const sent = JSON.parse(String(init?.body)) as { text: string; languageCode: string; speakingRate: number };
      expect(sent.text).toBe("Your HbA1c is normal.");
      expect(sent.languageCode).toBe("en-IN");
      expect(sent.speakingRate).toBe(1.25);
      return new Response(JSON.stringify({ audioContent: "SUQzCloudMp3==" }), { status: 200 });
    }) as unknown as typeof fetch;

    const b64 = await regionalVoiceService.synthesizeCloudSpeech(
      "*Your* HbA1c is normal.",
      "en-IN",
      1.25,
      mockFetch,
      "https://api.example.test",
    );
    expect(b64).toBe("SUQzCloudMp3==");
  });

  it("requires auth for Cloud HD synthesis and exposes 10 Indian languages", async () => {
    setAuthTokenProvider(null);
    await expect(regionalVoiceService.synthesizeCloudSpeech("Hello")).rejects.toThrow("Authentication required");
    expect(regionalVoiceService.getAvailableLanguages().length).toBeGreaterThanOrEqual(10);
  });

  it("falls back seamlessly to browser SpeechSynthesis when unauthenticated (Guest Demo)", async () => {
    setAuthTokenProvider(null);
    const speakSpy = vi.fn();
    const cancelSpy = vi.fn();
    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      speak: speakSpy,
      cancel: cancelSpy,
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: () => [],
      speaking: false,
      paused: false,
    };
    (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = function (this: Record<string, unknown>, text: string) {
      this.text = text;
    };

    const sources: string[] = [];
    // Re-attach synth for isolated vitest jsdom instance
    (regionalVoiceService as unknown as { synth: unknown }).synth = window.speechSynthesis;
    regionalVoiceService.speakText("Namaste Aegis", "hi-IN", 1.0, undefined, undefined, undefined, (src) => {
      sources.push(src);
    });

    await new Promise((r) => setTimeout(r, 25));
    expect(sources).toEqual(["browser"]);
    expect(speakSpy).toHaveBeenCalledTimes(1);
  });
});
