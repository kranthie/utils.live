import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { leapYearChecker } from "../../../src/tools/datetime/leap-year-checker";

describe("Leap Year Checker", () => {
  it("should have correct metadata", () => {
    expect(leapYearChecker.meta.id).toBe("datetime/leap-year-checker");
    expect(leapYearChecker.meta.category).toBe("datetime");
  });

  it("should identify 2024 as a leap year", async () => {
    const result = await executeTool(leapYearChecker, { input: "2024" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isLeapYear).toBe(true);
      expect(data.daysInYear).toBe(366);
      expect(data.daysInFeb).toBe(29);
    }
  });

  it("should identify 2023 as not a leap year", async () => {
    const result = await executeTool(leapYearChecker, { input: "2023" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isLeapYear).toBe(false);
      expect(data.daysInYear).toBe(365);
      expect(data.daysInFeb).toBe(28);
    }
  });

  it("should identify century years not divisible by 400 as non-leap", async () => {
    const result = await executeTool(leapYearChecker, { input: "1900" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isLeapYear).toBe(false);
    }
  });

  it("should identify 2000 as a leap year (divisible by 400)", async () => {
    const result = await executeTool(leapYearChecker, { input: "2000" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isLeapYear).toBe(true);
    }
  });

  it("should include nearby leap years", async () => {
    const result = await executeTool(leapYearChecker, { input: "2024" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Nearby leap years");
    }
  });

  it("should parse date string to get year", async () => {
    const result = await executeTool(leapYearChecker, {
      input: "2024-06-15T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.year).toBe(2024);
      expect(data.isLeapYear).toBe(true);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(leapYearChecker, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(leapYearChecker, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should show modulo calculations", async () => {
    const result = await executeTool(leapYearChecker, { input: "2024" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("% 4");
      expect((data.output as string)).toContain("% 100");
      expect((data.output as string)).toContain("% 400");
    }
  });
});
