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

  it("returns empty string when no key is configured in env or localStorage", () => {
    expect(getStoredMapsKey()).toBe("");
  });

  it("retrieves key from localStorage when stored", () => {
    localStorage.setItem("aegis_google_maps_key", "test-local-storage-key");
    expect(getStoredMapsKey()).toBe("test-local-storage-key");
  });

  it("retrieves key from process.env when present", () => {
    process.env.GOOGLE_MAPS_PLATFORM_KEY = "test-env-key";
    expect(getStoredMapsKey()).toBe("test-env-key");
  });

  it("renders interactive setup form with input and instructions when no key is configured", () => {
    render(<CareMapContainer />);

    expect(screen.getByText(/Localized Care Map/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/AIzaSy/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Save & Launch Care Map/i })).toBeDefined();
    expect(screen.getByText(/How to get an API Key/i)).toBeDefined();
  });

  it("saves key to localStorage upon form submission and switches to APIProvider", () => {
    render(<CareMapContainer />);

    const input = screen.getByPlaceholderText(/AIzaSy/i);
    fireEvent.change(input, { target: { value: "AIzaSyTestUserKey123" } });

    const submitBtn = screen.getByRole("button", { name: /Save & Launch Care Map/i });
    fireEvent.click(submitBtn);

    expect(localStorage.getItem("aegis_google_maps_key")).toBe("AIzaSyTestUserKey123");
    expect(screen.getByTestId("api-provider")).toBeDefined();
  });

  it("shows an error message if the user submits an empty key", () => {
    render(<CareMapContainer />);

    const submitBtn = screen.getByRole("button", { name: /Save & Launch Care Map/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Please enter a valid Google Maps Platform API key/i)).toBeDefined();
  });
});
