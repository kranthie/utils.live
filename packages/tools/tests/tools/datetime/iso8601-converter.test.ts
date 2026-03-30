import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { iso8601Converter } from "../../../src/tools/datetime/iso8601-converter";

describe("ISO 8601 Converter", () => {
  it("should convert a date string to ISO formats", async () => {
    const result = await executeTool(iso8601Converter, {
      input: "2024-01-15T12:30:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).dateOnly).toBe(
        "2024-01-15"
      );
      expect((result.data as Record<string, unknown>).full).toBeDefined();
      expect((result.data as Record<string, unknown>).week).toBeDefined();
      expect((result.data as Record<string, unknown>).ordinal).toBeDefined();
    }
  });

  it("should handle Unix timestamp input", async () => {
    const result = await executeTool(iso8601Converter, { input: "1704067200" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).dateOnly).toBe(
        "2024-01-01"
      );
    }
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(iso8601Converter, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("ordinal should be timezone-invariant: 2025-01-01 is day 1 (2025-001)", async () => {
    // Regression: getDayOfYear used new Date(getFullYear(), 0, 0) — local epoch for
    // Jan 0 of the year. In PST, "2025-01-01" (UTC midnight) has getFullYear()=2024,
    // so start = Dec 31, 2023 08:00 UTC, giving ordinal day 365 of 2024 instead of
    // day 1 of 2025.
    const result = await executeTool(iso8601Converter, { input: "2025-01-01" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.ordinal).toBe("2025-001");
    }
  });
});
