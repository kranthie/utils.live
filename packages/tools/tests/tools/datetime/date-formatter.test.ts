import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dateFormatter } from "../../../src/tools/datetime/date-formatter";

describe("Date Formatter", () => {
  it("should format date with default pattern", async () => {
    const result = await executeTool(dateFormatter, {
      input: "2024-01-15T12:30:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("2024");
      expect((result.data as Record<string, unknown>).output).toContain("01");
      expect((result.data as Record<string, unknown>).output).toContain("15");
    }
  });

  it("should format with custom pattern", async () => {
    const result = await executeTool(
      dateFormatter,
      { input: "2024-06-15T14:30:00Z" },
      { format: "MMM DD, YYYY" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Jun");
      expect((result.data as Record<string, unknown>).output).toContain("2024");
    }
  });

  it("should handle timestamp input", async () => {
    // Use 1704110400 = 2024-01-01T12:00:00Z (midday to avoid timezone issues)
    const result = await executeTool(
      dateFormatter,
      { input: "1704110400" },
      { format: "YYYY-MM-DD" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "2024-01-01"
      );
    }
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(dateFormatter, { input: "not-a-date" });
    expect(result.success).toBe(false);
  });
});
