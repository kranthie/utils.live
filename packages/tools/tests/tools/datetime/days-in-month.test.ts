import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { daysInMonth } from "../../../src/tools/datetime/days-in-month";

describe("Days in Month", () => {
  it("should have correct metadata", () => {
    expect(daysInMonth.meta.id).toBe("datetime/days-in-month");
    expect(daysInMonth.meta.category).toBe("datetime");
  });

  it("should return 31 for January", async () => {
    const result = await executeTool(
      daysInMonth,
      { input: "1" },
      { year: 2024 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(31);
      expect(data.month).toBe(1);
    }
  });

  it("should return 29 for February in leap year", async () => {
    const result = await executeTool(
      daysInMonth,
      { input: "2" },
      { year: 2024 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(29);
    }
  });

  it("should return 28 for February in non-leap year", async () => {
    const result = await executeTool(
      daysInMonth,
      { input: "2" },
      { year: 2023 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(28);
    }
  });

  it("should parse YYYY-MM format", async () => {
    const result = await executeTool(daysInMonth, { input: "2024-4" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(30);
      expect(data.month).toBe(4);
      expect(data.year).toBe(2024);
    }
  });

  it("should parse full date string", async () => {
    const result = await executeTool(daysInMonth, {
      input: "2024-03-15T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(31);
    }
  });

  it("should be timezone-invariant: date string 2025-01-01 must give month=1 year=2025", async () => {
    // Regression: getMonth()/getFullYear() used local time. "2025-01-01" parses as
    // UTC midnight; in PST (UTC-8) that is Dec 2024, giving month=12 year=2024.
    const result = await executeTool(daysInMonth, { input: "2025-01-01" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.month).toBe(1);
      expect(data.year).toBe(2025);
      expect(data.days).toBe(31);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(daysInMonth, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(daysInMonth, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should return 30 for April", async () => {
    const result = await executeTool(
      daysInMonth,
      { input: "4" },
      { year: 2024 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(30);
    }
  });
});
