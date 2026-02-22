import { describe, it, expect } from "vitest";
import { weightConverter } from "../../../src/tools/math/weight-converter";
import { executeTool } from "../../../src/core/executor";

describe("weightConverter", () => {
  it("should have correct metadata", () => {
    expect(weightConverter.meta.id).toBe("math/weight-converter");
    expect(weightConverter.meta.category).toBe("math");
  });

  it("should convert kg to lb", async () => {
    const result = await executeTool(
      weightConverter,
      { input: "1" },
      { from: "kg", to: "lb" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(2.20462, 3);
  });

  it("should convert grams to ounces", async () => {
    const result = await executeTool(
      weightConverter,
      { input: "28.3495" },
      { from: "g", to: "oz" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1, 2);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      weightConverter,
      { input: "not-a-number" },
      { from: "kg", to: "lb" }
    );
    expect(result.success).toBe(false);
  });
});
