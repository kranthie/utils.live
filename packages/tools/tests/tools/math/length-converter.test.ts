import { describe, it, expect } from "vitest";
import { lengthConverter } from "../../../src/tools/math/length-converter";
import { executeTool } from "../../../src/core/executor";

describe("lengthConverter", () => {
  it("should have correct metadata", () => {
    expect(lengthConverter.meta.id).toBe("math/length-converter");
    expect(lengthConverter.meta.category).toBe("math");
  });

  it("should convert km to miles", async () => {
    const result = await executeTool(
      lengthConverter,
      { input: "1" },
      { from: "km", to: "mi" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(0.621371, 3);
  });

  it("should convert meters to feet", async () => {
    const result = await executeTool(
      lengthConverter,
      { input: "1" },
      { from: "m", to: "ft" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(3.28084, 3);
  });

  it("should convert cm to inches", async () => {
    const result = await executeTool(
      lengthConverter,
      { input: "2.54" },
      { from: "cm", to: "in" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1, 3);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      lengthConverter,
      { input: "abc" },
      { from: "m", to: "ft" }
    );
    expect(result.success).toBe(false);
  });
});
