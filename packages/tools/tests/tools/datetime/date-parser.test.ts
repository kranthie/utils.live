import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dateParser } from "../../../src/tools/datetime/date-parser";

describe("Date Parser", () => {
  it("should parse an ISO date string", async () => {
    const result = await executeTool(dateParser, {
      input: "2024-06-15T14:30:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("2024");
    }
  });

  it("should parse a date-only string", async () => {
    const result = await executeTool(dateParser, { input: "2024-03-01" });
    expect(result.success).toBe(true);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(dateParser, { input: "xyz" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
    }
  });

  it("date-parser should be timezone-invariant: 2025-07-04 is year=2025 month=7 day=4 Friday", async () => {
    // Regression: getFullYear/getMonth/getDate/getDay used local time.
    // "2025-07-04" is UTC midnight; in PDT (UTC-7) it is Jul 3 (Thursday),
    // giving wrong year/month/day/dayOfWeek values.
    const result = await executeTool(dateParser, { input: "2025-07-04" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.year).toBe(2025);
      expect(data.month).toBe(7);
      expect(data.day).toBe(4);
      expect(data.dayOfWeek).toBe("Friday");
    }
  });
});
