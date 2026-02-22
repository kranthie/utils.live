import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { utcConverter } from "../../../src/tools/datetime/utc-converter";

describe("UTC Converter", () => {
  it("should have correct metadata", () => {
    expect(utcConverter.meta.id).toBe("datetime/utc-converter");
    expect(utcConverter.meta.category).toBe("datetime");
  });

  it("should convert to UTC", async () => {
    const result = await executeTool(
      utcConverter,
      { input: "2024-01-01T12:00:00Z" },
      { direction: "to-utc", timezone: "America/New_York" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.utc).toBe("string");
      expect(typeof data.local).toBe("string");
      expect((data.output as string)).toContain("UTC");
    }
  });

  it("should convert from UTC", async () => {
    const result = await executeTool(
      utcConverter,
      { input: "2024-01-01T12:00:00Z" },
      { direction: "from-utc", timezone: "Europe/London" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.utc).toBe("string");
      expect(typeof data.local).toBe("string");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(utcConverter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(utcConverter, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid timezone", async () => {
    const result = await executeTool(
      utcConverter,
      { input: "2024-01-01T12:00:00Z" },
      { direction: "to-utc", timezone: "Invalid/Zone" }
    );
    expect(result.success).toBe(false);
  });

  it("should show ISO string in output", async () => {
    const result = await executeTool(
      utcConverter,
      { input: "2024-01-01T12:00:00Z" },
      { direction: "to-utc", timezone: "UTC" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("ISO:");
    }
  });
});
