import { describe, it, expect } from "vitest";
import { timeUnitConverter } from "../../../src/tools/math/time-unit-converter";
import { executeTool } from "../../../src/core/executor";

describe("timeUnitConverter", () => {
  it("should have correct metadata", () => {
    expect(timeUnitConverter.meta.id).toBe("math/time-unit-converter");
    expect(timeUnitConverter.meta.category).toBe("math");
  });

  it("should convert hours to minutes", async () => {
    const result = await executeTool(
      timeUnitConverter,
      { input: "1" },
      { from: "h", to: "min" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(60, 0);
  });

  it("should convert days to hours", async () => {
    const result = await executeTool(
      timeUnitConverter,
      { input: "1" },
      { from: "d", to: "h" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(24, 0);
  });

  it("should convert seconds to milliseconds", async () => {
    const result = await executeTool(
      timeUnitConverter,
      { input: "1" },
      { from: "s", to: "ms" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1000, 0);
  });
});
