import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dateAddSubtract } from "../../../src/tools/datetime/date-add-subtract";

describe("Date Add/Subtract", () => {
  it("should have correct metadata", () => {
    expect(dateAddSubtract.meta.id).toBe("datetime/date-add-subtract");
    expect(dateAddSubtract.meta.category).toBe("datetime");
  });

  it("should add days to a date", async () => {
    const result = await executeTool(
      dateAddSubtract,
      { input: "2024-01-01T00:00:00Z" },
      { operation: "add", days: 10, years: 0, months: 0, weeks: 0, hours: 0, minutes: 0, seconds: 0 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.result).toBe("2024-01-11T00:00:00.000Z");
    }
  });

  it("should subtract months from a date", async () => {
    const result = await executeTool(
      dateAddSubtract,
      { input: "2024-06-15T00:00:00Z" },
      { operation: "subtract", months: 3, years: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.result).toBe("2024-03-15T00:00:00.000Z");
    }
  });

  it("should add years to a date", async () => {
    const result = await executeTool(
      dateAddSubtract,
      { input: "2024-01-01T00:00:00Z" },
      { operation: "add", years: 5, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.result).toBe("2029-01-01T00:00:00.000Z");
    }
  });

  it("should add weeks to a date", async () => {
    const result = await executeTool(
      dateAddSubtract,
      { input: "2024-01-01T00:00:00Z" },
      { operation: "add", weeks: 2, years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.result).toBe("2024-01-15T00:00:00.000Z");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(dateAddSubtract, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(dateAddSubtract, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should parse unix timestamp", async () => {
    const result = await executeTool(
      dateAddSubtract,
      { input: "1704067200" },
      { operation: "add", days: 1, years: 0, months: 0, weeks: 0, hours: 0, minutes: 0, seconds: 0 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.original).toBe("2024-01-01T00:00:00.000Z");
    }
  });

  it("should add hours and minutes", async () => {
    const result = await executeTool(
      dateAddSubtract,
      { input: "2024-01-01T00:00:00Z" },
      { operation: "add", hours: 5, minutes: 30, years: 0, months: 0, weeks: 0, days: 0, seconds: 0 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.result).toBe("2024-01-01T05:30:00.000Z");
    }
  });
});
