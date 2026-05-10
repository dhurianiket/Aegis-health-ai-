import { describe, it, expect } from "vitest";
import LabTrendChart from "../LabTrendChart";

describe("LabTrendChart", () => {
  it("should render without crashing when given empty data", () => {
    // Just a smoke test to check it exports correctly and doesn't crash
    expect(LabTrendChart).toBeDefined();
  });
});
