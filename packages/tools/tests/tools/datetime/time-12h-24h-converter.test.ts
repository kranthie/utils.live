import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { time12h24hConverter } from "../../../src/tools/datetime/time-12h-24h-converter";

describe("12h/24h Time Converter", () => {
  it("should have correct metadata", () => {
    expect(time12h24hConverter.meta.id).toBe(
      "datetime/time-12h-24h-converter"
    );
    expect(time12h24hConverter.meta.category).toBe("datetime");
  });

  it("should convert 24h to 12h (afternoon)", async () => {
    const result = await executeTool(time12h24hConverter, { input: "14:30" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.time12).toBe("2:30 PM");
      expect(data.time24).toBe("14:30");
    }
  });

  it("should convert 12h to 24h (PM)", async () => {
    const result = await executeTool(time12h24hConverter, {
      input: "2:30 PM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.time24).toBe("14:30");
      expect(data.time12).toBe("2:30 PM");
    }
  });

  it("should handle midnight (00:00)", async () => {
    const result = await executeTool(time12h24hConverter, { input: "00:00" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.time12).toBe("12:00 AM");
      expect(data.time24).toBe("00:00");
    }
  });

  it("should handle noon (12:00)", async () => {
    const result = await executeTool(time12h24hConverter, { input: "12:00" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.time12).toBe("12:00 PM");
      expect(data.time24).toBe("12:00");
    }
  });

  it("should handle 12:00 AM input", async () => {
    const result = await executeTool(time12h24hConverter, {
      input: "12:00 AM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.time24).toBe("00:00");
    }
  });

  it("should handle 12:00 PM input", async () => {
    const result = await executeTool(time12h24hConverter, {
      input: "12:00 PM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.time24).toBe("12:00");
    }
  });

  it("should handle time with seconds", async () => {
    const result = await executeTool(time12h24hConverter, {
      input: "14:30:45",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.time12).toBe("2:30:45 PM");
      expect(data.time24).toBe("14:30:45");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(time12h24hConverter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid time format", async () => {
    const result = await executeTool(time12h24hConverter, { input: "invalid" });
    expect(result.success).toBe(false);
  });
});
