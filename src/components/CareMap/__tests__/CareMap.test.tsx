import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CareMapContainer, { getStoredMapsKey } from "../CareMap";

// Mock @vis.gl/react-google-maps
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="api-provider">{children}</div>,
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="google-map">{children}</div>,
  AdvancedMarker: ({ children }: { children: React.ReactNode }) => <div data-testid="advanced-marker">{children}</div>,
  Pin: ({ children }: { children: React.ReactNode }) => <div data-testid="pin">{children}</div>,
  InfoWindow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMap: () => null,
  useMapsLibrary: () => null,
  useAdvancedMarkerRef: () => [null, null],
}));

// Mock ProfileContext
vi.mock("../../../context/ProfileContext", () => ({
  useProfile: () => ({ activeProfile: { gender: "male" } }),
}));

describe("CareMap & Key Management", () => {
  beforeEach(() => {
    localStorage.clear();
    delete (process.env as any).GOOGLE_MAPS_PLATFORM_KEY;
    delete (process.env as any).VITE_GOOGLE_MAPS_PLATFORM_KEY;
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns empty string when no key is configured in env", () => {
    expect(getStoredMapsKey()).toBe("");
  });

  it("retrieves key from process.env when present", () => {
    process.env.GOOGLE_MAPS_PLATFORM_KEY = "test-env-key";
    expect(getStoredMapsKey()).toBe("test-env-key");
  });

  it("does not load keys from localStorage (security compliance)", () => {
    localStorage.setItem("aegis_google_maps_key", "untrusted-local-key");
    expect(getStoredMapsKey()).toBe("");
  });

  it("purges legacy localStorage key on container mount", () => {
    localStorage.setItem("aegis_google_maps_key", "legacy-key-to-purge");
    render(<CareMapContainer />);
    expect(localStorage.getItem("aegis_google_maps_key")).toBeNull();
  });

  it("renders clinical fallback without any API key inputs or developer instructions when key is not configured", () => {
    render(<CareMapContainer />);

    expect(screen.getByText(/Localized Care Map/i)).toBeDefined();
    expect(screen.getByText(/scheduled telemetry synchronization/i)).toBeDefined();
    // Security assertion: Never render API key inputs, credentials forms, or developer guides to patients
    expect(screen.queryByPlaceholderText(/AIzaSy/i)).toBeNull();
    expect(screen.queryByText(/How to get an API Key/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /Save & Launch Care Map/i })).toBeNull();
  });

  it("renders APIProvider when valid key is configured via environment", () => {
    process.env.GOOGLE_MAPS_PLATFORM_KEY = "AIzaSyTestPlatformKey123";
    render(<CareMapContainer />);

    expect(screen.getByTestId("api-provider")).toBeDefined();
  });
});

