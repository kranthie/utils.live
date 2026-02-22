import { describe, it, expect } from "vitest";
import { fuelEconomyConverter } from "../../../src/tools/math/fuel-economy-converter";
import { executeTool } from "../../../src/core/executor";

describe("fuelEconomyConverter", () => {
  it("should have correct metadata", () => {
    expect(fuelEconomyConverter.meta.id).toBe("math/fuel-economy-converter");
    expect(fuelEconomyConverter.meta.category).toBe("math");
  });

  it("should convert mpg to km/L", async () => {
    const result = await executeTool(
      fuelEconomyConverter,
      { input: "30" },
      { from: "mpg", to: "kmL" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(12.7543, 1);
  });

  it("should convert L/100km to mpg", async () => {
    const result = await executeTool(
      fuelEconomyConverter,
      { input: "7.84" },
      { from: "L100km", to: "mpg" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(30, 0);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      fuelEconomyConverter,
      { input: "abc" },
      { from: "mpg", to: "kmL" }
    );
    expect(result.success).toBe(false);
  });
});
