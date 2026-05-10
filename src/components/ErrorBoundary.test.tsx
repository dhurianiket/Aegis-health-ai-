import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>,
    );
    expect(getByText("Test Content")).toBeDefined();
  });
});
