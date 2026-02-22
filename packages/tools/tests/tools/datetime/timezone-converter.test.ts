import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { timezoneConverter } from "../../../src/tools/datetime/timezone-converter";

describe("Timezone Converter", () => {
  it("should have correct metadata", () => {
    expect(timezoneConverter.meta.id).toBe("datetime/timezone-converter");
    expect(timezoneConverter.meta.category).toBe("datetime");
  });

  it("should convert between UTC and New York", async () => {
    const result = await executeTool(
      timezoneConverter,
      { input: "2024-01-01T12:00:00Z" },
      { fromTimezone: "UTC", toTimezone: "America/New_York" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.from).toBe("string");
      expect(typeof data.to).toBe("string");
      expect((data.output as string)).toContain("UTC");
      expect((data.output as string)).toContain("America/New_York");
    }
  });

  it("should convert between London and Tokyo", async () => {
    const result = await executeTool(
      timezoneConverter,
      { input: "2024-06-15T09:00:00Z" },
      { fromTimezone: "Europe/London", toTimezone: "Asia/Tokyo" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.from).toBe("string");
      expect(typeof data.to).toBe("string");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(timezoneConverter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(timezoneConverter, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid timezone", async () => {
    const result = await executeTool(
      timezoneConverter,
      { input: "2024-01-01T12:00:00Z" },
      { fromTimezone: "Invalid/Zone", toTimezone: "UTC" }
    );
    expect(result.success).toBe(false);
  });

  it("should handle unix timestamp", async () => {
    const result = await executeTool(
      timezoneConverter,
      { input: "1704067200" },
      { fromTimezone: "UTC", toTimezone: "America/New_York" }
    );
    expect(result.success).toBe(true);
  });
});
