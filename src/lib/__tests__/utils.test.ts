import { describe, it, expect } from "vitest";
import { cn, formatHealthScore } from "../utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge tailwind classes correctly", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
      expect(cn("text-red-500", { "bg-blue-500": true })).toBe("text-red-500 bg-blue-500");
    });
  });

  describe("formatHealthScore", () => {
    it("should return Excellent for scores >= 85", () => {
      expect(formatHealthScore(100)).toEqual({ color: "text-green-500", label: "Excellent" });
      expect(formatHealthScore(85)).toEqual({ color: "text-green-500", label: "Excellent" });
    });

    it("should return Good for scores >= 70 and < 85", () => {
      expect(formatHealthScore(84)).toEqual({ color: "text-blue-500", label: "Good" });
      expect(formatHealthScore(70)).toEqual({ color: "text-blue-500", label: "Good" });
    });

    it("should return Fair for scores >= 50 and < 70", () => {
      expect(formatHealthScore(69)).toEqual({ color: "text-yellow-500", label: "Fair" });
      expect(formatHealthScore(50)).toEqual({ color: "text-yellow-500", label: "Fair" });
    });

    it("should return Critical for scores < 50", () => {
      expect(formatHealthScore(49)).toEqual({ color: "text-red-500", label: "Critical" });
      expect(formatHealthScore(0)).toEqual({ color: "text-red-500", label: "Critical" });
      expect(formatHealthScore(-10)).toEqual({ color: "text-red-500", label: "Critical" });
    });
  });
});
