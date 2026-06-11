import { describe, it, expect } from "vitest";
import { parseSafeTimestamp } from "../dateUtils";

describe("parseSafeTimestamp", () => {
  it("should return null for falsy inputs", () => {
    expect(parseSafeTimestamp(null)).toBeNull();
    expect(parseSafeTimestamp(undefined)).toBeNull();
    expect(parseSafeTimestamp("")).toBeNull();
    expect(parseSafeTimestamp(0)).toBeNull();
  });

  it("should handle Firestore Timestamp with toDate function", () => {
    const mockDate = new Date("2023-01-01T12:00:00Z");
    const mockTimestamp = {
      toDate: () => mockDate,
    };
    expect(parseSafeTimestamp(mockTimestamp)).toEqual(mockDate);
  });

  it("should handle Firestore Timestamp with seconds property", () => {
    // 1672574400 is 2023-01-01T12:00:00Z
    const mockTimestamp = {
      seconds: 1672574400,
    };
    expect(parseSafeTimestamp(mockTimestamp)).toEqual(new Date("2023-01-01T12:00:00Z"));
  });

  it("should handle valid string timestamps", () => {
    const isoString = "2023-01-01T12:00:00Z";
    expect(parseSafeTimestamp(isoString)).toEqual(new Date(isoString));
  });

  it("should handle valid number timestamps", () => {
    const ms = 1672574400000; // 2023-01-01T12:00:00Z
    expect(parseSafeTimestamp(ms)).toEqual(new Date(ms));
  });

  it("should use Safari workaround for YYYY-MM-DD strings that fail standard parsing", () => {
    // Standard Date parsing usually handles YYYY-MM-DD fine, but we can test
    // that the Safari workaround correctly parses YYYY-MM-DD to a Date
    const dateStr = "2023-01-01";
    const result = parseSafeTimestamp(dateStr);
    expect(result).toBeInstanceOf(Date);
    // When using Safari workaround, "2023-01-01" becomes "2023/01/01" which is parsed in local time,
    // or as a valid Date object. We just verify it's a valid Date and not NaN.
    expect(isNaN(result!.getTime())).toBe(false);
  });

  it("should use Safari workaround for strings ending with T", () => {
    // If we have a malformed string like "2023-01-01T", standard Date parsing will result in Invalid Date
    const malformedStr = "2023-01-01T";

    // The workaround normalizes it to "2023/01/01" which parses properly
    const result = parseSafeTimestamp(malformedStr);
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result!.getTime())).toBe(false);
    expect(result?.getFullYear()).toBe(2023);
    expect(result?.getMonth()).toBe(0); // Jan is 0
    expect(result?.getDate()).toBe(1);
  });

  it("should return null for completely invalid date strings", () => {
    expect(parseSafeTimestamp("not-a-date")).toBeNull();
    expect(parseSafeTimestamp("invalid-string-format")).toBeNull();
  });

  it("should return null for invalid objects", () => {
    expect(parseSafeTimestamp({})).toBeNull();
    expect(parseSafeTimestamp({ random: "object" })).toBeNull();
  });
});
